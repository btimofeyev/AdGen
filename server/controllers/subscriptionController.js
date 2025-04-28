// server/controllers/subscriptionController.js
const stripe = require('../lib/stripe');
const supabase = require('../lib/supabase');
const dotenv = require('dotenv');
dotenv.config();

// Create a Stripe Checkout session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { priceId, planId, successUrl, cancelUrl } = req.body;
    const userId = req.user.id;
    
    if (!priceId || !planId || !successUrl || !cancelUrl) {
      return res.status(400).json({ 
        error: 'Price ID, Plan ID, success URL, and cancel URL are required' 
      });
    }
    
    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }
    
    // Check if customer exists in Stripe
    let { data: customerData, error: customerError } = await supabase
      .from('user_payment_details')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let customerId;
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
    
    // If customer doesn't exist, create one
    if (!customerData || !customerData.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: userId
        }
      });
      
      customerId = customer.id;
      
      // Save customer ID to database
      const { error: saveError } = await supabase
        .from('user_payment_details')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId
        });
      
      if (saveError) {
        console.error('Error saving customer data:', saveError);
        return res.status(500).json({ error: 'Failed to save customer data' });
      }
    } else {
      customerId = customerData.stripe_customer_id;
    }
    
    // Determine if this is a subscription or one-time payment
    const isSubscription = planId !== 'pay-as-you-go';
    
    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        }
      ],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    });
    
    res.status(200).json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Verify Stripe Checkout session status
exports.verifySession = async (req, res) => {
  try {
    const { session_id } = req.query;
    const userId = req.user.id;
    
    if (!session_id) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Verify that this session belongs to the current user
    if (session.metadata.user_id !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Check session payment status
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }
    
    // For one-time purchases (paygo packs), process credits
    if (session.mode === 'payment') {
      const planId = session.metadata.plan_id;
      let credits = 0;
      
      // Determine credits based on the plan
      if (planId === 'pay-as-you-go') {
        credits = 15; // Hardcoded from the payment plans
      }
      
      if (credits > 0) {
        // Update user's credits
        const { data: userData, error: userError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (userError) {
          console.error('Error fetching user credits:', userError);
          return res.status(500).json({ error: 'Failed to fetch user credits' });
        }
        
        // Insert or update user credits
        if (!userData) {
          await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              available_credits: credits,
              total_credits_received: credits,
              credits_used: 0
            });
        } else {
          await supabase
            .from('user_credits')
            .update({
              available_credits: userData.available_credits + credits,
              total_credits_received: userData.total_credits_received + credits
            })
            .eq('user_id', userId);
        }
        
        // Record the purchase
        await supabase
          .from('purchases')
          .insert({
            user_id: userId,
            stripe_payment_intent_id: session.payment_intent,
            plan_id: planId,
            amount: session.amount_total,
            currency: session.currency,
            metadata: {
              credits
            }
          });
        
        // Record credit transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            transaction_type: 'purchase',
            metadata: {
              payment_intent_id: session.payment_intent,
              plan_id: planId
            }
          });
      }
    }
    
    // For subscriptions, ensure subscription record exists
    if (session.mode === 'subscription') {
      const planId = session.metadata.plan_id;
      const subscriptionId = session.subscription;
      
      // Get the Stripe subscription
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      
      // Get plan details for credit allocation
      let credits = 0;
      
      switch (planId) {
        case 'starter':
          credits = 50;
          break;
        case 'pro':
          credits = 200;
          break;
        case 'premium':
          credits = 400;
          break;
        default:
          credits = 0;
      }
      
      // Check if subscription record exists
      const { data: existingSubscription, error: subError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .maybeSingle();
      
      if (subError) {
        console.error('Error checking subscription:', subError);
        return res.status(500).json({ error: 'Failed to check subscription' });
      }
      
      // Create subscription record if it doesn't exist
      if (!existingSubscription) {
        await supabase
          .from('subscriptions')
          .insert({
            user_id: userId,
            stripe_subscription_id: subscriptionId,
            plan_id: planId,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            metadata: {
              credits_per_cycle: credits
            }
          });
        
        // Update user's credits
        const { data: userData, error: userError } = await supabase
          .from('user_credits')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        if (userError) {
          console.error('Error fetching user credits:', userError);
          return res.status(500).json({ error: 'Failed to fetch user credits' });
        }
        
        // Insert or update user credits
        if (!userData) {
          await supabase
            .from('user_credits')
            .insert({
              user_id: userId,
              available_credits: credits,
              total_credits_received: credits,
              credits_used: 0
            });
        } else {
          await supabase
            .from('user_credits')
            .update({
              available_credits: userData.available_credits + credits,
              total_credits_received: userData.total_credits_received + credits
            })
            .eq('user_id', userId);
        }
        
        // Record credit transaction
        await supabase
          .from('credit_transactions')
          .insert({
            user_id: userId,
            amount: credits,
            transaction_type: 'subscription_renewal',
            metadata: {
              subscription_id: subscriptionId,
              plan_id: planId
            }
          });
      }
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Payment successful! Your credits have been added.'
    });
  } catch (error) {
    console.error('Error verifying session:', error);
    res.status(500).json({ error: error.message });
  }
};

