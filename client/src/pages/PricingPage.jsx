// client/src/pages/PricingPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, Sparkles, Tag, Clock } from "lucide-react";
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../lib/stripe';
import SubscriptionForm from '../components/SubscriptionForm';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { API_URL } from '../config';
import supabase from '../lib/supabase'; 

const PricingPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [checkoutMode, setCheckoutMode] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState(null);
    
    // Sale countdown timer state
    const [timeLeft, setTimeLeft] = useState({});
    
    // Calculate time left for the sale
    useEffect(() => {
      // Set the sale end date - e.g., May 15, 2025
      const saleEndDate = new Date("May 15, 2025 23:59:59").getTime();
      
      const calculateTimeLeft = () => {
        const now = new Date().getTime();
        const difference = saleEndDate - now;
        
        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
            minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
            seconds: Math.floor((difference % (1000 * 60)) / 1000)
          });
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        }
      };
      
      // Initial calculation
      calculateTimeLeft();
      
      // Update every second
      const timer = setInterval(calculateTimeLeft, 1000);
      
      // Cleanup
      return () => clearInterval(timer);
    }, []);
  
    useEffect(() => {
      // Check for Stripe session status in the URL
      const query = new URLSearchParams(location.search);
      const sessionId = query.get('session_id');
      
      if (sessionId) {
        // Verify the payment status with our server
        const verifyPayment = async () => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            
            const response = await fetch(`${API_URL}/subscriptions/verify-session?session_id=${sessionId}`, {
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              setPaymentStatus({
                status: 'success',
                message: data.message || 'Payment successful! Your subscription is now active.'
              });
              
              // Remove the session_id query parameter
              const newUrl = window.location.pathname;
              window.history.replaceState({}, document.title, newUrl);
              
              // Redirect to create page after a short delay
              setTimeout(() => {
                navigate('/create');
              }, 3000);
            } else {
              const errorData = await response.json();
              setPaymentStatus({
                status: 'error',
                message: errorData.error || 'Unable to verify payment status.'
              });
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            setPaymentStatus({
              status: 'error',
              message: 'Unable to verify payment status. Please contact support.'
            });
          }
        };
        
        verifyPayment();
      }
    }, [location, navigate]);
  
    // Updated plans to show original prices and sale prices
    const plans = [
      {
        id: 'pay-as-you-go',
        name: 'Pay-as-you-Go Pack',
        originalPrice: 14.99,
        price: 9.99,
        interval: 'one-time',
        description: 'Perfect for hobby sellers and occasional listings',
        features: ['15 image generations', 'All scene options', 'High-quality resolution'],
        credits: 15,
        popular: false,
        buttonText: 'Buy Pack',
        stripePriceId: 'price_1RIzGMDNIr7FzuSF8hVxsDz1',
        discount: 33  // 33% off
      },
      {
        id: 'starter',
        name: 'Starter',
        originalPrice: 29.99,
        price: 19.99,
        interval: 'month',
        description: 'Ideal for side-hustle Etsy & Shopify owners',
        features: ['50 images per month', 'All scene options', 'High-quality resolution', 'Email support'],
        credits: 50,
        popular: false,
        buttonText: 'Start Monthly',
        stripePriceId: 'price_1RIzGMDNIr7FzuSF8hVxsDz1',
        discount: 33  // 33% off
      },
      {
        id: 'pro',
        name: 'Pro',
        originalPrice: 69.99,
        price: 49.99,
        interval: 'month',
        description: 'For busy Shopify sellers and scaling businesses',
        features: ['200 images per month', 'All scene options', 'Premium resolution', 'Priority support'],
        credits: 200,
        popular: true,
        buttonText: 'Upgrade to Pro',
        stripePriceId: 'price_1RIzLQDNIr7FzuSFJ57hDFyF',
        discount: 28  // 28% off
      },
      {
        id: 'premium',
        name: 'Premium',
        originalPrice: 129.99,
        price: 99.99,
        interval: 'month',
        description: 'For full-time sellers, agencies, and power users',
        features: ['500 images per month', 'All scene options', 'Premium resolution', 'Priority support'],
        credits: 500,
        popular: false,
        buttonText: 'Go Premium',
        stripePriceId: 'price_1RIzMMDNIr7FzuSFNrGFFH19',
        discount: 23  // 23% off
      }
    ];
  
    const handleSelectPlan = (plan) => {
      // Show checkout form
      setSelectedPlan(plan);
      setCheckoutMode(true);
    };
  
    const renderCheckoutStatusMessage = () => {
      if (!paymentStatus) return null;
      
      return (
        <div className={`p-4 rounded-lg mb-6 text-center ${
          paymentStatus.status === 'success' 
            ? 'bg-green-100 text-green-800'
            : 'bg-pastel-pink/10 text-red-600'
        }`}>
          {paymentStatus.message}
        </div>
      );
    };
  
    return (
      <div className="min-h-screen bg-background text-charcoal dark:text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
              Simple, Transparent <span className="text-pastel-blue">Pricing</span>
            </h1>
            <p className="text-xl text-charcoal/70 dark:text-gray-300 max-w-2xl mx-auto">
              Choose the plan that fits your needs.
            </p>
          </div>
          
          {/* Sale Banner */}
          <div className="bg-gradient-to-r from-pastel-pink/20 to-pastel-blue/20 p-6 rounded-xl mb-12 border border-pastel-pink/30 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Tag className="h-5 w-5 text-pastel-pink" />
              <h2 className="text-2xl font-bold">Limited Time Sale</h2>
            </div>
            <p className="text-lg mb-4">Get up to 33% off all plans - our lowest prices of the year!</p>
            
            {/* Countdown Timer */}
            <div className="flex justify-center items-center gap-3 mb-2">
              <Clock className="h-5 w-5 text-pastel-blue" />
              <p className="font-medium">Sale ends in:</p>
              <div className="flex gap-2">
                <span className="px-2 py-1 bg-background rounded-md shadow-sm font-bold">{timeLeft.days || 0}d</span>:
                <span className="px-2 py-1 bg-background rounded-md shadow-sm font-bold">{timeLeft.hours || 0}h</span>:
                <span className="px-2 py-1 bg-background rounded-md shadow-sm font-bold">{timeLeft.minutes || 0}m</span>:
                <span className="px-2 py-1 bg-background rounded-md shadow-sm font-bold">{timeLeft.seconds || 0}s</span>
              </div>
            </div>
          </div>
  
          {/* Free Trial CTA Banner - Only show if user is not logged in */}
          {!user && (
            <div className="mb-16 bg-gradient-to-r from-pastel-blue/20 to-soft-lavender/20 rounded-xl p-8 shadow-sm border border-pastel-blue/20 max-w-4xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-3">Try It Free</h2>
              <p className="text-lg mb-5">
                Start with 3 free images and see the magic for yourself. No credit card required!
              </p>
              <button 
                onClick={() => navigate('/signup')}
                className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold text-lg py-3 px-8 rounded-full shadow-md inline-flex items-center"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                <span className="text-charcoal">Sign Up Free</span>
              </button>
            </div>
          )}
  
          {checkoutMode ? (
            <div className="max-w-md mx-auto">
              <div className="bg-background p-6 rounded-xl shadow-lg border border-border mb-4">
                <button 
                  onClick={() => setCheckoutMode(false)} 
                  className="text-charcoal hover:text-charcoal mb-4 font-medium"
                >
                  <span className="text-charcoal">← Back to plans</span>
                </button>
                <h2 className="text-2xl font-bold mb-2 text-charcoal dark:text-white">Subscribe to {selectedPlan.name}</h2>
                
                {/* Show discount price in checkout */}
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <p className="text-charcoal/70 dark:text-gray-300 line-through">${selectedPlan.originalPrice}/{selectedPlan.interval === 'month' ? 'mo' : 'one-time'}</p>
                    <p className="text-xl font-bold text-pastel-pink">${selectedPlan.price}/{selectedPlan.interval === 'month' ? 'mo' : 'one-time'}</p>
                    <span className="bg-pastel-pink/10 text-pastel-pink text-xs font-bold px-2 py-1 rounded-full">{selectedPlan.discount}% OFF</span>
                  </div>
                  <p className="text-xs text-charcoal/50 mt-1">Limited time offer - lock in this price now!</p>
                </div>
                
                {renderCheckoutStatusMessage()}
                
                <Elements stripe={stripePromise}>
                  <SubscriptionForm 
                    plan={selectedPlan} 
                    onSuccess={() => navigate('/create')} 
                    onError={(error) => console.error('Payment error:', error)}
                  />
                </Elements>
              </div>
            </div>
          ) : (
            /* Pricing Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`bg-background rounded-lg border flex flex-col ${
                    plan.popular 
                      ? 'border-pastel-blue shadow-lg scale-105 relative z-10' 
                      : 'border-border'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <span className="bg-pastel-blue text-charcoal text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                        MOST POPULAR
                      </span>
                    </div>
                  )}
                  
                  {/* Sale badge */}
                  <div className="absolute -top-2 -right-2">
                    <span className="bg-pastel-pink text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                      SAVE {plan.discount}%
                    </span>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="text-2xl font-semibold leading-none tracking-tight text-charcoal dark:text-white">
                      {plan.name}
                    </h3>
                    <div className="mt-2">
                      {/* Original price with strikethrough */}
                      <span className="text-lg line-through text-charcoal/50 dark:text-gray-400 mr-2">${plan.originalPrice}</span>
                      <span className="text-3xl font-bold text-charcoal dark:text-white">${plan.price}</span>
                      {plan.interval !== 'one-time' && (
                        <span className="text-charcoal/70 dark:text-gray-300 ml-1">/{plan.interval}</span>
                      )}
                    </div>
                    <p className="text-sm text-charcoal/70 dark:text-gray-300">{plan.description}</p>
                  </div>
                  
                  <div className="p-6 pt-0 flex-grow">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start">
                          <CheckIcon className="h-5 w-5 text-pastel-blue mr-2 flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-charcoal dark:text-white">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="flex items-center p-6 pt-0">
                    <button
                      onClick={() => handleSelectPlan(plan)}
                      className={`w-full py-2 px-4 rounded-md font-medium ${
                        plan.popular 
                          ? 'bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal' 
                          : 'bg-background border border-pastel-blue text-charcoal hover:bg-pastel-blue/10 dark:text-white'
                      }`}
                    >
                      <span className="text-charcoal dark:text-white">
                        {plan.id === 'pay-as-you-go' ? 'Buy Pack' : 
                         plan.id === 'starter' ? 'Start Monthly' :
                         plan.id === 'pro' ? 'Upgrade to Pro' : 'Go Premium'}
                      </span>
                    </button>
                  </div>
                  
                  {/* Limited time offer note */}
                  <div className="p-4 text-center">
                    <p className="text-xs text-pastel-pink font-medium">Limited time offer</p>
                  </div>
                </div>
              ))}
            </div>
          )}
  
          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center mb-10">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto grid gap-6">
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-semibold mb-2">What happens when I use all my credits?</h3>
                <p className="text-charcoal/70 dark:text-gray-300">
                  Once you've used all your credits, you can upgrade to a higher tier plan or purchase a one-time pack to continue generating images.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-charcoal/70 dark:text-gray-300">
                  Yes! You can cancel your subscription at any time. You'll continue to have access to your plan until the end of your current billing period.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-semibold mb-2">Do my unused credits roll over?</h3>
                <p className="text-charcoal/70 dark:text-gray-300">
                  Monthly subscription credits refresh at the beginning of each billing cycle and do not roll over. One-time pack credits never expire.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-xl shadow-sm border border-border">
                <h3 className="text-xl font-semibold mb-2">Will my subscription price increase after the sale?</h3>
                <p className="text-charcoal/70 dark:text-gray-300">
                  No! When you subscribe during our sale, you'll lock in the discounted price for as long as your subscription remains active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default PricingPage;