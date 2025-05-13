// client/src/pages/SocialMediaPage.jsx
import React, { useState, useRef, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Zap, Plus, Copy, Calendar, Menu } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import supabase from "../lib/supabase";
import Sidebar from "../components/Sidebar";
import SocialPostGenerator from "../components/SocialPostGenerator";
import ComposePostForm from "../components/ComposePostForm";

const CreditCard = React.forwardRef(({ className, ...props }, ref) => (
  <svg
    {...props}
    ref={ref}
    className={className}
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
));
const AlertCircle = React.forwardRef(({ className, ...props }, ref) => (
  <svg
    {...props}
    ref={ref}
    className={className}
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
));
const Edit = React.forwardRef(({ className, ...props }, ref) => (
  <svg
    {...props}
    ref={ref}
    className={className}
    width={24}
    height={24}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
));

function SocialMediaPage() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [creditsError, setCreditsError] = useState(null);

  const [activeTab, setActiveTab] = useState("create");

  const creditsLoadedRef = useRef(false);
  const imagesLoadedRef = useRef(false);

  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

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
    // eslint-disable-next-line
  }, [user]);

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
        headers: { Authorization: `Bearer ${session.access_token}` },
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
        }
      } else {
        setCredits(await response.json());
      }
    } catch (err) {
      setCreditsError(err.message);
    } finally {
      setCreditsLoading(false);
    }
  };

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
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (response.ok) setSubscription((await response.json()).subscription);
      else setSubscription(null);
    } catch {
      setSubscription(null);
    }
  };

  const loadUserPosts = async () => {
    setIsLoadingPosts(true);
    setTimeout(() => {
      setGeneratedPosts([
        {
          id: 1,
          title: "Summer Collection Launch",
          content:
            "✨ Introducing our newest Summer Collection! Perfect for hot days. Check it out online or in-store today.",
          status: "scheduled",
          scheduledFor: "2025-05-20T10:00:00Z",
          created_at: "2025-05-15T10:00:00Z",
        },
        {
          id: 2,
          title: "Weekend Sale",
          content:
            "🔥 SALE ALERT! Take 25% off all summer products this weekend only! Shop now before these deals are gone.",
          status: "published",
          publishedAt: "2025-05-10T15:30:00Z",
          created_at: "2025-05-10T10:00:00Z",
        },
        {
          id: 3,
          title: "Product Benefits Highlight",
          content:
            "Did you know our organic cotton tees are eco-friendly and super comfortable?",
          status: "draft",
          created_at: "2025-05-14T16:45:00Z",
        },
      ]);
      setIsLoadingPosts(false);
    }, 1000);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleTabChange = (tab) => setActiveTab(tab);

  const handleRefreshCredits = () => {
    setCreditsLoading(true);
    loadUserCredits();
    creditsLoadedRef.current = true;
  };

  // ---- SidebarContent Memoized ----
  const SidebarContent = useMemo(
    () => (
      <div className="w-80 p-6 bg-[#23262F] border-l border-[#23262F]/60 overflow-y-auto">
        <div className="mb-8">
          <div className="bg-background rounded-lg border border-border shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Zap className="h-4 w-4 mr-2 text-pastel-blue" />
                <h3 className="text-sm font-medium text-charcoal dark:text-white">
                  Available Credits
                </h3>
              </div>
              {subscription && (
                <div className="flex items-center bg-pastel-blue/10 dark:bg-pastel-blue/20 rounded-full px-2 py-0.5">
                  <CreditCard className="h-3 w-3 mr-1 text-pastel-blue" />
                  <span className="text-xs text-pastel-blue font-medium">
                    {subscription.plan_id
                      ? subscription.plan_id.charAt(0).toUpperCase() +
                        subscription.plan_id.slice(1)
                      : "Subscription"}
                  </span>
                </div>
              )}
              <button
                onClick={handleRefreshCredits}
                size="xs"
                className="ml-2 text-xs text-pastel-blue hover:underline"
              >
                ↻
              </button>
            </div>
            <div className="mb-2">
              <div className="text-3xl font-bold text-charcoal dark:text-white">
                {credits?.available_credits || 0}
              </div>
            </div>
            <div className="flex justify-between mt-1 text-xs text-charcoal/60 dark:text-gray-400">
              <span>{credits?.credits_used || 0} used</span>
              <span>{credits?.total_credits_received || 0} total</span>
            </div>
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
            Your {subscription.plan_id} plan renews on{" "}
            {subscription.current_period_end
              ? new Date(subscription.current_period_end).toLocaleDateString()
              : "upcoming billing date"}
          </div>
        ) : (
          <Link to="/pricing">
            <button className="w-full py-2 px-4 rounded-md font-medium bg-background border border-pastel-blue text-charcoal hover:bg-pastel-blue/10 dark:text-white">
              {credits && credits.available_credits < 5
                ? "Get More Credits"
                : "Upgrade Plan"}
            </button>
          </Link>
        )}
      </div>
    ),
    [credits, subscription]
  );

  function ScheduledPostCard({ post, onCopy, onEdit, onDelete }) {
    if (post.status !== "scheduled") return null;
    return (
      <div className="relative group rounded-lg overflow-hidden bg-[#1F222A] shadow-sm border border-[#1F222A]/80 p-4">
        <div className="flex justify-between mb-2">
          <h4 className="font-medium">{post.title}</h4>
          <div
            className={`text-xs px-2 py-0.5 rounded-full ${
              post.status === "published"
                ? "bg-green-100 text-green-800"
                : post.status === "scheduled"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {post.status}
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => onCopy(post.content)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white"
              title="Copy"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => onEdit(post)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white"
              title="Edit"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded text-white"
              title="Delete"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="mb-2 text-sm text-gray-200">{post.content}</div>
        <div className="text-xs text-gray-400">
          Scheduled: {new Date(post.scheduledFor).toLocaleString()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-row bg-[#181A20] text-gray-100">
      {/* Left Sidebar */}
      <Sidebar activePage="social" onLogout={handleLogout} />
      {/* Main Content & Right Sidebar */}
      <div className="flex flex-1 flex-row min-h-screen">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <header className="bg-[#23262F] px-2 sm:px-6 py-2 sm:py-4 shadow flex items-center justify-between border-b border-[#23262F]/60 min-h-[48px]">
            <button
              className="sm:hidden p-2 rounded-lg hover:bg-pastel-blue/10 focus:outline-none focus:ring-2 focus:ring-pastel-blue mr-2 flex-shrink-0"
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
          </header>

          {/* Content Tabs */}
          <div className="flex gap-2 px-6 pt-6">
            <button
              className={`px-4 py-2 rounded-t-lg ${
                activeTab === "create"
                  ? "bg-pastel-blue text-[#181A20] font-bold"
                  : "bg-[#23262F] text-gray-300"
              }`}
              onClick={() => handleTabChange("create")}
            >
              Create
            </button>
            <button
              className={`px-4 py-2 rounded-t-lg ${
                activeTab === "scheduled"
                  ? "bg-pastel-blue text-[#181A20] font-bold"
                  : "bg-[#23262F] text-gray-300"
              }`}
              onClick={() => handleTabChange("scheduled")}
            >
              Scheduled
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-auto">
            {/* Create Tab: generator appears here */}
            {activeTab === "create" && (
              <div className="w-full max-w-5xl mx-auto">
                <ComposePostForm
                  onPostScheduled={(newPost) =>
                    setGeneratedPosts((posts) => [...posts, newPost])
                  }
                />
              </div>
            )}

            {/* Scheduled Tab */}
            {activeTab === "scheduled" && (
              <div className="w-full max-w-6xl mx-auto flex flex-col h-full">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Your Scheduled Posts
                    </h2>
                    <p className="text-gray-300 text-sm mt-1">
                      {generatedPosts.filter((p) => p.status === "scheduled")
                        .length > 0
                        ? `${
                            generatedPosts.filter(
                              (p) => p.status === "scheduled"
                            ).length
                          } post${
                            generatedPosts.filter(
                              (p) => p.status === "scheduled"
                            ).length !== 1
                              ? "s"
                              : ""
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
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={`skeleton-${idx}`}
                        className="rounded-xl bg-[#23262F] border border-[#23262F]/60 shadow-sm overflow-hidden p-4 animate-pulse h-24"
                      ></div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generatedPosts.filter((p) => p.status === "scheduled")
                      .length > 0 ? (
                      generatedPosts
                        .filter((p) => p.status === "scheduled")
                        .map((post) => (
                          <ScheduledPostCard
                            key={post.id}
                            post={post}
                            onCopy={(content) => {
                              navigator.clipboard.writeText(content);
                              alert("Content copied!");
                            }}
                            onEdit={(post) => alert("Edit post " + post.id)}
                            onDelete={(id) =>
                              window.confirm(
                                "Are you sure you want to delete this post?"
                              ) &&
                              setGeneratedPosts((posts) =>
                                posts.filter((p) => p.id !== id)
                              )
                            }
                          />
                        ))
                    ) : (
                      <div className="bg-[#23262F] rounded-xl p-8 text-center border border-[#23262F]/60 col-span-full">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-pastel-blue/50" />
                        <h3 className="text-xl font-semibold mb-3">
                          No scheduled posts
                        </h3>
                        <p className="text-white/70 mb-6 max-w-md mx-auto">
                          You don't have any posts scheduled for publishing.
                          Create a post and schedule it.
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
        {/* Right Sidebar (desktop only) */}
        <aside className="hidden lg:block">{SidebarContent}</aside>
      </div>
    </div>
  );
}

export default SocialMediaPage;
