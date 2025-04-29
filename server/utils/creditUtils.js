// server/utils/creditUtils.js
const supabase = require('../lib/supabase');

/**
 * Check if a user has sufficient credits
 * @param {string} userId - The user ID
 * @param {number} requiredCredits - Number of credits required
 * @returns {Promise<boolean>} - Whether the user has sufficient credits
 */
async function hasEnoughCredits(userId, requiredCredits = 1) {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('available_credits')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking user credits:', error);
      return false;
    }
    
    if (!data) {
      // User has no credits record
      return false;
    }
    
    return data.available_credits >= requiredCredits;
  } catch (error) {
    console.error('Error in hasEnoughCredits:', error);
    return false;
  }
}

/**
 * Deduct credits from a user's account
 * @param {string} userId - The user ID
 * @param {number} amount - Number of credits to deduct
 * @param {string} reason - Reason for deduction
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} - Whether the deduction was successful
 */
async function deductCredits(userId, amount = 1, reason = 'image_generation', metadata = {}) {
  try {
    console.log(`===== DEDUCT CREDITS FUNCTION =====`);
    console.log(`User ID: ${userId}, Amount: ${amount}, Reason: ${reason}`);
    
    // Check if user has a credit record
    const { data: existingCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('available_credits, credits_used')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      console.log(`===== DEDUCTION FAILED: DB FETCH ERROR =====`);
      return false;
    }
    
    console.log(`Existing credits found: ${JSON.stringify(existingCredits)}`);
    
    // If no credit record or not enough credits, return false
    if (!existingCredits) {
      console.log(`===== DEDUCTION FAILED: NO CREDIT RECORD =====`);
      return false;
    }
    
    if (existingCredits.available_credits < amount) {
      console.log(`===== DEDUCTION FAILED: INSUFFICIENT CREDITS =====`);
      console.log(`Available: ${existingCredits.available_credits}, Needed: ${amount}`);
      return false;
    }
    
    // Update credits - manually instead of using RPC function
    const newAvailableCredits = existingCredits.available_credits - amount;
    const newCreditsUsed = existingCredits.credits_used + amount;
    
    console.log(`Updating credits: Available ${existingCredits.available_credits} -> ${newAvailableCredits}, Used ${existingCredits.credits_used} -> ${newCreditsUsed}`);
    
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        available_credits: newAvailableCredits,
        credits_used: newCreditsUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    if (updateError) {
      console.error('Error updating credits:', updateError);
      console.log(`===== DEDUCTION FAILED: UPDATE ERROR =====`);
      return false;
    }
    
    console.log(`Credits successfully updated in database`);
    
    // Record the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -amount, // Negative for deduction
        transaction_type: reason,
        metadata
      });
    
    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
      console.log(`Transaction recording failed, but credit update succeeded`);
      // We don't want to fail the entire operation if just the recording fails
    } else {
      console.log(`Transaction recorded successfully`);
    }
    
    console.log(`===== DEDUCTION SUCCESSFUL =====`);
    return true;
  } catch (error) {
    console.error('Error in deductCredits:', error);
    console.log(`===== DEDUCTION FAILED: EXCEPTION =====`);
    return false;
  }
}

/**
 * Get a user's current credit balance
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - Credit information or null if error
 */
async function getUserCredits(userId) {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching user credits:', error);
      return null;
    }
    
    // If no credits record, return default
    if (!data) {
      return {
        user_id: userId,
        available_credits: 0,
        total_credits_received: 0,
        credits_used: 0
      };
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserCredits:', error);
    return null;
  }
}

/**
 * Add credits to a user's account
 * @param {string} userId - The user ID
 * @param {number} amount - Number of credits to add
 * @param {string} reason - Reason for addition
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<boolean>} - Whether the addition was successful
 */
async function addCredits(userId, amount, reason = 'manual_addition', metadata = {}) {
  try {
    // Check if user has a credit record
    const { data: existingCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error fetching user credits:', fetchError);
      return false;
    }
    
    let updateError;
    
    // Insert or update user credits
    if (!existingCredits) {
      // Create new credit record
      const { error } = await supabase
        .from('user_credits')
        .insert({
          user_id: userId,
          available_credits: amount,
          total_credits_received: amount,
          credits_used: 0
        });
      
      updateError = error;
    } else {
      // Update existing record
      const { error } = await supabase
        .from('user_credits')
        .update({
          available_credits: existingCredits.available_credits + amount,
          total_credits_received: existingCredits.total_credits_received + amount,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      updateError = error;
    }
    
    if (updateError) {
      console.error('Error updating credits:', updateError);
      return false;
    }
    
    // Record the transaction
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: amount, // Positive for addition
        transaction_type: reason,
        metadata
      });
    
    if (transactionError) {
      console.error('Error recording credit transaction:', transactionError);
      // We don't want to fail the entire operation if just the recording fails
    }
    
    return true;
  } catch (error) {
    console.error('Error in addCredits:', error);
    return false;
  }
}

/**
 * Get a user's transaction history
 * @param {string} userId - The user ID
 * @param {number} limit - Number of transactions to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array|null>} - Transaction history or null if error
 */
async function getTransactionHistory(userId, limit = 10, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error('Error fetching transaction history:', error);
      return null;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTransactionHistory:', error);
    return null;
  }
}

/**
 * Ensure a user has a credit record, creating one with default credits if needed
 * @param {string} userId - The user ID 
 * @param {number} defaultCredits - Default credits to add for new users
 * @returns {Promise<boolean>} - Whether the user has a credit record
 */
async function ensureUserHasCredits(userId, defaultCredits = 10) {
  try {
    console.log(`===== ENSURING USER HAS CREDITS =====`);
    console.log(`User ID: ${userId}`);
    
    // Check if user already has a credit record
    const { data: existingCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking if user has credits:', fetchError);
      return false;
    }
    
    // If record exists, we're good
    if (existingCredits) {
      console.log(`User already has credit record: ${JSON.stringify(existingCredits)}`);
      return true;
    }
    
    // Otherwise, create a new credit record with default credits
    console.log(`Creating new credit record for user with ${defaultCredits} default credits`);
    
    const { error: insertError } = await supabase
      .from('user_credits')
      .insert({
        user_id: userId,
        available_credits: defaultCredits,
        total_credits_received: defaultCredits,
        credits_used: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error creating user credit record:', insertError);
      return false;
    }
    
    // Record the transaction for the initial credits
    const { error: transactionError } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: defaultCredits,
        transaction_type: 'initial_credits',
        metadata: { reason: 'New user welcome credits' }
      });
    
    if (transactionError) {
      console.error('Error recording initial credit transaction:', transactionError);
      // Continue anyway
    }
    
    console.log(`Successfully created credit record for user with ${defaultCredits} credits`);
    return true;
  } catch (error) {
    console.error('Error in ensureUserHasCredits:', error);
    return false;
  }
}

module.exports = {
  hasEnoughCredits,
  deductCredits,
  getUserCredits,
  addCredits,
  getTransactionHistory,
  ensureUserHasCredits
};