// Create a new subscription
exports.createSubscription = async (req, res) => {
  try {
    const { priceId, planId } = req.body;
    const userId = req.user.id;
    
    if (!priceId || !planId) {
      return res.status(400).json({ error: 'Price ID and Plan ID are required' });
    }
    
    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }
    
    // Check if user already has an active subscription
    const { data: existingSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (subError) {
      console.error('Error checking existing subscription:', subError);
      return res.status(500).json({ error: 'Failed to check subscription status' });
    }
    
    if (existingSubscription) {
      return res.status(400).json({ 
        error: 'You already have an active subscription. Please cancel it before subscribing to a new plan.' 
      });
    }
    
    // Check if customer exists in Stripe
    let { data: customerData, error: customerError } = await supabase
      .from('user_payment_details')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let customerId;
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
    
    // If customer doesn't exist, create one
    if (!customerData || !customerData.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: userId
        }
      });
      
      customerId = customer.id;
      
      // Save customer ID to database
      const { error: saveError } = await supabase
        .from('user_payment_details')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId
        });
      
      if (saveError) {
        console.error('Error saving customer data:', saveError);
        return res.status(500).json({ error: 'Failed to save customer data' });
      }
    } else {
      customerId = customerData.stripe_customer_id;
    }
    
    // Create a SetupIntent for the subscription
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      metadata: {
        user_id: userId,
        price_id: priceId,
        plan_id: planId
      }
    });
    
    res.status(200).json({ 
      clientSecret: setupIntent.client_secret,
      customerId
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: error.message });
  }
};

// Finalize subscription after payment method is confirmed
exports.finalizeSubscription = async (req, res) => {
  try {
    const { paymentMethodId, priceId, planId } = req.body;
    const userId = req.user.id;
    
    if (!paymentMethodId || !priceId) {
      return res.status(400).json({ error: 'Payment method ID and price ID are required' });
    }
    
    // Get customer ID
    const { data: customerData, error: customerError } = await supabase
      .from('user_payment_details')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    if (customerError || !customerData?.stripe_customer_id) {
      console.error('Error fetching customer data:', customerError);
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
    
    const customerId = customerData.stripe_customer_id;
    
    // Attach payment method to customer
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });
    
    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId
      }
    });
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    });
    
    // Get plan details for credit allocation
    let credits = 0;
    
    switch (planId) {
      case 'starter':
        credits = 50;
        break;
      case 'pro':
        credits = 200;
        break;
      case 'premium':
        credits = 400;
        break;
      default:
        credits = 0;
    }
    
    // Save subscription to database
    const { error: subscriptionError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan_id: planId,
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        metadata: {
          credits_per_cycle: credits
        }
      });
    
    if (subscriptionError) {
      console.error('Error saving subscription:', subscriptionError);
      return res.status(500).json({ error: 'Failed to save subscription data' });
    }
    
    // Update user's credits
    const { data: userData, error: userError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user credits:', userError);
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }
    
    // Insert or update user credits
    if (!userData) {
      const { error: creditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          available_credits: credits,
          total_credits_received: credits,
          credits_used: 0
        });
      
      if (creditsError) {
        console.error('Error creating user credits:', creditsError);
        return res.status(500).json({ error: 'Failed to create user credits' });
      }
    } else {
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          available_credits: userData.available_credits + credits,
          total_credits_received: userData.total_credits_received + credits
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user credits:', updateError);
        return res.status(500).json({ error: 'Failed to update user credits' });
      }
    }
    
    // Record credit transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        transaction_type: 'subscription_renewal',
        metadata: {
          subscription_id: subscription.id,
          plan_id: planId
        }
      });
    
    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
    }
    
    res.status(200).json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end
      },
      credits
    });
  } catch (error) {
    console.error('Error finalizing subscription:', error);
    res.status(500).json({ error: error.message });
  }
};

