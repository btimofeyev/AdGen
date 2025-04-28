// client/src/pages/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, User, Clock, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import UserCredits from '../components/UserCredits';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import supabase from '../lib/supabase';

const AccountPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('account');
  const [subscription, setSubscription] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState({
    subscription: true,
    transactions: true
  });
  const [error, setError] = useState(null);
  const [cancelationLoading, setCancelationLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch subscription information
    const fetchSubscription = async () => {
      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${API_URL}/users/subscription`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSubscription(data.subscription);
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, subscription: false }));
      }
    };

    // Fetch transaction history
    const fetchTransactions = async () => {
      try {
        // Get auth token
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('No active session');
        }
        
        const response = await fetch(`${API_URL}/users/transactions?limit=10`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch transactions');
        }
        
        const data = await response.json();
        setTransactions(data.transactions);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(prev => ({ ...prev, transactions: false }));
      }
    };

    fetchSubscription();
    fetchTransactions();
  }, [user, navigate]);

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.')) {
      return;
    }
    
    setCancelationLoading(true);
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await fetch(`${API_URL}/users/subscription/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      
      const data = await response.json();
      
      // Update the subscription state
      setSubscription(prev => ({
        ...prev,
        cancel_at_period_end: true,
        cancel_at: data.cancelDate
      }));
      
      alert('Your subscription has been canceled and will end at the end of your current billing period.');
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.message);
      alert(`Failed to cancel subscription: ${err.message}`);
    } finally {
      setCancelationLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTransactionType = (type) => {
    switch (type) {
      case 'subscription_renewal':
        return 'Subscription Renewal';
      case 'purchase':
        return 'One-time Purchase';
      case 'image_generation':
        return 'Image Generation';
      case 'free_trial':
        return 'Free Trial Activation';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatPlanName = (planId) => {
    if (!planId) return 'Unknown';
    
    switch (planId) {
      case 'free':
        return 'Free Trial';
      case 'pay-as-you-go':
        return 'Pay-as-you-Go Pack';
      case 'starter':
        return 'Starter Subscription';
      case 'pro':
        return 'Pro Subscription';
      case 'premium':
        return 'Premium Subscription';
      default:
        return planId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-soft-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Sidebar */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-lg border border-light-gray/40 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-light-gray/40">
                <h2 className="font-semibold">Welcome back</h2>
                <p className="text-charcoal/70 text-sm truncate">
                  {user?.email}
                </p>
              </div>
              
              <UserCredits />
              
              <div className="p-4 border-t border-light-gray/40">
                <Link to="/create">
                  <Button variant="outline" size="sm" className="w-full">
                    Create Images
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="md:col-span-9">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-8">
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="subscription">Subscription</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <User className="h-5 w-5 mr-2 text-pastel-blue" />
                      <CardTitle>Profile Information</CardTitle>
                    </div>
                    <CardDescription>
                      Manage your account settings and contact information
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-charcoal/70 mb-1">Email</h3>
                        <p className="text-charcoal">{user?.email}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-charcoal/70 mb-1">Name</h3>
                        <p className="text-charcoal">{user?.user_metadata?.full_name || 'Not provided'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-charcoal/70 mb-1">Company</h3>
                        <p className="text-charcoal">{user?.user_metadata?.company_name || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button variant="outline">Edit Profile</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="subscription">
                <Card>
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <CreditCard className="h-5 w-5 mr-2 text-pastel-blue" />
                      <CardTitle>Subscription Details</CardTitle>
                    </div>
                    <CardDescription>
                      Manage your subscription and payment details
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {loading.subscription ? (
                      <div className="h-24 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pastel-blue"></div>
                      </div>
                    ) : subscription ? (
                      <div className="space-y-6">
                        <div className="bg-pastel-blue/10 rounded-lg p-4">
                          <h3 className="text-lg font-semibold mb-2">
                            {formatPlanName(subscription.plan_id)}
                          </h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-charcoal/70 mb-1">Status</p>
                              <p className="font-medium">
                                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                                {subscription.cancel_at_period_end && ' (Canceling)'}
                              </p>
                            </div>
                            <div>
                              <p className="text-charcoal/70 mb-1">Renews On</p>
                              <p className="font-medium">
                                {subscription.cancel_at_period_end
                                  ? 'Will not renew'
                                  : formatDate(subscription.current_period_end)}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {subscription.cancel_at_period_end ? (
                          <div className="bg-pastel-pink/10 rounded-lg p-4 border border-pastel-pink/30">
                            <h3 className="text-sm font-semibold mb-1">Subscription Canceled</h3>
                            <p className="text-sm text-charcoal/70">
                              Your subscription will end on {formatDate(subscription.current_period_end)}. 
                              You will continue to have access until that date.
                            </p>
                            <div className="mt-3">
                              <Link to="/pricing">
                                <Button variant="outline" size="sm">Resubscribe</Button>
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <Button
                              variant="outline"
                              onClick={handleCancelSubscription}
                              disabled={cancelationLoading}
                            >
                              {cancelationLoading ? 'Processing...' : 'Cancel Subscription'}
                            </Button>
                            
                            <Link to="/pricing">
                              <Button>Upgrade Plan</Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <h3 className="text-lg font-medium mb-2">No active subscription</h3>
                        <p className="text-charcoal/70 mb-4">
                          You don't have an active subscription plan.
                        </p>
                        <Link to="/pricing">
                          <Button>View Pricing Plans</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions">
                <Card>
                  <CardHeader>
                    <div className="flex items-center mb-2">
                      <Clock className="h-5 w-5 mr-2 text-pastel-blue" />
                      <CardTitle>Transaction History</CardTitle>
                    </div>
                    <CardDescription>
                      View your recent credit transactions
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    {loading.transactions ? (
                      <div className="h-24 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pastel-blue"></div>
                      </div>
                    ) : transactions.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-light-gray/40">
                              <th className="text-left p-2 text-sm font-medium text-charcoal/70">Date</th>
                              <th className="text-left p-2 text-sm font-medium text-charcoal/70">Type</th>
                              <th className="text-right p-2 text-sm font-medium text-charcoal/70">Credits</th>
                            </tr>
                          </thead>
                          <tbody>
                            {transactions.map((transaction) => (
                              <tr key={transaction.id} className="border-b border-light-gray/20">
                                <td className="p-2 text-sm">
                                  {formatDate(transaction.created_at)}
                                </td>
                                <td className="p-2 text-sm">
                                  {formatTransactionType(transaction.transaction_type)}
                                  {transaction.metadata?.plan_id && (
                                    <span className="text-xs text-charcoal/60 block">
                                      {formatPlanName(transaction.metadata.plan_id)}
                                    </span>
                                  )}
                                </td>
                                <td className={`p-2 text-sm text-right font-medium ${
                                  transaction.amount > 0 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-charcoal/70">No transactions found</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;