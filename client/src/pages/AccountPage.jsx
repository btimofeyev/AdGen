import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, User, Clock, Home, LogOut, ImagePlus, PlusCircleIcon, RefreshCwIcon, CalendarDays } from 'lucide-react'; // Simplified imports
import { API_URL } from '../config';
import UserCredits from '../components/UserCredits';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import supabase from '../lib/supabase'; // Assuming this is still needed for direct session access in fetchers

// --- Helper Components for Tabs ---

const AccountInfoTab = React.memo(({ user }) => (
  <Card className="max-w-3xl mx-auto">
    <CardHeader>
      <div className="flex items-center mb-2"><User className="h-5 w-5 mr-2 text-pastel-blue" /><CardTitle>Profile Information</CardTitle></div>
      <CardDescription>Manage your account settings and contact information.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <div><h3 className="text-sm font-medium text-charcoal/70 dark:text-slate-400 mb-1">Email</h3><p>{user?.email}</p></div>
      <div><h3 className="text-sm font-medium text-charcoal/70 dark:text-slate-400 mb-1">Name</h3><p>{user?.user_metadata?.full_name || 'Not provided'}</p></div>
      <div><h3 className="text-sm font-medium text-charcoal/70 dark:text-slate-400 mb-1">Company</h3><p>{user?.user_metadata?.company_name || 'Not provided'}</p></div>
    </CardContent>
    <CardFooter><Button variant="outline" disabled>Edit Profile (Soon)</Button></CardFooter> {/* Assuming edit is future feature */}
  </Card>
));

