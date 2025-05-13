// client/src/pages/SocialMediaPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Zap, Plus, Calendar, Menu, LayoutGrid, Clock } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import supabase from "../lib/supabase";
import Sidebar from "../components/Sidebar";
import SocialPostForm from "../components/SocialPostForm";

function SocialMediaPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  // Credits and subscription state
  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [creditsError, setCreditsError] = useState(null);

  // Posts and UI state
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [completedPosts, setCompletedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [activeTab, setActiveTab] = useState("create");

  // For mobile menu
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Refs to track initialization
  const postsLoadedRef = useRef(false);
  const creditsLoadedRef = useRef(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      if (!postsLoadedRef.current) {
        loadUserPosts();
        postsLoadedRef.current = true;
      }
      if (!creditsLoadedRef.current) {
        loadUserCredits();
        loadUserSubscription();
        creditsLoadedRef.current = true;
      }
    }
  }, [user]);

  // Load user posts
  const loadUserPosts = async () => {
    setIsLoadingPosts(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("No active session");
      }
      
      // Fetch scheduled posts
      const response = await fetch(`${API_URL}/social/scheduled`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch scheduled posts');
      }
      
      const data = await response.json();
      
      // Process posts and separate them by status
      if (data && data.scheduledPosts) {
        const scheduled = [];
        const completed = [];
        
        data.scheduledPosts.forEach(post => {
          // Convert dates to JS Date objects for easier handling
          const postWithDates = {
            ...post,
            scheduledDate: new Date(post.scheduled_at),
            createdDate: new Date(post.created_at)
          };
          
          if (post.status === 'published' || post.status === 'completed') {
            completed.push(postWithDates);
          } else {
            scheduled.push(postWithDates);
          }
        });
        
        // Sort posts by scheduled date
        scheduled.sort((a, b) => a.scheduledDate - b.scheduledDate);
        completed.sort((a, b) => b.scheduledDate - a.scheduledDate);
        
        setScheduledPosts(scheduled);
        setCompletedPosts(completed);
      }
    } catch (err) {
      console.error("Error loading posts:", err);
      // If API fails, use mock data for development
      const currentDate = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      
      setScheduledPosts([
        {
          id: 1,
          title: "Summer Collection Launch",
          content: "✨ Introducing our newest Summer Collection! Perfect for hot days. Check it out online or in-store today.",
          status: "scheduled",
          scheduledDate: tomorrow,
          createdDate: currentDate,
          platforms: ["instagram", "facebook"]
        },
        {
          id: 2,
          title: "Weekend Sale",
          content: "🔥 SALE ALERT! Take 25% off all summer products this weekend only! Shop now before these deals are gone.",
          status: "scheduled",
          scheduledDate: dayAfter,
          createdDate: currentDate,
          platforms: ["instagram"]
        }
      ]);
      
      setCompletedPosts([
        {
          id: 3,
          title: "Product Highlight",
          content: "Did you know our organic cotton tees are eco-friendly and super comfortable? 🌿 #SustainableFashion",
          status: "published",
          scheduledDate: lastWeek,
          publishedDate: lastWeek,
          createdDate: lastWeek,
          platforms: ["instagram", "facebook"]
        }
      ]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Load user credits
  const loadUserCredits = async () => {
    try {
      setCreditsLoading(true);
      setCreditsError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCreditsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/users/credits`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          setCredits({
            available_credits: 0,
            total_credits_received: 0,
            credits_used: 0
          });
        } else {
          const errorData = await response.json();
          setCreditsError(errorData.error || 'Failed to load credits');
          throw new Error(errorData.error || 'Failed to load credits');
        }
      } else {
        const data = await response.json();
        setCredits(data);
      }
    } catch (err) {
      setCreditsError(err.message);
      console.error('Error loading user credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Load user subscription
  const loadUserSubscription = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setSubscription(null);
        return;
      }
      const response = await fetch(`${API_URL}/users/subscription`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.subscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      setSubscription(null);
      console.error('Error loading user subscription:', err);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle tab switching
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  // Handle new post created
  const handlePostScheduled = (newPost) => {
    // Add the new post to the scheduled posts list
    const scheduledDate = new Date(newPost.scheduled_at);
    
    const formattedPost = {
      ...newPost,
      scheduledDate,
      createdDate: new Date(newPost.created_at)
    };
    
    setScheduledPosts(prev => [...prev, formattedPost].sort((a, b) => a.scheduledDate - b.scheduledDate));
    
    // Switch to the scheduled tab to show the new post
    setActiveTab("scheduled");
  };

  // Handle post deletion
  const handleDeletePost = async (postId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to delete posts");
      }
      
      const response = await fetch(`${API_URL}/social/scheduled/${postId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete post');
      }
      
      // Remove the post from state
      setScheduledPosts(prev => prev.filter(post => post.id !== postId));
      
    } catch (err) {
      console.error("Error deleting post:", err);
      alert(`Failed to delete post: ${err.message}`);
    }
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
                    
    const isTomorrow = date.getDate() === tomorrow.getDate() && 
                       date.getMonth() === tomorrow.getMonth() && 
                       date.getFullYear() === tomorrow.getFullYear();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Copy post content to clipboard
  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    alert('Post content copied to clipboard!');
  };

  return (
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
      {/* Sidebar */}
      <Sidebar activePage="social" onLogout={handleLogout} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#23262F] px-2 sm:px-6 py-2 sm:py-4 shadow flex items-center justify-between border-b border-[#23262F]/60 min-h-[48px]">
          {/* Mobile menu button */}
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
          </div>
          
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
          
          {/* Tabs */}
          <div className="flex space-x-1 ml-auto sm:ml-6">
            <button
              onClick={() => handleTabChange("create")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "create"
                  ? "bg-pastel-blue/20 shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              Create
            </button>
            <button
              onClick={() => handleTabChange("scheduled")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "scheduled"
                  ? "bg-pastel-blue/20 shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              Scheduled
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Create Tab */}
          {activeTab === "create" && (
            <div className="w-full max-w-3xl mx-auto">
              <SocialPostForm
                onPostScheduled={handlePostScheduled}
              />
            </div>
          )}

          {/* Scheduled Tab */}
          {activeTab === "scheduled" && (
            <div className="w-full max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    Your Scheduled Posts
                  </h2>
                  <p className="text-gray-300 text-sm mt-1">
                    {scheduledPosts.length > 0
                      ? `${scheduledPosts.length} post${scheduledPosts.length !== 1 ? "s" : ""} scheduled`
                      : "No scheduled posts yet"}
                  </p>
                </div>
                
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setActiveTab("create")}
                  className="px-4 py-2 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg flex items-center gap-2"
                >
                  <Plus size={18} />
                  <span>New Post</span>
                </motion.button>
              </div>
              
              {isLoadingPosts ? (
                // Loading skeleton
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div 
                      key={`skeleton-${idx}`}
                      className="bg-[#23262F] rounded-xl p-4 animate-pulse"
                    >
                      <div className="h-6 bg-[#181A20]/60 rounded w-1/3 mb-3"></div>
                      <div className="h-4 bg-[#181A20]/60 rounded w-full mb-2"></div>
                      <div className="h-4 bg-[#181A20]/60 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : scheduledPosts.length > 0 ? (
                // Scheduled posts list
                <div className="space-y-4">
                  {scheduledPosts.map(post => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#23262F] rounded-xl p-4 border border-[#23262F]/60"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold text-white">
                          {post.title || 'Untitled Post'}
                        </h3>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {post.status}
                          </span>
                          
                          <div className="flex items-center gap-1">
                            {/* Platforms */}
                            {post.platforms && post.platforms.map(platform => (
                              <span 
                                key={platform} 
                                className="text-xs px-2 py-0.5 bg-[#181A20] rounded-full"
                              >
                                {platform}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-white/80 text-sm my-2">{post.content}</p>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#181A20]">
                        <div className="flex items-center text-xs text-white/60">
                          <Clock size={12} className="mr-1" />
                          <span>Scheduled for: {formatDate(post.scheduledDate)}</span>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleCopyContent(post.content)}
                            className="p-1.5 rounded text-white/70 hover:text-white hover:bg-[#181A20]"
                            title="Copy content"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                          
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this post?')) {
                                handleDeletePost(post.id);
                              }
                            }}
                            className="p-1.5 rounded text-white/70 hover:text-pastel-pink hover:bg-[#181A20]"
                            title="Delete post"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                // Empty state
                <div className="bg-[#23262F] rounded-xl p-8 text-center border border-[#23262F]/60">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-pastel-blue/50" />
                  <h3 className="text-xl font-semibold mb-3">No scheduled posts</h3>
                  <p className="text-white/70 mb-6 max-w-md mx-auto">
                    You don't have any posts scheduled for publishing. Create a post to get started.
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
              
              {/* History section */}
              {completedPosts.length > 0 && (
                <div className="mt-12">
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <LayoutGrid className="text-pastel-blue mr-2" size={20} />
                    Post History
                  </h3>
                  
                  <div className="space-y-4">
                    {completedPosts.map(post => (
                      <motion.div
                        key={post.id}
                        className="bg-[#23262F]/50 rounded-xl p-4 border border-[#23262F]"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold text-white/90">
                            {post.title || 'Untitled Post'}
                          </h3>
                          
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                            {post.status}
                          </span>
                        </div>
                        
                        <p className="text-white/70 text-sm my-2">{post.content}</p>
                        
                        <div className="flex items-center text-xs text-white/50 mt-2">
                          <Clock size={12} className="mr-1" />
                          <span>Published: {formatDate(post.publishedDate || post.scheduledDate)}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SocialMediaPage;