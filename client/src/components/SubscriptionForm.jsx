import React, { useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import supabase from '../lib/supabase';

const SubscriptionForm = ({ plan, onSuccess, onError }) => {
  const { user } = useAuth();
  const stripe = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  const handleCheckout = async () => {
    if (!user || !stripe) {
      setError("Unable to initialize payment - please refresh the page and try again");
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      setDebugInfo(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        throw new Error(`Session error: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session - please log in again');
      }
      
      const successUrl = `${window.location.origin}/create?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = window.location.href;
      
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
        let errorMessage = 'Failed to create checkout session';
        let errorDetails = {};
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData;
        } catch (parseError) {
          errorDetails = { 
            parseError: 'Could not parse error response',
            status: response.status,
            statusText: response.statusText
          };
        }
        
        setDebugInfo(errorDetails);
        throw new Error(errorMessage);
      }
      
      const { sessionId } = await response.json();
      
      if (!sessionId) {
        throw new Error('No session ID returned from server');
      }
      
      const { error: redirectError } = await stripe.redirectToCheckout({
        sessionId
      });
      
      if (redirectError) {
        const detailedError = {
          type: redirectError.type,
          code: redirectError.code,
          message: redirectError.message,
          decline_code: redirectError.decline_code,
          doc_url: redirectError.doc_url,
          param: redirectError.param
        };
        
        setDebugInfo(detailedError);
        throw redirectError;
      }
    } catch (err) {
      let errorMessage = err.message || 'An unexpected error occurred';
      
      if (err.type === 'card_error') {
        errorMessage = `Card error: ${err.message}`;
      } else if (err.type === 'validation_error') {
        errorMessage = `Validation error: ${err.message}`;
      } else if (err.type === 'invalid_request_error') {
        errorMessage = `Request error: ${err.message}`;
      }
      
      setError(errorMessage);
      if (onError) onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-md text-red-600 text-sm">
          <p className="font-medium">{error}</p>
          {debugInfo && (
            <div className="mt-2 text-xs">
              <p>Error details: {JSON.stringify(debugInfo, null, 2)}</p>
              <p className="mt-1">If this problem persists, please contact support with this information.</p>
            </div>
          )}
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