// server/controllers/userController.js

const supabase   = require('../lib/supabase');
const stripe     = require('../lib/stripe');
const { addCredits } = require('../utils/creditUtils');

// Get current subscription information
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch at most one "active" subscription, newest first
    const { data: subs, error: fetchErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error('Error fetching subscription:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    const subscription = subs[0] || null;
    if (!subscription) {
      return res
        .status(200)
        .json({ message: 'No active subscription found', subscription: null });
    }

    // Optionally pull latest from Stripe
    let stripeSubscription = null;
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );
      } catch (stripeErr) {
        console.error('Error fetching Stripe subscription:', stripeErr);
      }
    }

    res.status(200).json({
      subscription: {
        ...subscription,
        stripe_data: stripeSubscription,
      },
    });
  } catch (err) {
    console.error('Error in getCurrentSubscription:', err);
    res.status(500).json({ error: 'Failed to fetch subscription information' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch the most recent active subscription (if any)
    const { data: subs, error: fetchErr } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error('Error fetching subscription:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }

    const subscription = subs[0];
    if (!subscription?.stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Instruct Stripe to cancel at period end
    const result = await stripe.subscriptions.update(
      subscription.stripe_subscription_id,
      { cancel_at_period_end: true }
    );

    // Persist that change back to Supabase
    const { error: updateErr } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancel_at:            result.cancel_at
                                ? new Date(result.cancel_at * 1000).toISOString()
                                : null,
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (updateErr) {
      console.error('Error updating subscription in DB:', updateErr);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }

    res.status(200).json({
      message:    'Subscription will be canceled at period end',
      cancelDate: result.cancel_at
                    ? new Date(result.cancel_at * 1000).toISOString()
                    : null,
    });
  } catch (err) {
    console.error('Error in cancelSubscription:', err);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get user credits and usage information
exports.getUserCredits = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch or create a single credits row
    const { data: credits, error: fetchErr } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchErr) {
      console.error('Error fetching user credits:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }

    if (!credits) {
      const { data: newCredits, error: insertErr } = await supabase
        .from('user_credits')
        .insert({
          user_id:                 userId,
          available_credits:       0,
          total_credits_received:  0,
          credits_used:            0,
          created_at:              new Date().toISOString(),
          updated_at:              new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error('Error creating user credits:', insertErr);
        return res.status(500).json({ error: 'Failed to create user credits' });
      }
      return res.status(200).json(newCredits);
    }

    res.status(200).json(credits);
  } catch (err) {
    console.error('Error in getUserCredits:', err);
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
};

// Add free trial credits for new users
exports.addFreeTrialCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const FREE_TRIAL_CREDITS = 3; // Number of free credits to give
    
    // Check if this user has already received free credits
    const { data: credits, error: fetchErr } = await supabase
      .from('user_credits')
      .select('available_credits, total_credits_received')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchErr) {
      console.error('Error fetching user credits:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch user credits' });
    }
    
    // If user already has credits, or has received credits before, don't give them free credits again
    if (credits && (credits.available_credits > 0 || credits.total_credits_received > 0)) {
      return res.status(409).json({ 
        message: 'User already has credits',
        credits: credits
      });
    }
    
    // Add free trial credits
    const success = await addCredits(
      userId, 
      FREE_TRIAL_CREDITS, 
      'free_trial', 
      { reason: 'New user free trial' }
    );
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to add free trial credits' });
    }
    
    // Get updated credits
    const { data: updatedCredits, error: getErr } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (getErr) {
      console.error('Error fetching updated user credits:', getErr);
      return res.status(200).json({ 
        message: 'Free trial credits added successfully',
        credits: { available_credits: FREE_TRIAL_CREDITS }
      });
    }
    
    return res.status(200).json({
      message: 'Free trial credits added successfully',
      credits: updatedCredits
    });
    
  } catch (err) {
    console.error('Error in addFreeTrialCredits:', err);
    res.status(500).json({ error: 'Failed to add free trial credits' });
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit  = parseInt(req.query.limit, 10)  || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const { data: transactions, error: fetchErr } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (fetchErr) {
      console.error('Error fetching transaction history:', fetchErr);
      return res.status(500).json({ error: 'Failed to fetch transaction history' });
    }

    res.status(200).json({
      transactions,
      pagination: {
        limit,
        offset,
        total: transactions.length,
      },
    });
  } catch (err) {
    console.error('Error in getTransactionHistory:', err);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};