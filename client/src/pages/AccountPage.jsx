// client/src/pages/AccountPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, User, Clock, ArrowRight, Home, Settings, LogOut, ImagePlus, CreditCardIcon, CalendarIcon, PlusCircleIcon, RefreshCwIcon } from 'lucide-react';
import { API_URL } from '../config';
import UserCredits from '../components/UserCredits';
import { Button } from '../components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '../components/ui/card';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from '../components/ui/tabs';
import supabase from '../lib/supabase';

const AccountPage = () => {
  const { user, signOut } = useAuth();
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
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Fetch subscription information
    const fetchSubscription = async () => {
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        const response = await fetch(
          `${API_URL}/users/subscription`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        if (!response.ok) throw new Error('Failed to fetch subscription');
        const data = await response.json();
        setSubscription(data.subscription);
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
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) throw new Error('No active session');

        const response = await fetch(
          `${API_URL}/users/transactions?limit=10`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          }
        );
        if (!response.ok) throw new Error('Failed to fetch transactions');
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
    if (
      !window.confirm(
        'Are you sure you want to cancel your subscription? You will still have access until the end of your current billing period.'
      )
    ) {
      return;
    }
    setCancelationLoading(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${API_URL}/users/subscription/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      const data = await response.json();
      setSubscription(prev => ({
        ...prev,
        cancel_at_period_end: true,
        cancel_at: data.cancelDate
      }));
      alert(
        'Your subscription has been canceled and will end at the end of your current billing period.'
      );
    } catch (err) {
      console.error('Error canceling subscription:', err);
      setError(err.message);
      alert(`Failed to cancel subscription: ${err.message}`);
    } finally {
      setCancelationLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const response = await fetch(
        `${API_URL}/subscriptions/create-portal-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`
          }
        }
      );
      if (!response.ok) throw new Error('Failed to create portal session');
      const { url } = await response.json();
      window.location.href = url;
    } catch (err) {
      console.error('Error creating portal session:', err);
      alert('Unable to open billing portal. Please try again later.');
    } finally {
      setPortalLoading(false);
    }
  };

  const formatDate = dateString => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatTransactionType = type => {
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
        return type.replace(/_/g, ' ').replace(/\b\w/g, l =>
          l.toUpperCase()
        );
    }
  };

  const formatPlanName = planId => {
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
        return planId
          .replace(/-/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen flex bg-soft-white text-charcoal">
      {/* Sidebar */}
      <div className="w-16 bg-white shadow flex flex-col items-center py-6 space-y-6 border-r border-light-gray/40">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2">
          <User size={20} className="text-pastel-blue" />
        </div>
        <SidebarIcon icon={<ImagePlus size={20} />} onClick={() => navigate('/create')} />
        <SidebarIcon icon={<Home size={20} />} onClick={() => navigate('/')} />
        <SidebarIcon icon={<Settings size={20} />} />
        <div className="mt-auto">
          <SidebarIcon icon={<LogOut size={20} />} onClick={handleLogout} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white px-6 py-4 shadow flex items-center justify-between border-b border-light-gray/40">
          <h1 className="text-2xl font-extrabold">
            <span className="text-pastel-blue">Account</span> Settings
          </h1>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-soft-white rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'account'
                  ? 'bg-white shadow-sm text-charcoal'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-white/50'
              }`}
            >
              Profile
            </button>
            <button 
              onClick={() => setActiveTab('subscription')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'subscription'
                  ? 'bg-white shadow-sm text-charcoal'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-white/50'
              }`}
            >
              Subscription
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-white shadow-sm text-charcoal'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-white/50'
              }`}
            >
              History
            </button>
          </div>
        </header>

        <div className="flex overflow-hidden">
          {/* Center Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {error && (
              <div className="w-full max-w-3xl mx-auto mb-6 bg-pastel-pink/20 border border-pastel-pink/50 rounded-lg p-4 text-red-700">
                <p className="font-medium">Error: {error}</p>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === 'account' && (
              <Card className="max-w-3xl mx-auto">
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
                      <h3 className="text-sm font-medium text-charcoal/70 mb-1">
                        Email
                      </h3>
                      <p className="text-charcoal">{user?.email}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-charcoal/70 mb-1">
                        Name
                      </h3>
                      <p className="text-charcoal">
                        {user?.user_metadata?.full_name || 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-charcoal/70 mb-1">
                        Company
                      </h3>
                      <p className="text-charcoal">
                        {user?.user_metadata?.company_name || 'Not provided'}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline">Edit Profile</Button>
                </CardFooter>
              </Card>
            )}

            {/* Subscription Tab */}
            {activeTab === 'subscription' && (
              <Card className="max-w-3xl mx-auto">
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
                              {subscription.status.charAt(0).toUpperCase() +
                                subscription.status.slice(1)}
                              {subscription.cancel_at_period_end &&
                                ' (Canceling)'}
                            </p>
                          </div>
                          <div>
                            <p className="text-charcoal/70 mb-1">Renews On</p>
                            <p className="font-medium">
                              {subscription.cancel_at_period_end
                                ? 'Will not renew'
                                : formatDate(
                                    subscription.current_period_end
                                  )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-4">
                        <Button
                          variant="outline"
                          onClick={handleManageSubscription}
                          disabled={portalLoading}
                        >
                          {portalLoading
                            ? 'Loading…'
                            : 'Manage Subscription'}
                        </Button>

                        {!subscription.cancel_at_period_end && (
                          <Button
                            variant="outline"
                            onClick={handleCancelSubscription}
                            disabled={cancelationLoading}
                          >
                            {cancelationLoading
                              ? 'Processing…'
                              : 'Cancel Subscription'}
                          </Button>
                        )}
                      </div>

                      {subscription.cancel_at_period_end && (
                        <div className="bg-pastel-pink/10 rounded-lg p-4 border border-pastel-pink/30">
                          <h3 className="text-sm font-semibold mb-1">
                            Subscription Canceled
                          </h3>
                          <p className="text-sm text-charcoal/70">
                            Your subscription will end on{' '}
                            {formatDate(subscription.current_period_end)}. You
                            will continue to have access until that date.
                          </p>
                          <Link to="/pricing">
                            <Button variant="outline" size="sm" className="mt-3">
                              Resubscribe
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-medium mb-2">
                        No active subscription
                      </h3>
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
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <Card className="max-w-3xl mx-auto">
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
                            <th className="text-left p-2 text-sm font-medium text-charcoal/70">
                              Date
                            </th>
                            <th className="text-left p-2 text-sm font-medium text-charcoal/70">
                              Type
                            </th>
                            <th className="text-right p-2 text-sm font-medium text-charcoal/70">
                              Credits
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {transactions.map(tx => (
                            <tr
                              key={tx.id}
                              className="border-b border-light-gray/20"
                            >
                              <td className="p-2 text-sm">
                                {formatDate(tx.created_at)}
                              </td>
                              <td className="p-2 text-sm">
                                {formatTransactionType(
                                  tx.transaction_type
                                )}
                                {tx.metadata?.plan_id && (
                                  <span className="text-xs text-charcoal/60 block">
                                    {formatPlanName(tx.metadata.plan_id)}
                                  </span>
                                )}
                              </td>
                              <td
                                className={`p-2 text-sm text-right font-medium ${
                                  tx.amount > 0
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                }`}
                              >
                                {tx.amount > 0 ? '+' : ''}
                                {tx.amount}
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
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-6 bg-white border-l border-light-gray/40 overflow-y-auto hidden md:block">
            {/* Credit Display */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3">Credits</h2>
              <UserCredits />
            </div>
            
            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3">Quick Actions</h2>
              <div className="space-y-3">
                <Link to="/create">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left"
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Create Images
                  </Button>
                </Link>
                
                <Link to="/pricing">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left"
                  >
                    <PlusCircleIcon className="h-4 w-4 mr-2" />
                    Add Credits
                  </Button>
                </Link>
                
                {subscription && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start text-left"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    <CreditCardIcon className="h-4 w-4 mr-2" />
                    {portalLoading ? 'Loading...' : 'Manage Billing'}
                  </Button>
                )}
              </div>
            </div>
            
            {/* Subscription Summary */}
            {subscription && (
              <div className="mb-8">
                <h2 className="text-lg font-bold mb-3">Subscription</h2>
                <div className="bg-soft-white p-4 rounded-lg border border-light-gray/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{formatPlanName(subscription.plan_id)}</div>
                    <div className={`text-xs px-2 py-0.5 rounded-full ${
                      subscription.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-charcoal/70 mb-3">
                    <CalendarIcon className="h-3 w-3 mr-1" />
                    <span>
                      {subscription.cancel_at_period_end 
                        ? `Ends on ${formatDate(subscription.current_period_end)}` 
                        : `Renews on ${formatDate(subscription.current_period_end)}`}
                    </span>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? 'Loading...' : 'Manage Plan'}
                  </Button>
                </div>
              </div>
            )}
            
            {/* Account Summary */}
            <div>
              <h2 className="text-lg font-bold mb-3">Account Info</h2>
              <div className="bg-soft-white p-4 rounded-lg border border-light-gray/30">
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-charcoal/70 mb-1">Email</h3>
                  <p className="text-charcoal font-medium truncate">{user?.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-charcoal/70 mb-1">Name</h3>
                  <p className="text-charcoal font-medium">
                    {user?.user_metadata?.full_name || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function SidebarIcon({ icon, onClick }) {
  return (
    <button 
      className="text-charcoal/70 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition"
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export default AccountPage;
