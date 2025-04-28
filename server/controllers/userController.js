// server/controllers/userController.js
const supabase = require('../lib/supabase');
const stripe = require('../lib/stripe');
const creditUtils = require('../utils/creditUtils');

// Get current subscription information
exports.getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }
    
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    
    // If we have a Stripe subscription ID, get the latest details from Stripe
    let stripeSubscription = null;
    
    if (subscription.stripe_subscription_id) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
        // Continue with the Supabase data only
      }
    }
    
    res.status(200).json({
      subscription: {
        ...subscription,
        stripe_data: stripeSubscription
      }
    });
  } catch (error) {
    console.error('Error getting current subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription information' });
  }
};

// Cancel subscription
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's current subscription
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();
    
    if (error) {
      console.error('Error fetching subscription:', error);
      return res.status(500).json({ error: 'Failed to fetch subscription' });
    }
    
    if (!subscription || !subscription.stripe_subscription_id) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    // Cancel the subscription at the end of the current period
    const result = await stripe.subscriptions.update(subscription.stripe_subscription_id, {
      cancel_at_period_end: true
    });
    
    // Update the subscription in the database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        cancel_at: result.cancel_at ? new Date(result.cancel_at * 1000).toISOString() : null
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);
    
    if (updateError) {
      console.error('Error updating subscription:', updateError);
      return res.status(500).json({ error: 'Failed to update subscription' });
    }
    
    res.status(200).json({
      message: 'Subscription will be canceled at the end of the current billing period',
      cancelDate: result.cancel_at ? new Date(result.cancel_at * 1000).toISOString() : null
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

// Get user credits and usage information
exports.getUserCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's credit information
    const credits = await creditUtils.getUserCredits(userId);
    
    if (!credits) {
      return res.status(404).json({ error: 'No credits found' });
    }
    
    res.status(200).json(credits);
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ error: 'Failed to fetch user credits' });
  }
};

// Get user's transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;
    
    const transactions = await creditUtils.getTransactionHistory(userId, limit, offset);
    
    if (!transactions) {
      return res.status(404).json({ error: 'No transactions found' });
    }
    
    res.status(200).json({
      transactions,
      pagination: {
        limit,
        offset,
        total: transactions.length // This is not accurate for total count, just a placeholder
      }
    });
  } catch (error) {
    console.error('Error getting transaction history:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