const SubscriptionTab = React.memo(({ subscription, loading, onManage, onCancel, portalLoading, cancelLoading, formatDate, formatPlanName }) => {
  if (loading) return <div className="h-24 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pastel-blue"></div></div>;
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center mb-2"><CreditCard className="h-5 w-5 mr-2 text-pastel-blue" /><CardTitle>Subscription Details</CardTitle></div>
        <CardDescription>Manage your subscription and payment details.</CardDescription>
      </CardHeader>
      <CardContent>
        {subscription ? (
          <div className="space-y-6">
            <div className="bg-pastel-blue/10 dark:bg-pastel-blue/5 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-2">{formatPlanName(subscription.plan_id)}</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-charcoal/70 dark:text-slate-400 mb-1">Status</p><p className="font-medium">{subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}{subscription.cancel_at_period_end && ' (Canceling)'}</p></div>
                <div><p className="text-charcoal/70 dark:text-slate-400 mb-1">Renews On</p><p className="font-medium">{subscription.cancel_at_period_end ? 'Will not renew' : formatDate(subscription.current_period_end)}</p></div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={onManage} disabled={portalLoading}>{portalLoading ? 'Loading…' : 'Manage Subscription'}</Button>
              {!subscription.cancel_at_period_end && (<Button variant="destructiveOutline" onClick={onCancel} disabled={cancelLoading}>{cancelLoading ? 'Processing…' : 'Cancel Subscription'}</Button>)}
            </div>
            {subscription.cancel_at_period_end && (
              <div className="bg-pastel-pink/10 dark:bg-pastel-pink/5 rounded-lg p-4 border border-pastel-pink/30">
                <h3 className="text-sm font-semibold mb-1">Subscription Canceled</h3>
                <p className="text-sm text-charcoal/70 dark:text-slate-400">Ends {formatDate(subscription.current_period_end)}. Access until then.</p>
                <Link to="/pricing"><Button variant="outline" size="sm" className="mt-3">Resubscribe</Button></Link>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8"><h3 className="text-lg font-medium mb-2">No active subscription</h3><p className="text-charcoal/70 dark:text-slate-400 mb-4">You don't have an active subscription plan.</p><Link to="/pricing"><Button>View Pricing Plans</Button></Link></div>
        )}
      </CardContent>
    </Card>
  );
});

const TransactionsTab = React.memo(({ transactions, loading, formatDate, formatTransactionType, formatPlanName }) => {
  if (loading) return <div className="h-24 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-pastel-blue"></div></div>;
  
  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center mb-2"><Clock className="h-5 w-5 mr-2 text-pastel-blue" /><CardTitle>Transaction History</CardTitle></div>
        <CardDescription>View your recent credit transactions.</CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-border"><th className="text-left p-2 text-sm font-medium text-charcoal/70 dark:text-slate-400">Date</th><th className="text-left p-2 text-sm font-medium text-charcoal/70 dark:text-slate-400">Type</th><th className="text-right p-2 text-sm font-medium text-charcoal/70 dark:text-slate-400">Credits</th></tr></thead>
              <tbody>{transactions.map(tx => (<tr key={tx.id} className="border-b border-border/50"><td className="p-2 text-sm">{formatDate(tx.created_at)}</td><td className="p-2 text-sm">{formatTransactionType(tx.transaction_type)}{tx.metadata?.plan_id && (<span className="text-xs text-charcoal/60 dark:text-slate-500 block">{formatPlanName(tx.metadata.plan_id)}</span>)}</td><td className={`p-2 text-sm text-right font-medium ${tx.amount > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{tx.amount > 0 ? '+' : ''}{tx.amount}</td></tr>))}</tbody>
            </table>
          </div>
        ) : (<div className="text-center py-8"><p className="text-charcoal/70 dark:text-slate-400">No transactions found.</p></div>)}
      </CardContent>
    </Card>
  );
});

const SidebarIcon = React.memo(({ icon, onClick, ariaLabel }) => (
  <button className="text-charcoal/70 dark:text-slate-300 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition" onClick={onClick} aria-label={ariaLabel}>{icon}</button>
));

// --- Main AccountPage Component ---
const AccountPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('account');
  const [pageData, setPageData] = useState({
    subscription: null, transactions: [], credits: null,
    loading: { subscription: true, transactions: true, credits: true },
    error: { subscription: null, transactions: null, credits: null }
  });
  const [actionLoading, setActionLoading] = useState({ cancelSubscription: false, managePortal: false });
  const [generalError, setGeneralError] = useState(null); // For page-level errors

  // --- Data Fetching ---
  const fetchApiData = useCallback(async (endpoint, options = {}) => {
    if (!user) throw new Error("User not authenticated for API call.");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session for API call.');
    
    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers: { ...options.headers, Authorization: `Bearer ${session.access_token}` }});
    if (!response.ok) {
      const errData = await response.json().catch(() => ({ message: `HTTP error ${response.status}` }));
      throw new Error(errData.error || errData.message || `Failed to fetch ${endpoint}`);
    }
    return response.json();
  }, [user]);

  const loadPageData = useCallback(() => {
    const dataTypeMap = {
      subscription: { endpoint: '/users/subscription', dataKey: 'subscription', errorKey: 'subscription' },
      transactions: { endpoint: '/users/transactions?limit=10', dataKey: 'transactions', errorKey: 'transactions' },
      credits: { endpoint: '/users/credits', dataKey: 'credits', errorKey: 'credits', fallback: { available_credits: 0, total_credits_received: 0, credits_used: 0 } }
    };

    Object.entries(dataTypeMap).forEach(async ([type, config]) => {
      setPageData(prev => ({ ...prev, loading: { ...prev.loading, [type]: true }, error: { ...prev.error, [config.errorKey]: null } }));
      try {
        const result = await fetchApiData(config.endpoint);
        setPageData(prev => ({ ...prev, [config.dataKey]: result[config.dataKey] || result || config.fallback, loading: { ...prev.loading, [type]: false } }));
      } catch (err) {
        console.error(`Error fetching ${type}:`, err);
        setPageData(prev => ({ ...prev, error: { ...prev.error, [config.errorKey]: err.message }, loading: { ...prev.loading, [type]: false } }));
        if (config.dataKey === 'credits' && err.message.includes('404')) { // Handle 404 for credits specifically
            setPageData(prev => ({ ...prev, credits: config.fallback }));
        }
      }
    });
  }, [fetchApiData]);
  
  useEffect(() => {
    if (!user) navigate('/login');
    else loadPageData();
  }, [user, navigate, loadPageData]);

  const handleRefreshCredits = useCallback(() => { // Keep for UserCredits component
    setPageData(prev => ({ ...prev, loading: { ...prev.loading, credits: true } }));
    fetchApiData('/users/credits')
        .then(result => setPageData(prev => ({ ...prev, credits: result, loading: { ...prev.loading, credits: false }, error: { ...prev.error, credits: null } })))
        .catch(err => setPageData(prev => ({ ...prev, error: { ...prev.error, credits: err.message }, loading: { ...prev.loading, credits: false } })));
  }, [fetchApiData]);

  // --- Actions ---
  const handleSubscriptionAction = useCallback(async (actionType) => {
    const loadingKey = actionType === 'cancel' ? 'cancelSubscription' : 'managePortal';
    setActionLoading(prev => ({ ...prev, [loadingKey]: true }));
    setGeneralError(null);
    try {
      const endpoint = actionType === 'cancel' ? '/users/subscription/cancel' : '/subscriptions/create-portal-session';
      const result = await fetchApiData(endpoint, { method: 'POST' });
      
      if (actionType === 'cancel') {
        setPageData(prev => ({ ...prev, subscription: { ...prev.subscription, cancel_at_period_end: true, cancel_at: result.cancelDate } }));
        alert('Subscription canceled. Access remains until period end.');
      } else if (actionType === 'managePortal' && result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error(`Error with ${actionType}:`, err);
      setGeneralError(err.message);
      alert(`Failed to ${actionType} subscription: ${err.message}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [loadingKey]: false }));
    }
  }, [fetchApiData]);

  const handleLogout = async () => { try { await signOut(); navigate('/'); } catch (e) { console.error('Logout error:', e); }};

  // --- Formatters ---
  const formatDate = useCallback(dateString => dateString ? new Date(dateString).toLocaleDateString() : 'N/A', []);
  const formatPlanName = useCallback(planId => { /* ... same as before, or use a map ... */
    const names = { free: 'Free Trial', 'pay-as-you-go': 'Pay-as-you-Go', starter: 'Starter', pro: 'Pro', premium: 'Premium' };
    return names[planId] || (planId ? planId.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown');
  }, []);
  const formatTransactionType = useCallback(type => { /* ... same as before, or use a map ... */
    const types = { subscription_renewal: 'Subscription Renewal', purchase: 'One-time Purchase', image_generation: 'Image Generation', free_trial: 'Free Trial' };
    return types[type] || (type ? type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Unknown');
  }, []);

  // --- Render ---
  const tabContent = useMemo(() => {
    switch (activeTab) {
      case 'account': return <AccountInfoTab user={user} />;
      case 'subscription': return <SubscriptionTab subscription={pageData.subscription} loading={pageData.loading.subscription} onManage={() => handleSubscriptionAction('managePortal')} onCancel={() => handleSubscriptionAction('cancel')} portalLoading={actionLoading.managePortal} cancelLoading={actionLoading.cancelSubscription} formatDate={formatDate} formatPlanName={formatPlanName} />;
      case 'transactions': return <TransactionsTab transactions={pageData.transactions} loading={pageData.loading.transactions} formatDate={formatDate} formatTransactionType={formatTransactionType} formatPlanName={formatPlanName} />;
      default: return null;
    }
  }, [activeTab, user, pageData, actionLoading, handleSubscriptionAction, formatDate, formatPlanName, formatTransactionType]);

  const desktopSidebarActions = useMemo(() => (
    <>
      <div className="mb-8"><h2 className="text-lg font-bold mb-3 dark:text-white">Credits</h2><UserCredits credits={pageData.credits} creditsLoading={pageData.loading.credits} subscription={pageData.subscription} onRefresh={handleRefreshCredits} error={pageData.error.credits}/></div>
      <div className="mb-8"><h2 className="text-lg font-bold mb-3 dark:text-white">Quick Actions</h2>
        <div className="space-y-3">
          <Link to="/create"><Button variant="outline" size="sm" className="w-full justify-start text-left"><ImagePlus className="h-4 w-4 mr-2"/>Create Images</Button></Link>
          <Link to="/pricing"><Button variant="outline" size="sm" className="w-full justify-start text-left"><PlusCircleIcon className="h-4 w-4 mr-2"/>Add Credits</Button></Link>
          {pageData.subscription && (<Button variant="outline" size="sm" className="w-full justify-start text-left" onClick={()=>handleSubscriptionAction('managePortal')} disabled={actionLoading.managePortal}><CreditCard className="h-4 w-4 mr-2"/>{actionLoading.managePortal?'Loading...':'Manage Billing'}</Button>)}
        </div>
      </div>
      {pageData.subscription && (<div className="mb-8"><h2 className="text-lg font-bold mb-3 dark:text-white">Subscription</h2><div className="bg-background dark:bg-slate-800 p-4 rounded-lg border border-border"><div className="flex items-center justify-between mb-2"><div className="font-medium">{formatPlanName(pageData.subscription.plan_id)}</div><div className={`text-xs px-2 py-0.5 rounded-full ${pageData.subscription.status==='active'?'bg-green-100 dark:bg-green-700/30 text-green-700 dark:text-green-300':'bg-yellow-100 dark:bg-yellow-700/30 text-yellow-700 dark:text-yellow-300'}`}>{pageData.subscription.status.charAt(0).toUpperCase()+pageData.subscription.status.slice(1)}</div></div><div className="flex items-center text-sm text-charcoal/70 dark:text-slate-400 mb-3"><CalendarDays className="h-3 w-3 mr-1"/><span>{pageData.subscription.cancel_at_period_end?`Ends ${formatDate(pageData.subscription.current_period_end)}`:`Renews ${formatDate(pageData.subscription.current_period_end)}`}</span></div><Button size="sm" className="w-full" onClick={()=>handleSubscriptionAction('managePortal')} disabled={actionLoading.managePortal}>{actionLoading.managePortal?'Loading...':'Manage Plan'}</Button></div></div>)}
      <div><h2 className="text-lg font-bold mb-3 dark:text-white">Account Info</h2><div className="bg-background dark:bg-slate-800 p-4 rounded-lg border border-border"><div className="mb-4"><h3 className="text-sm font-medium text-charcoal/70 dark:text-slate-400 mb-1">Email</h3><p className="font-medium truncate">{user?.email}</p></div><div><h3 className="text-sm font-medium text-charcoal/70 dark:text-slate-400 mb-1">Name</h3><p className="font-medium">{user?.user_metadata?.full_name||'Not provided'}</p></div></div></div>
    </>
  ), [pageData, actionLoading, handleSubscriptionAction, handleRefreshCredits, formatDate, formatPlanName, user]);


  return (
    <div className="min-h-screen flex bg-background text-charcoal dark:text-white">
      <div className="w-16 bg-background dark:bg-slate-900 shadow flex flex-col items-center py-6 space-y-6 border-r border-border dark:border-slate-700">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2"><User size={20} className="text-pastel-blue"/></div>
        <SidebarIcon icon={<ImagePlus size={20}/>} onClick={()=>navigate('/create')} ariaLabel="Create Images"/>
        <SidebarIcon icon={<Home size={20}/>} onClick={()=>navigate('/')} ariaLabel="Home"/>
        <div className="mt-auto"><SidebarIcon icon={<LogOut size={20}/>} onClick={handleLogout} ariaLabel="Logout"/></div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-background dark:bg-slate-900 px-6 py-4 shadow flex items-center justify-between border-b border-border dark:border-slate-700">
          <h1 className="text-2xl font-extrabold"><span className="text-pastel-blue">Account</span> Settings</h1>
          <div className="flex space-x-1 bg-background dark:bg-slate-800 rounded-lg p-1">
            {['account', 'subscription', 'transactions'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${activeTab === tab ? 'bg-pastel-blue/20 dark:bg-pastel-blue/10 shadow-sm text-charcoal dark:text-white' : 'text-charcoal/70 dark:text-slate-300 hover:text-charcoal dark:hover:text-white hover:bg-pastel-blue/10 dark:hover:bg-pastel-blue/5'}`}>{tab === 'transactions' ? 'History' : tab}</button>
            ))}
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 p-6 overflow-y-auto">
            {generalError && (<div className="w-full max-w-3xl mx-auto mb-6 bg-pastel-pink/20 border border-pastel-pink/50 rounded-lg p-4 text-red-700 dark:text-red-400"><p className="font-medium">Error: {generalError}</p></div>)}
            {tabContent}
          </main>
          <aside className="w-80 p-6 bg-background dark:bg-slate-900 border-l border-border dark:border-slate-700 overflow-y-auto hidden md:block">
            {desktopSidebarActions}
          </aside>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;