// Activate free plan (3 images)
exports.activateFreePlan = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user already has credits
    const { data: userData, error: userError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user credits:', userError);
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }
    
    // Only give free credits if user doesn't have any yet
    if (!userData) {
      const freeCredits = 3;
      
      const { error: creditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          available_credits: freeCredits,
          total_credits_received: freeCredits,
          credits_used: 0
        });
      
      if (creditsError) {
        console.error('Error creating user credits:', creditsError);
        return res.status(500).json({ error: 'Failed to create user credits' });
      }
      
      // Record credit transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: userId,
          amount: freeCredits,
          transaction_type: 'free_trial',
          metadata: {
            plan_id: 'free'
          }
        });
      
      if (transactionError) {
        console.error('Error recording credit transaction:', transactionError);
      }
      
      res.status(200).json({
        message: 'Free trial activated successfully',
        credits: freeCredits
      });
    } else {
      res.status(400).json({
        error: 'You have already activated your free trial or have existing credits',
        currentCredits: userData.available_credits
      });
    }
  } catch (error) {
    console.error('Error activating free plan:', error);
    res.status(500).json({ error: error.message });
  }
};

// Process one-time purchases
exports.createOneTimePurchase = async (req, res) => {
  try {
    const { priceId, planId } = req.body;
    const userId = req.user.id;
    
    if (!priceId || !planId) {
      return res.status(400).json({ error: 'Price ID and Plan ID are required' });
    }
    
    // Get user email from Supabase
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return res.status(500).json({ error: 'Failed to fetch user data' });
    }
    
    // Check if customer exists in Stripe
    let { data: customerData, error: customerError } = await supabase
      .from('user_payment_details')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let customerId;
    
    if (customerError) {
      console.error('Error fetching customer data:', customerError);
      return res.status(500).json({ error: 'Failed to fetch customer data' });
    }
    
    // If customer doesn't exist, create one
    if (!customerData || !customerData.stripe_customer_id) {
      const customer = await stripe.customers.create({
        email: userData.email,
        metadata: {
          user_id: userId
        }
      });
      
      customerId = customer.id;
      
      // Save customer ID to database
      const { error: saveError } = await supabase
        .from('user_payment_details')
        .insert({
          user_id: userId,
          stripe_customer_id: customerId
        });
      
      if (saveError) {
        console.error('Error saving customer data:', saveError);
        return res.status(500).json({ error: 'Failed to save customer data' });
      }
    } else {
      customerId = customerData.stripe_customer_id;
    }
    
    // Get plan details for credit allocation
    let credits = 0;
    let amount = 0;
    
    if (planId === 'pay-as-you-go') {
      credits = 15;
      amount = 1000; // $10.00
    } else {
      return res.status(400).json({ error: 'Invalid plan ID for one-time purchase' });
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      metadata: {
        user_id: userId,
        plan_id: planId,
        credits
      }
    });
    
    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret,
      customerId
    });
  } catch (error) {
    console.error('Error creating one-time purchase:', error);
    res.status(500).json({ error: error.message });
  }
};

