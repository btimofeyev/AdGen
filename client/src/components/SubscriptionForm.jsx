// client/src/components/SubscriptionForm.jsx
import React, { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { API_URL } from '../config';
import supabase from '../lib/supabase';

const SubscriptionForm = ({ plan, onSuccess, onError }) => {
  const { user } = useAuth();
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async () => {
    if (!user || !stripe) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      // Get the success and cancel URLs based on current location
      const successUrl = `${window.location.origin}/create?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = window.location.href;
      
      // Create checkout session
      const response = await fetch(`${API_URL}/subscriptions/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          planId: plan.id,
          successUrl,
          cancelUrl
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }
      
      const { sessionId } = await response.json();
      
      // Redirect to Stripe Checkout
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId
      });
      
      if (redirectError) {
        throw redirectError;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.message);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={handleCheckout}
        disabled={!stripe || loading}
        className="w-full py-2 px-4 rounded-md font-medium bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal disabled:opacity-50"
      >
        <span className="text-charcoal">
          {loading 
            ? 'Processing...' 
            : plan.interval === 'one-time'
              ? `Pay $${plan.price}`
              : `Subscribe for $${plan.price}/${plan.interval}`
          }
        </span>
      </button>
      
      <p className="mt-4 text-xs text-charcoal/60 text-center">
        Secure payment powered by Stripe. Your payment information is encrypted.
      </p>
    </div>
  );
};

export default SubscriptionForm;