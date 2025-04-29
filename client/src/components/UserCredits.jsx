// client/src/components/UserCredits.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { CreditCard, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { API_URL } from '../config';
import supabase from '../lib/supabase';

const UserCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }
        
        // Fetch user credits
        const creditsResponse = await fetch(`${API_URL}/users/credits`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!creditsResponse.ok) {
          const creditsData = await creditsResponse.json();
          if (creditsResponse.status === 404) {
            // No credits found, this is okay for new users
            setCredits({
              available_credits: 0,
              total_credits_received: 0,
              credits_used: 0
            });
          } else {
            throw new Error(creditsData.error || 'Failed to fetch credits');
          }
        } else {
          const creditsData = await creditsResponse.json();
          setCredits(creditsData);
        }
        
        // Fetch subscription information
        try {
          const subResponse = await fetch(`${API_URL}/users/subscription`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            }
          });
          
          if (subResponse.ok) {
            const subData = await subResponse.json();
            setSubscription(subData.subscription);
          }
        } catch (subErr) {
          console.error('Subscription fetch error:', subErr);
          // Don't fail the whole component if just subscription fetch fails
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16 bg-white rounded-lg border border-light-gray/40 shadow-sm p-4">
        <div className="animate-pulse h-4 w-24 bg-pastel-blue/20 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center bg-pastel-pink/10 rounded-lg border border-pastel-pink/30 p-4">
        <AlertCircle className="h-5 w-5 mr-2 text-pastel-pink" />
        <span className="text-sm text-red-600">Error loading credits</span>
      </div>
    );
  }

  // Display different UI based on subscription status
  const hasSubscription = subscription && subscription.status === 'active';
  const isLowOnCredits = credits && credits.available_credits < 5;

  return (
    <div className="bg-white rounded-lg border border-light-gray/40 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-charcoal">Your Credits</h3>
        {hasSubscription && (
          <div className="flex items-center bg-pastel-blue/10 rounded-full px-2 py-0.5">
            <CreditCard className="h-3 w-3 mr-1 text-pastel-blue" />
            <span className="text-xs text-pastel-blue font-medium">
              {subscription.plan_id ? subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1) : 'Subscription'}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <div className="text-2xl font-bold text-charcoal">
          {credits ? credits.available_credits : 0}
        </div>
        <div className="text-xs text-charcoal/60">
          {credits ? credits.total_credits_received : 0} total / {credits ? credits.credits_used : 0} used
        </div>
      </div>
      
      {isLowOnCredits && !hasSubscription && (
        <div className="bg-pastel-pink/10 rounded-md p-2 mb-3 text-xs text-red-600 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>Low on credits! Purchase more to continue creating.</span>
        </div>
      )}
      
      {hasSubscription ? (
        <div className="text-xs text-charcoal/70 mb-3">
          Your {subscription.plan_id} plan renews on {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'upcoming billing date'}
        </div>
      ) : (
        <Link to="/pricing">
          <Button variant="outline" size="sm" className="w-full">
            {isLowOnCredits ? 'Get More Credits' : 'Upgrade Plan'}
          </Button>
        </Link>
      )}
    </div>
  );
};

export default UserCredits;