// client/src/components/UserCredits.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Zap, CreditCard, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';

const UserCredits = ({ credits, creditsLoading, subscription, onRefresh, error }) => {
  const [showWelcome, setShowWelcome] = useState(true);
  
  const hasSubscription = subscription && subscription.status === 'active';
  const isLowOnCredits = credits && credits.available_credits < 5;
  const totalCredits = credits?.total_credits_received || 0;
  const usedCredits = credits?.credits_used || 0;
  const availableCredits = credits?.available_credits || 0;
  const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;
  
  // Check if this is likely a new user with just free trial credits
  const isNewUser = totalCredits === 3 && usedCredits === 0;
  
  // Check localStorage on mount to see if welcome message was dismissed
  useEffect(() => {
    const wasWelcomeDismissed = localStorage.getItem('welcomeMessageDismissed') === 'true';
    if (wasWelcomeDismissed) {
      setShowWelcome(false);
    }
  }, []);
  
  // Handle closing welcome message
  const dismissWelcome = () => {
    setShowWelcome(false);
    // Store dismissal in localStorage
    localStorage.setItem('welcomeMessageDismissed', 'true');
  };

  if (creditsLoading) {
    return (
      <div className="flex items-center justify-center h-16 bg-background rounded-lg border border-border shadow-sm p-4">
        <div className="animate-pulse h-4 w-24 bg-pastel-blue/20 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center bg-pastel-pink/10 dark:bg-pastel-pink/20 rounded-lg border border-pastel-pink/30 p-4">
        <AlertCircle className="h-5 w-5 mr-2 text-pastel-pink" />
        <span className="text-sm text-red-600 dark:text-red-400">Error loading credits</span>
        {onRefresh && (
          <Button onClick={onRefresh} size="sm" variant="outline" className="ml-2">Retry</Button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-background rounded-lg border border-border shadow-sm p-4">
      {/* Free trial welcome message for new users */}
      {showWelcome && isNewUser && (
        <div className="mb-4 p-3 bg-pastel-blue/10 border border-pastel-blue/20 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-pastel-blue mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-charcoal dark:text-white">Welcome to PostoraAI!</h4>
              <p className="text-xs text-charcoal/70 dark:text-gray-300 mt-1">
                Your account has been activated with 3 free credits to get you started.
              </p>
              <div className="flex justify-between mt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => window.open('/create', '_self')}
                >
                  Create First Image
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="text-xs text-charcoal/50 dark:text-gray-400"
                  onClick={dismissWelcome}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <Zap className="h-4 w-4 mr-2 text-pastel-blue" />
          <h3 className="text-sm font-medium text-charcoal dark:text-white">Available Credits</h3>
        </div>
        {hasSubscription && (
          <div className="flex items-center bg-pastel-blue/10 dark:bg-pastel-blue/20 rounded-full px-2 py-0.5">
            <CreditCard className="h-3 w-3 mr-1 text-pastel-blue" />
            <span className="text-xs text-pastel-blue font-medium">
              {subscription.plan_id ? subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1) : 'Subscription'}
            </span>
          </div>
        )}
        {onRefresh && (
          <Button onClick={onRefresh} size="xs" variant="ghost" className="ml-2">↻</Button>
        )}
      </div>

      <div className="mb-2">
        <div className="text-3xl font-bold text-charcoal dark:text-white">
          {availableCredits}
        </div>
      </div>

      <div className="mb-3">
        <div className="h-2 w-full bg-light-gray/30 dark:bg-[#23262F]/60 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pastel-blue to-soft-lavender rounded-full"
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-charcoal/60 dark:text-gray-400">
          <span>{usedCredits} used</span>
          <span>{totalCredits} total</span>
        </div>
      </div>

      {isLowOnCredits && !hasSubscription && (
        <div className="bg-pastel-pink/10 dark:bg-pastel-pink/20 rounded-md p-2 mb-3 text-xs text-red-600 dark:text-red-400 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
          <span>Low on credits! Purchase more to continue creating.</span>
        </div>
      )}

      {hasSubscription ? (
        <div className="text-xs text-charcoal/70 dark:text-gray-300 mb-3">
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