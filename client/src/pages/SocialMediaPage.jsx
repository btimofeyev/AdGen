// client/src/pages/SocialMediaPage.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileUp,
  X,
  ImagePlus,
  Home,
  User,
  LogOut,
  Zap,
  RefreshCw,
  Download,
  Copy,
  Plus,
  Trash2,
  Check,
  Menu,
  SlidersHorizontal,
  Image,
  Calendar,
  Clock,
  Send
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import supabase from "../lib/supabase";
import SocialPostGenerator from "../components/SocialPostGenerator";

function SocialMediaPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [creditsError, setCreditsError] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("create");

  // Caching refs to prevent unnecessary reloads
  const creditsLoadedRef = useRef(false);
  const imagesLoadedRef = useRef(false);

  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Focus on prompt input on component mount
  useEffect(() => {
    // If no user, redirect to login
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Effect to load user's saved images and credits only once per session
  useEffect(() => {
    if (user) {
      if (!imagesLoadedRef.current) {
        loadUserPosts();
        imagesLoadedRef.current = true;
      }
      if (!creditsLoadedRef.current) {
        loadUserCredits();
        loadUserSubscription();
        creditsLoadedRef.current = true;
      }
    }
  }, [user]);

  // Load user credits
  const loadUserCredits = async () => {
    try {
      setCreditsLoading(true);
      setCreditsError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setCreditsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/credits`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCredits({
            available_credits: 0,
            total_credits_received: 0,
            credits_used: 0,
          });
        } else {
          const errorData = await response.json();
          setCreditsError(errorData.error || "Failed to load credits");
          throw new Error(errorData.error || "Failed to load credits");
        }
      } else {
        const data = await response.json();
        setCredits(data);
      }
    } catch (err) {
      setCreditsError(err.message);
      console.error("Error loading user credits:", err);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Load user subscription - unchanged
  const loadUserSubscription = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        return;
      }
      const response = await fetch(`${API_URL}/users/subscription`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      setSubscription(null);
      console.error("Error loading user subscription:", err);
    }
  };

  // Function to load user's saved posts
  const loadUserPosts = async () => {
    try {
      setIsLoadingPosts(true);
      setError(null);

      // Simulate API call
      setTimeout(() => {
        // Example data - in a real app this would come from your API
        const mockPosts = [
          {
            id: 1,
            title: "Summer Collection Launch",
            content: "✨ Introducing our newest Summer Collection! Perfect for hot days. Check it out online or in-store today. #NewCollection #SummerStyle",
            imagePrompt: "Summer clothing collection displayed on minimalist white background, professional product photography",
            platform: "instagram",
            status: "scheduled",
            scheduledFor: "2025-05-20T10:00:00Z",
            created_at: "2025-05-15T10:00:00Z"
          },
          {
            id: 2,
            title: "Weekend Sale",
            content: "🔥 SALE ALERT! Take 25% off all summer products this weekend only! Shop now before these deals are gone. #WeekendSale #LimitedTime",
            imagePrompt: "Products with sale tags, bright summer colors, promotional style with 25% discount text overlay",
            platform: "facebook",
            status: "published",
            publishedAt: "2025-05-10T15:30:00Z",
            created_at: "2025-05-10T10:00:00Z"
          },
          {
            id: 3,
            title: "Product Benefits Highlight",
            content: "Did you know our organic cotton tees are eco-friendly and super comfortable? Perfect for everyday wear! #SustainableFashion #Comfort",
            imagePrompt: "Eco-friendly cotton t-shirt with certification labels, natural lighting showing texture details",
            platform: "instagram",
            status: "draft",
            created_at: "2025-05-14T16:45:00Z"
          }
        ];

        setGeneratedPosts(mockPosts);
        setIsLoadingPosts(false);
      }, 1500);

    } catch (err) {
      console.error("Error loading user posts:", err);
      setError(`Failed to load your posts: ${err.message}`);
      setIsLoadingPosts(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle tab switching - unchanged
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Explicit refresh handlers
  const handleRefreshCredits = () => {
    setCreditsLoading(true);
    loadUserCredits();
    creditsLoadedRef.current = true;
  };

  const handleRefreshPosts = () => {
    setIsLoadingPosts(true);
    loadUserPosts();
    imagesLoadedRef.current = true;
  };

  const SidebarContent = useMemo(
    () => (
      <div className="w-80 p-6 bg-[#23262F] border-l border-[#23262F]/60 overflow-y-auto">
        {/* Credit Usage - always visible */}
        <div className="mb-8">
          <div className="bg-background rounded-lg border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-pastel-blue" />
                <h3 className="text-sm font-medium text-charcoal dark:text-white">Available Credits</h3>
              </div>
              {subscription && (
                <div className="flex items-center bg-pastel-blue/10 dark:bg-pastel-blue/20 rounded-full px-2 py-0.5">
                  <CreditCard className="h-3 w-3 mr-1 text-pastel-blue" />
                  <span className="text-xs text-pastel-blue font-medium">
                    {subscription.plan_id ? subscription.plan_id.charAt(0).toUpperCase() + subscription.plan_id.slice(1) : 'Subscription'}
                  </span>
                </div>
              )}
              {onRefresh && (
                <Button onClick={handleRefreshCredits} size="xs" variant="ghost" className="ml-2">↻</Button>
              )}
            </div>

            <div className="mb-2">
              <div className="text-3xl font-bold text-charcoal dark:text-white">
                {credits?.available_credits || 0}
              </div>
            </div>

            <div className="mb-3">
              <div className="h-2 w-full bg-light-gray/30 dark:bg-[#23262F]/60 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pastel-blue to-soft-lavender rounded-full"
                  style={{ width: `${Math.min(((credits?.credits_used || 0) / (credits?.total_credits_received || 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-1 text-xs text-charcoal/60 dark:text-gray-400">
                <span>{credits?.credits_used || 0} used</span>
                <span>{credits?.total_credits_received || 0} total</span>
              </div>
            </div>

            {credits && credits.available_credits < 5 && !subscription && (
              <div className="bg-pastel-pink/10 dark:bg-pastel-pink/20 rounded-md p-2 mb-3 text-xs text-red-600 dark:text-red-400 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                <span>Low on credits! Purchase more to continue creating.</span>
              </div>
            )}

            {subscription ? (
              <div className="text-xs text-charcoal/70 dark:text-gray-300 mb-3">
                Your {subscription.plan_id} plan renews on {subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : 'upcoming billing date'}
              </div>
            ) : (
              <Link to="/pricing">
                <button className="w-full py-2 px-4 rounded-md font-medium bg-background border border-pastel-blue text-charcoal hover:bg-pastel-blue/10 dark:text-white">
                  {credits && credits.available_credits < 5 ? 'Get More Credits' : 'Upgrade Plan'}
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* Social Media Platforms */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Post To</h2>
          <div className="grid grid-cols-2 gap-3">
            <button className="bg-background text-charcoal p-3 rounded-lg border border-[#E1306C]/50 hover:bg-[#E1306C]/10 flex items-center">
              <div className="w-5 h-5 rounded-full bg-[#E1306C] flex items-center justify-center mr-3">
                <Image size={12} className="text-white" />
              </div>
              <span>Instagram</span>
            </button>
            <button className="bg-background text-charcoal p-3 rounded-lg border border-[#1877F2]/50 hover:bg-[#1877F2]/10 flex items-center">
              <div className="w-5 h-5 rounded-full bg-[#1877F2] flex items-center justify-center mr-3">
                <span className="text-xs text-white font-bold">f</span>
              </div>
              <span>Facebook</span>
            </button>
          </div>
        </div>

        {/* Scheduled Posts Calendar */}
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-3">Scheduled Posts</h2>
          <div className="bg-background p-4 rounded-lg border border-border">
            <div className="flex justify-between items-center mb-3">
              <span className="font-medium">May 2025</span>
              <div className="flex space-x-1">
                <button className="p-1 rounded hover:bg-pastel-blue/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                <button className="p-1 rounded hover:bg-pastel-blue/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 31 }, (_, i) => {
                // Example: highlight day 20 as having a scheduled post
                const hasPost = i + 1 === 20;
                // Current day
                const isToday = i + 1 === 12;
                
                return (
                  <div 
                    key={i} 
                    className={`h-8 flex items-center justify-center text-xs rounded-full ${
                      hasPost ? 'bg-pastel-blue text-charcoal font-bold' : 
                      isToday ? 'bg-background/30 font-bold' : ''
                    }`}
                  >
                    {i + 1}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 text-xs text-white/60 flex items-center">
              <div className="w-3 h-3 bg-pastel-blue rounded-full mr-2"></div>
              <span>Scheduled post</span>
            </div>
          </div>
        </div>

        {/* Help & Tips */}
        <div>
          <h2 className="text-lg font-bold mb-3">Tips</h2>
          <div className="p-3 rounded-lg bg-background/20 border border-border/20 space-y-3">
            <p className="text-sm text-white/70">
              <span className="text-pastel-blue font-medium block mb-1">
                Be conversational
              </span>
              Write in a friendly, approachable tone to engage your audience better.
            </p>
            <p className="text-sm text-white/70">
              <span className="text-pastel-blue font-medium block mb-1">
                Use relevant hashtags
              </span>
              Include 3-5 targeted hashtags to increase your post's discoverability.
            </p>
          </div>
        </div>
      </div>
    ),
    [credits, creditsLoading, subscription, creditsError]
  );

  return (
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
      {/* Sidebar */}
      <div className="hidden sm:flex w-16 bg-[#23262F] shadow flex-col items-center py-6 space-y-6 border-r border-[#23262F]/60">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2">
          <Calendar size={20} className="text-pastel-blue" />
        </div>
        <SidebarIcon
          icon={<ImagePlus size={20} />}
          onClick={() => navigate("/create")}
        />
        <SidebarIcon icon={<User size={20} />} onClick={() => navigate("/account")} />
        <SidebarIcon icon={<Home size={20} />} onClick={() => navigate("/")} />
        <div className="mt-auto">
          <SidebarIcon icon={<LogOut size={20} />} onClick={handleLogout} />
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ x: "-100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "-100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[110] flex sm:hidden"
          >
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black opacity-80 z-[110]"
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative w-[90vw] max-w-[22rem] h-full bg-[#23262F] border-r border-[#23262F]/60 shadow-2xl z-[120] p-0 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="sticky top-0 right-0 z-[130] p-2 m-2 rounded-full bg-[#23262F] hover:bg-pastel-blue/10 focus:outline-none"
                onClick={() => setMobileSidebarOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-pastel-blue" />
              </button>
              {/* SidebarContent in Drawer */}
              <div className="pt-4 pb-8 flex flex-col gap-6">
                {/* Credits Info */}
                <div className="px-4">
                  <div className="bg-background rounded-lg border border-border shadow-sm p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-pastel-blue" />
                        <h3 className="text-sm font-medium">Available Credits</h3>
                      </div>
                    </div>
                    <div className="text-2xl font-bold mb-2">{credits?.available_credits || 0}</div>
                    <Link to="/pricing">
                      <button className="w-full py-2 px-3 text-sm rounded-md font-medium bg-pastel-blue text-charcoal">
                        Get More Credits
                      </button>
                    </Link>
                  </div>
                </div>
                {/* Nav Buttons */}
                <div className="flex flex-col gap-3 px-4">
                  <button
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-background/10 text-white font-semibold text-base hover:bg-pastel-blue/10 transition"
                    onClick={() => { setMobileSidebarOpen(false); navigate("/create"); }}
                  >
                    <ImagePlus size={18} className="text-pastel-blue" /> Image Creator
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-background/10 text-white font-semibold text-base hover:bg-pastel-blue/10 transition"
                    onClick={() => { setMobileSidebarOpen(false); navigate("/account"); }}
                  >
                    <User size={18} className="text-pastel-blue" /> Account
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-background/10 text-white font-semibold text-base hover:bg-pastel-blue/10 transition"
                    onClick={() => { setMobileSidebarOpen(false); navigate("/"); }}
                  >
                    <Home size={18} className="text-pastel-blue" /> Home
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-3 rounded-lg bg-background/10 text-white font-semibold text-base hover:bg-pastel-blue/10 transition"
                    onClick={() => { setMobileSidebarOpen(false); handleLogout(); }}
                  >
                    <LogOut size={18} className="text-pastel-blue" /> Log Out
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col bg-[#181A20] min-h-screen">
        {/* Header */}
        <header className="bg-[#23262F] px-2 sm:px-6 py-2 sm:py-4 shadow flex items-center justify-between border-b border-[#23262F]/60 min-h-[48px]">
          {/* Hamburger for mobile */}
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-pastel-blue/10 focus:outline-none focus:ring-2 focus:ring-pastel-blue mr-2 flex-shrink-0"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open sidebar menu"
          >
            <Menu className="h-7 w-7 text-pastel-blue" />
          </button>
          <div className="flex items-center min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold text-white truncate">
              <span className="text-pastel-blue">Social</span> Media Manager
            </h1>

            {/* Credits Quick View (hide on mobile) */}
            {!creditsLoading && credits && (
              <Link
                to="/account"
                className="ml-6 hidden sm:flex items-center text-sm bg-pastel-blue/10 hover:bg-pastel-blue/20 px-3 py-1 rounded-full transition text-pastel-blue border border-pastel-blue/30"
              >
                <Zap size={14} className="text-pastel-blue mr-1" />
                <span className="font-medium">{credits.available_credits}</span>
                <span className="text-pastel-blue/80 ml-1">credits</span>
              </Link>
            )}
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-[#23262F] rounded-lg p-1">
            <motion.button
              onClick={() => handleTabChange("create")}
              whileHover={{ scale: activeTab !== "create" ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "create"
                  ? "bg-[#181A20] shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              Create
            </motion.button>
            <motion.button
              onClick={() => handleTabChange("scheduled")}
              whileHover={{ scale: activeTab !== "scheduled" ? 1.05 : 1 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === "scheduled"
                  ? "bg-[#181A20] shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              Scheduled{" "}
              {generatedPosts.length > 0 ? `(${generatedPosts.filter(p => p.status === 'scheduled').length})` : ''}
            </motion.button>
          </div>
        </header>

        <div className="flex flex-1 overflow-y-auto">
          {/* Center Area */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-5xl mx-auto mt-6 mx-6 bg-pastel-pink/20 border border-pastel-pink/50 rounded-lg p-4 text-red-400"
              >
                <p className="font-medium">Error: {error}</p>
                {error.includes("Failed to load your posts") && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefreshPosts}
                    className="mt-2 text-sm bg-pastel-pink/10 hover:bg-pastel-pink/20 px-3 py-1 rounded-md text-pastel-pink transition-colors"
                  >
                    <RefreshCw className="h-3 w-3 mr-1 inline-block" /> Try
                    Again
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Content Area with Fixed Height */}
            <div className="flex-1 p-6 overflow-hidden">
              {activeTab === "create" && (
                <div className="w-full max-w-5xl mx-auto">
                  {/* Loading State */}
                  {loading ? (
                    <div className="grid grid-cols-1 gap-6 w-full">
                      <div className="aspect-auto h-64 bg-[#23262F] rounded-xl animate-pulse shadow-sm border border-[#23262F]/60 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-[#23262F]/40 to-[#181A20]" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* Social Post Generator Component */}
                      <SocialPostGenerator />

                      {/* Most Recent Posts - Only show if there are posts */}
                      {generatedPosts.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold text-white">
                              Recently Created Posts
                            </h3>
                            <Link
                              to="#"
                              onClick={() => setActiveTab("scheduled")}
                              className="text-sm text-pastel-blue hover:underline"
                            >
                              View all scheduled posts
                            </Link>
                          </div>

                          <div className="bg-[#23262F] p-4 rounded-xl border border-[#23262F]/60 shadow-sm">
                            {/* Show the most recent 2 posts */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {generatedPosts
                                .slice(0, 2)
                                .map((post) => (
                                  <motion.div
                                    key={`recent-${post.id}`}
                                    whileHover={{ y: -5 }}
                                    className="relative group rounded-lg overflow-hidden bg-[#1F222A] shadow-sm border border-[#1F222A]/80 p-4"
                                  >
                                    <div className="flex justify-between mb-2">
                                      <h4 className="font-medium">{post.title}</h4>
                                      <div className={`text-xs px-2 py-0.5 rounded-full ${
                                        post.status === 'published' ? 'bg-green-100 text-green-800' :
                                        post.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                                      </div>
                                    </div>
                                    
                                    <p className="text-sm text-white/80 mb-3">{post.content}</p>
                                    
                                    <div className="flex justify-between items-center text-xs text-white/60">
                                      <div className="flex items-center">
                                        <Calendar size={12} className="mr-1" />
                                        <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                      </div>
                                      
                                      <div className={`flex items-center px-2 py-0.5 rounded-full ${
                                        post.platform === 'instagram' ? 'bg-[#E1306C]/20 text-[#E1306C]' : 
                                        'bg-[#1877F2]/20 text-[#1877F2]'
                                      }`}>
                                        <span>{post.platform}</span>
                                      </div>
                                    </div>

                                    {/* Quick action buttons */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <div className="flex justify-center space-x-2">
                                        <button
                                          onClick={() => handleCopyContent(post.content)}
                                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white"
                                          title="Copy"
                                        >
                                          <Copy size={14} />
                                        </button>
                                        <button
                                          onClick={() => handleEditPost(post)}
                                          className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white"
                                          title="Edit"
                                        >
                                          <Edit size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Scheduled Posts Tab */}
              {activeTab === "scheduled" && (
                <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Your Scheduled Posts
                      </h2>
                      <p className="text-gray-300 text-sm mt-1">
                        {generatedPosts.filter(p => p.status === 'scheduled').length > 0
                          ? `${generatedPosts.filter(p => p.status === 'scheduled').length} post${
                              generatedPosts.filter(p => p.status === 'scheduled').length !== 1 ? "s" : ""
                            } scheduled`
                          : "No scheduled posts yet"}
                      </p>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setActiveTab("create")}
                      className="px-4 py-2 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg flex items-center"
                    >
                      <Plus size={18} className="mr-2" />
                      Create New Post
                    </motion.button>
                  </div>

                  {isLoadingPosts ? (
                    // Skeleton loading state
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, idx) => (
                        <div
                          key={`skeleton-${idx}`}
                          className="rounded-xl bg-[#23262F] border border-[#23262F]/60 shadow-sm overflow-hidden p-4"
                        >
                          <div className="flex justify-between items-start">
                            <div className="w-1/4 h-5 bg-[#23262F]/60 rounded animate-pulse mb-3"></div>
                            <div className="w-20 h-4 bg-[#23262F]/60 rounded animate-pulse"></div>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div className="h-4 bg-[#23262F]/60 rounded animate-pulse w-3/4"></div>
                            <div className="h-4 bg-[#23262F]/60 rounded animate-pulse w-full"></div>
                            <div className="h-4 bg-[#23262F]/60 rounded animate-pulse w-2/3"></div>
                          </div>
                          <div className="flex justify-between">
                            <div className="w-24 h-6 bg-[#23262F]/60 rounded animate-pulse"></div>
                            <div className="w-24 h-6 bg-[#23262F]/60 rounded animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {generatedPosts.length > 0 ? (
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {generatedPosts.map((post) => (
                              <ScheduledPostCard 
                                key={post.id} 
                                post={post} 
                                onCopy={(content) => {
                                  navigator.clipboard.writeText(content);
                                  alert('Content copied to clipboard!');
                                }}
                                onEdit={(post) => handleEditPost(post)}
                                onDelete={(id) => {
                                  if (window.confirm('Are you sure you want to delete this post?')) {
                                    // In a real app, this would call an API to delete the post
                                    setGeneratedPosts(prev => 
                                      prev.filter(p => p.id !== id)
                                    );
                                  }
                                }}
                              />
                            ))}
                          </div>
                          
                          {/* Empty state for scheduled posts */}
                          {generatedPosts.filter(p => p.status === 'scheduled').length === 0 && (
                            <div className="bg-[#23262F] rounded-xl p-8 text-center border border-[#23262F]/60">
                              <Calendar className="w-16 h-16 mx-auto mb-4 text-pastel-blue/50" />
                              <h3 className="text-xl font-semibold mb-3">No scheduled posts</h3>
                              <p className="text-white/70 mb-6 max-w-md mx-auto">
                                You don't have any posts scheduled for publishing. Create a post and schedule it for automatic publishing.
                              </p>
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => setActiveTab("create")}
                                className="px-6 py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] font-bold rounded-lg"
                              >
                                Create Your First Post
                              </motion.button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="bg-[#23262F] rounded-xl p-8 text-center border border-[#23262F]/60">
                          <Calendar className="w-16 h-16 mx-auto mb-4 text-pastel-blue/50" />
                          <h3 className="text-xl font-semibold mb-3">No posts yet</h3>
                          <p className="text-white/70 mb-6 max-w-md mx-auto">
                            Start by creating your first social media post. You can schedule it for later or publish it immediately.
                          </p>
                          <motion.button
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setActiveTab("create")}
                            className="px-6 py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] font-bold rounded-lg"
                          >
                            Create Your First Post
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden md:block">
            {SidebarContent}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar Icon Component
function SidebarIcon({ icon, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: "rgba(123, 223, 242, 0.1)" }}
      whileTap={{ scale: 0.9 }}
      className="text-charcoal/70 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition-all"
      onClick={onClick}
    >
      {icon}
    </motion.button>
  );
}

// Scheduled Post Card component
const ScheduledPostCard = ({ post, onCopy, onEdit, onDelete }) => {
  const { id, title, content, platform, status, scheduledFor, publishedAt } = post;

  // Format the date to a readable format
  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-[#23262F] rounded-lg border border-[#23262F]/60 overflow-hidden p-4"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-white">{title}</h3>
        <div className={`text-xs px-2 py-0.5 rounded-full ${
          status === 'published' ? 'bg-green-100 text-green-800' :
          status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </div>
      </div>

      <p className="text-sm text-white/80 mb-4 line-clamp-3">{content}</p>

      <div className="flex justify-between items-center mb-4">
        <div className="text-xs text-white/60">
          {status === 'scheduled' ? (
            <div className="flex items-center">
              <Calendar size={12} className="mr-1" />
              <span>Scheduled for: {formatDate(scheduledFor)}</span>
            </div>
          ) : status === 'published' ? (
            <div className="flex items-center">
              <Clock size={12} className="mr-1" />
              <span>Published on: {formatDate(publishedAt)}</span>
            </div>
          ) : (
            <div className="flex items-center">
              <span>Draft - Not scheduled</span>
            </div>
          )}
        </div>

        <div className={`text-xs px-2 py-0.5 rounded-full ${
          platform === 'instagram' ? 'bg-[#E1306C]/20 text-[#E1306C]' : 
          'bg-[#1877F2]/20 text-[#1877F2]'
        }`}>
          {platform}
        </div>
      </div>

      <div className="flex justify-between">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onCopy(content)}
          className="text-xs px-2 py-1 rounded border border-border text-white/80 hover:text-white hover:bg-background/20 flex items-center"
        >
          <Copy size={12} className="mr-1" />
          Copy
        </motion.button>

        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onEdit(post)}
            className="text-xs px-2 py-1 rounded text-white/80 hover:text-white hover:bg-background/20 flex items-center"
          >
            <Edit size={12} className="mr-1" />
            Edit
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onDelete(id)}
            className="text-xs px-2 py-1 rounded text-pastel-pink hover:bg-pastel-pink/10 flex items-center"
          >
            <Trash2 size={12} className="mr-1" />
            Delete
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Handle copy content
const handleCopyContent = (content) => {
  navigator.clipboard.writeText(content);
  alert('Content copied to clipboard!');
};

// Handle edit post
const handleEditPost = (post) => {
  // This would open an edit modal or navigate to edit page
  alert(`Edit post: ${post.title}`);
};

// Mock CreditCard component for the sidebar
const CreditCard = React.forwardRef(({ className, ...props }, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    ref={ref}
    {...props}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
));

// Mock AlertCircle component
const AlertCircle = React.forwardRef(({ className, ...props }, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    ref={ref}
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
));

// Mock Edit component
const Edit = React.forwardRef(({ className, ...props }, ref) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    ref={ref}
    {...props}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
));

// Mock Button component for simplicity
const Button = ({ children, onClick, size, variant, className }) => (
  <button
    onClick={onClick}
    className={`${className} ${
      variant === 'ghost' ? 'text-pastel-blue hover:bg-pastel-blue/10' : ''
    } ${size === 'xs' ? 'text-xs p-1' : ''}`}
  >
    {children}
  </button>
);

export default SocialMediaPage;