// Handle webhook events from Stripe
exports.webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  // Handle specific event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentIntentSucceeded(event.data.object);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  res.status(200).json({ received: true });
};

// Helper for handling payment intent succeeded events
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    const userId = paymentIntent.metadata.user_id;
    const planId = paymentIntent.metadata.plan_id;
    const credits = parseInt(paymentIntent.metadata.credits, 10) || 0;
    
    if (!userId || !credits) {
      console.error('Missing metadata in payment intent:', paymentIntent.id);
      return;
    }
    
    // Record the purchase
    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: paymentIntent.id,
        plan_id: planId,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: {
          credits
        }
      });
    
    if (purchaseError) {
      console.error('Error recording purchase:', purchaseError);
      return;
    }
    
    // Update user's credits
    const { data: userData, error: userError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user credits:', userError);
      return;
    }
    
    // Insert or update user credits
    if (!userData) {
      const { error: creditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          available_credits: credits,
          total_credits_received: credits,
          credits_used: 0
        });
      
      if (creditsError) {
        console.error('Error creating user credits:', creditsError);
        return;
      }
    } else {
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          available_credits: userData.available_credits + credits,
          total_credits_received: userData.total_credits_received + credits
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user credits:', updateError);
        return;
      }
    }
    
    // Record credit transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        transaction_type: 'purchase',
        metadata: {
          payment_intent_id: paymentIntent.id,
          plan_id: planId
        }
      });
    
    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
    }
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error);
  }
}

// Helper for handling invoice paid events
async function handleInvoicePaid(invoice) {
  try {
    // Skip if not a subscription invoice
    if (!invoice.subscription) return;
    
    // Get subscription to access metadata
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    const userId = subscription.metadata.user_id;
    const planId = subscription.metadata.plan_id;
    
    if (!userId || !planId) {
      console.error('Missing metadata in subscription:', subscription.id);
      return;
    }
    
    // Update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        last_invoice_id: invoice.id
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (subError) {
      console.error('Error updating subscription:', subError);
      return;
    }
    
    // Determine credits to add based on plan
    let credits = 0;
    switch (planId) {
      case 'starter':
        credits = 50;
        break;
      case 'pro':
        credits = 200;
        break;
      case 'premium':
        credits = 400;
        break;
      default:
        console.error('Unknown plan ID:', planId);
        return;
    }
    
    // Update user's credits
    const { data: userData, error: userError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (userError) {
      console.error('Error fetching user credits:', userError);
      return;
    }
    
    // Insert or update user credits
    if (!userData) {
      const { error: creditsError } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          available_credits: credits,
          total_credits_received: credits,
          credits_used: 0
        });
      
      if (creditsError) {
        console.error('Error creating user credits:', creditsError);
        return;
      }
    } else {
      const { error: updateError } = await supabase
        .from('user_credits')
        .update({
          available_credits: userData.available_credits + credits,
          total_credits_received: userData.total_credits_received + credits
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating user credits:', updateError);
        return;
      }
    }
    
    // Record credit transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: credits,
        transaction_type: 'subscription_renewal',
        metadata: {
          subscription_id: subscription.id,
          invoice_id: invoice.id,
          plan_id: planId
        }
      });
    
    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
    }
  } catch (error) {
    console.error('Error handling invoice paid:', error);
  }
}

// Helper for handling subscription updated events
async function handleSubscriptionUpdated(subscription) {
  try {
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('Missing user_id in subscription metadata:', subscription.id);
      return;
    }
    
    // Update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (subError) {
      console.error('Error updating subscription:', subError);
    }
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

// Helper for handling subscription deleted events
async function handleSubscriptionDeleted(subscription) {
  try {
    const userId = subscription.metadata.user_id;
    
    if (!userId) {
      console.error('Missing user_id in subscription metadata:', subscription.id);
      return;
    }
    
    // Update subscription record
    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
    
    if (subError) {
      console.error('Error updating subscription status:', subError);
    }
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}