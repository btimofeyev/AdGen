// client/src/pages/SocialMediaPage.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Plus,
  Calendar,
  Menu,
  LayoutGrid,
  Clock,
  ImagePlus,
  User,
  LogOut,
  Home,
  Copy,
  Trash2,
  Eye,
  Paperclip,
} from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API_URL } from "../config";
import supabase from "../lib/supabase";
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
  const [pastPosts, setPastPosts] = useState([]);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [activeTab, setActiveTab] = useState("create");

  // For mobile menu
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Refs to track initialization
  const postsLoadedRef = useRef(false);
  const creditsLoadedRef = useRef(false);
  const imagesLoadedRef = useRef(false);

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
        console.log(
          "SocialMediaPage: User detected, attempting to load posts."
        );
        loadUserPosts();
        postsLoadedRef.current = true;
      }
      if (!creditsLoadedRef.current) {
        loadUserCredits();
        loadUserSubscription();
        creditsLoadedRef.current = true;
      }
      if (!imagesLoadedRef.current) {
        loadUserImages();
        imagesLoadedRef.current = true;
      }
    }
  }, [user]);

  // Load user generated images
  const loadUserImages = async () => {
    setIsLoadingImages(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const response = await fetch(`${API_URL}/user/images?limit=5`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        let errorMsg = "Failed to fetch images";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (e) {
          /* ignore parsing error if response not json */
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (data && data.images && Array.isArray(data.images)) {
        setGeneratedImages(data.images.slice(0, 5));
      } else {
        setGeneratedImages([]);
      }
    } catch (err) {
      console.error("Error loading user images:", err);
      setGeneratedImages([
        {
          id: "img1",
          title: "Mock Image 1",
          base64Image: "https://via.placeholder.com/150?text=Mock1",
          daysRemaining: 5,
          created_at: new Date().toISOString(),
        },
        {
          id: "img2",
          title: "Mock Image 2",
          base64Image: "https://via.placeholder.com/150?text=Mock2",
          daysRemaining: 3,
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
      ]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Load user posts
  const loadUserPosts = async () => {
    setIsLoadingPosts(true);
    console.log("loadUserPosts: Fetching scheduled posts...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const response = await fetch(`${API_URL}/social/scheduled`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        let errorMsg = "Failed to fetch scheduled posts";
        try {
          const errorData = await response.json();
          errorMsg = errorData.message || errorData.error || errorMsg;
        } catch (e) {
          /* ignore */
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("loadUserPosts: Received data:", data);

      if (data && data.scheduledPosts) {
        const scheduled = [];
        const past = [];
        const now = new Date();

        data.scheduledPosts.forEach((post) => {
          const scheduledAtDate = new Date(post.scheduled_at);
          const postWithDates = {
            ...post, // Includes image_url_for_display from the backend
            scheduledDate: scheduledAtDate,
            createdDate: new Date(post.created_at),
            publishedDate: post.posted_at
              ? new Date(post.posted_at)
              : post.status === "published" || post.status === "completed"
              ? scheduledAtDate
              : null,
          };

          if (
            post.status === "published" ||
            post.status === "completed" ||
            (post.status === "scheduled" && scheduledAtDate < now)
          ) {
            past.push(postWithDates);
          } else if (post.status === "scheduled" && scheduledAtDate >= now) {
            scheduled.push(postWithDates);
          } else {
            past.push(postWithDates);
          }
        });
        scheduled.sort((a, b) => a.scheduledDate - b.scheduledDate);
        past.sort((a, b) => b.scheduledDate - a.scheduledDate);

        console.log(
          "loadUserPosts: Final scheduled posts for state:",
          scheduled.map((p) => ({
            id: p.id,
            title: p.title,
            image_url: p.image_url,
          }))
        );
        console.log(
          "loadUserPosts: Final past posts for state:",
          past.map((p) => ({
            id: p.id,
            title: p.title,
            image_url: p.image_url,
          }))
        );

        setScheduledPosts(scheduled);
        setPastPosts(past);
      } else {
        setScheduledPosts([]);
        setPastPosts([]);
        console.log(
          "loadUserPosts: No scheduledPosts array in response or data is null."
        );
      }
    } catch (err) {
      console.error("Error loading posts:", err);
      const currentDate = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(currentDate.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(currentDate.getDate() + 2);
      const lastWeek = new Date();
      lastWeek.setDate(currentDate.getDate() - 7);

      setScheduledPosts([
        {
          id: "mockScheduled1",
          title: "Mock Summer Launch",
          content: "Mock content for summer.",
          status: "scheduled",
          scheduledDate: tomorrow,
          createdDate: currentDate,
          platforms: ["instagram"],
          image_url:
            "https://via.placeholder.com/300x200?text=Scheduled+Summer",
        },
        {
          id: "mockScheduled2",
          title: "Mock Weekend Sale",
          content: "Sale details.",
          status: "scheduled",
          scheduledDate: dayAfter,
          createdDate: currentDate,
          platforms: ["facebook"],
          image_url: null,
        },
      ]);
      setPastPosts([
        {
          id: "mockPast1",
          title: "Mock Product Highlight",
          content: "Eco-friendly tees info.",
          status: "published",
          scheduledDate: lastWeek,
          publishedDate: lastWeek,
          createdDate: lastWeek,
          platforms: ["instagram", "facebook"],
          image_url: "https://via.placeholder.com/300x200?text=Past+Product",
        },
      ]);
    } finally {
      setIsLoadingPosts(false);
    }
  };

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
        if (response.status === 404)
          setCredits({
            available_credits: 0,
            total_credits_received: 0,
            credits_used: 0,
          });
        else {
          const errorData = await response.json();
          setCreditsError(errorData.error || "Failed to load credits");
          throw new Error(errorData.error || "Failed to load credits");
        }
      } else setCredits(await response.json());
    } catch (err) {
      setCreditsError(err.message);
      console.error("Error loading user credits:", err);
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
    } catch (err) {
      setSubscription(null);
      console.error("Error loading user subscription:", err);
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

  const handleTabChange = (tab) => setActiveTab(tab);

  const handlePostScheduled = (newPost) => {
    console.log(
      "SocialMediaPage: handlePostScheduled called with newPost:",
      JSON.stringify(newPost, null, 2)
    );
    const scheduledDate = new Date(newPost.scheduled_at);
    const formattedPost = {
      ...newPost,
      scheduledDate,
      createdDate: new Date(newPost.created_at),
      image_url: newPost.image_url || newPost.imageUrl || null,
    };
    console.log(
      "SocialMediaPage: Formatted new post being added to state:",
      JSON.stringify(formattedPost, null, 2)
    );
    setScheduledPosts((prev) =>
      [...prev, formattedPost].sort((a, b) => a.scheduledDate - b.scheduledDate)
    );
  };

  const handleDeletePost = async (postId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) throw new Error("You must be logged in to delete posts");
      const response = await fetch(`${API_URL}/social/scheduled/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!response.ok)
        throw new Error(
          (await response.json()).message || "Failed to delete post"
        );
      setScheduledPosts((prev) => prev.filter((post) => post.id !== postId));
      setPastPosts((prev) => prev.filter((post) => post.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      alert(`Failed to delete post: ${err.message}`);
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return "Invalid Date";

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const isToday =
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
    const isTomorrow =
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear();

    const timeString = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (isToday) return `Today at ${timeString}`;
    if (isTomorrow) return `Tomorrow at ${timeString}`;
    return `${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    })} at ${timeString}`;
  };

  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    alert("Post content copied to clipboard!");
  };

  return (
    <div className="min-h-screen flex bg-[#181A20] text-gray-100">
      <div className="hidden sm:flex w-16 bg-[#23262F] shadow flex-col items-center py-6 space-y-6 border-r border-[#23262F]/60">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2">
          <Calendar size={20} className="text-pastel-blue" />
        </div>
        <SidebarIcon
          icon={<ImagePlus size={20} />}
          onClick={() => navigate("/create")}
        />
        <SidebarIcon
          icon={<User size={20} />}
          onClick={() => navigate("/account")}
        />
        <SidebarIcon icon={<Home size={20} />} onClick={() => navigate("/")} />
        <div className="mt-auto">
          <SidebarIcon icon={<LogOut size={20} />} onClick={handleLogout} />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-[#23262F] px-2 sm:px-6 py-2 sm:py-4 shadow flex items-center justify-between border-b border-[#23262F]/60 min-h-[48px]">
          <button
            className="sm:hidden p-2 rounded-lg hover:bg-pastel-blue/10 focus:outline-none focus:ring-2 focus:ring-pastel-blue"
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
              onClick={() => handleTabChange("history")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "bg-pastel-blue/20 shadow-sm text-white"
                  : "text-gray-300 hover:text-white hover:bg-[#23262F]/80"
              }`}
            >
              History
            </button>
          </div>
        </header>

        <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-7 gap-4 overflow-y-auto">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-white">Scheduled Posts</h2>
              <Link
                to="/create"
                className="text-sm text-pastel-blue hover:text-pastel-blue/80 flex items-center"
              >
                <Plus size={16} className="mr-1" />
                <span>Create</span>
              </Link>
            </div>
            {isLoadingPosts ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={`skel-sch-${idx}`}
                    className="bg-[#23262F] rounded-xl p-4 animate-pulse"
                  >
                    <div className="h-4 bg-[#181A20]/60 rounded w-1/3 mb-3"></div>
                    <div className="h-3 bg-[#181A20]/60 rounded w-full mb-2"></div>
                    <div className="h-3 bg-[#181A20]/60 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : scheduledPosts.length > 0 ? (
              <div className="space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
                {scheduledPosts.map((post) => {
                  // console.log(`Rendering scheduled post: ID=${post.id}, Title='${post.title}', ImageURL='${post.image_url}'`);
                  return (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#23262F] rounded-xl p-4 border border-[#23262F]/60 hover:border-pastel-blue/20 transition-all"
                    >
                      {(post.image_url_for_display || post.image_url) && (
                        <div className="mb-3 rounded-lg overflow-hidden aspect-video bg-[#181A20] relative">
                          <img
                            src={post.image_url_for_display || post.image_url}
                            alt={post.title || "Scheduled post image"}
                            onError={(e) => {
                              console.error(
                                `Image failed to load: ${post.image_url}`,
                                e
                              );
                              e.target.style.display = "none";
                              const parent = e.target.parentElement;
                              if (
                                parent &&
                                !parent.querySelector(
                                  ".image-error-placeholder"
                                )
                              ) {
                                const placeholder =
                                  document.createElement("div");
                                placeholder.className =
                                  "image-error-placeholder absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#1c1e25] text-slate-500 text-xs p-2";
                                placeholder.innerHTML = `
                                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                          <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                          <polyline points="21 15 16 10 5 21"></polyline>
                                      </svg>
                                      <span class="mt-1 text-center">Image preview unavailable</span>`;
                                parent.appendChild(placeholder);
                              }
                            }}
                          />
                        </div>
                      )}
                      <h3 className="font-semibold text-white text-sm">
                        {post.title || "Untitled Post"}
                      </h3>
                      <p className="text-white/80 text-xs my-2 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center text-xs text-white/60">
                          <Clock size={12} className="mr-1" />
                          <span>{formatDate(post.scheduledDate)}</span>
                        </div>
                        <div className="flex gap-1 items-center">
                          {post.image_url && (
                            <Paperclip
                              size={14}
                              className="text-white/50"
                              title="Contains image"
                            />
                          )}
                          <button
                            onClick={() => handleCopyContent(post.content)}
                            className="p-1 rounded text-white/70 hover:text-white hover:bg-[#181A20]"
                            title="Copy content"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  "Are you sure you want to delete this scheduled post?"
                                )
                              )
                                handleDeletePost(post.id);
                            }}
                            className="p-1 rounded text-white/70 hover:text-pastel-pink hover:bg-[#181A20]"
                            title="Delete post"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#23262F] rounded-xl p-6 text-center border border-[#23262F]/60">
                <Calendar className="w-10 h-10 mx-auto mb-3 text-pastel-blue/50" />
                <h3 className="text-base font-semibold mb-2">
                  No scheduled posts
                </h3>
                <p className="text-white/70 text-sm mb-4">
                  Your future posts will appear here.
                </p>
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            {activeTab === "create" ? (
              <SocialPostForm onPostScheduled={handlePostScheduled} />
            ) : (
              <div className="bg-[#23262F] p-6 rounded-xl border border-[#23262F]/60 shadow-sm h-full">
                <h2 className="text-xl font-bold mb-5 flex items-center">
                  <LayoutGrid className="text-pastel-blue mr-2" size={20} />{" "}
                  Post History
                </h2>
                {isLoadingPosts ? (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={`skel-past-${idx}`}
                        className="bg-[#23262F]/50 rounded-xl p-4 animate-pulse"
                      >
                        <div className="h-4 bg-[#181A20]/60 rounded w-1/3 mb-3"></div>
                        <div className="h-3 bg-[#181A20]/60 rounded w-full mb-2"></div>
                        <div className="h-3 bg-[#181A20]/60 rounded w-2/3"></div>
                      </div>
                    ))}
                  </div>
                ) : pastPosts.length > 0 ? (
                  <div className="space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                    {pastPosts.map((post) => {
                      // console.log(`Rendering PAST post: ID=${post.id}, Title='${post.title}', ImageURL='${post.image_url}'`);
                      return (
                        <motion.div
                          key={post.id}
                          className="bg-[#23262F]/50 rounded-xl p-4 border border-[#23262F]"
                        >
                          {post.image_url && (
                            <div className="mb-3 rounded-lg overflow-hidden aspect-video bg-[#181A20] relative">
                              <img
                                src={post.image_url}
                                alt={post.title || "Past post image"}
                                className="w-full h-full object-cover"
                                onLoad={() =>
                                  console.log(
                                    `Past Image loaded successfully: ${post.image_url}`
                                  )
                                }
                                onError={(e) => {
                                  console.error(
                                    `Past Image failed to load: ${post.image_url}`,
                                    e
                                  );
                                  e.target.style.display = "none";
                                  const parent = e.target.parentElement;
                                  if (
                                    parent &&
                                    !parent.querySelector(
                                      ".image-error-placeholder"
                                    )
                                  ) {
                                    const placeholder =
                                      document.createElement("div");
                                    placeholder.className =
                                      "image-error-placeholder absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#1c1e25] text-slate-500 text-xs p-2";
                                    placeholder.innerHTML = `
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                    <polyline points="21 15 16 10 5 21"></polyline>
                                                </svg>
                                                <span class="mt-1 text-center">Image preview unavailable</span>`;
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            </div>
                          )}
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-white/90">
                              {post.title || "Untitled Post"}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                post.status === "published" ||
                                post.status === "completed"
                                  ? "bg-green-700 text-green-100"
                                  : post.status === "failed"
                                  ? "bg-red-700 text-red-100"
                                  : "bg-yellow-700 text-yellow-100"
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <p className="text-white/70 text-sm my-2 line-clamp-3">
                            {post.content}
                          </p>
                          <div className="flex items-center text-xs text-white/50 mt-2">
                            <Clock size={12} className="mr-1" />
                            <span>
                              {post.status === "published" ||
                              post.status === "completed"
                                ? "Published"
                                : "Was scheduled for"}
                              :{" "}
                              {formatDate(
                                post.publishedDate || post.scheduledDate
                              )}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-[#181A20]/30 rounded-lg">
                    <LayoutGrid
                      size={32}
                      className="mx-auto mb-3 text-pastel-blue/30"
                    />
                    <h3 className="text-lg font-medium mb-2">
                      No published posts yet
                    </h3>
                    <p className="text-white/60 text-sm">
                      Your past posts will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="bg-[#23262F] p-6 rounded-xl border border-[#23262F]/60 shadow-sm">
              <h2 className="text-xl font-bold text-white mb-4">Credits</h2>
              {creditsLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-8 bg-[#181A20]/60 rounded-lg w-2/3"></div>
                  <div className="h-4 bg-[#181A20]/60 rounded w-full"></div>
                  <div className="h-3 bg-[#181A20]/60 rounded w-1/2"></div>
                </div>
              ) : credits ? (
                <div>
                  <div className="flex items-center mb-2">
                    <Zap className="h-5 w-5 text-pastel-blue mr-2" />
                    <span className="text-2xl font-bold text-white">
                      {credits.available_credits}
                    </span>
                    <span className="ml-2 text-white/70">
                      credits available
                    </span>
                  </div>
                  <div className="mb-3">
                    <div className="h-2 w-full bg-[#181A20] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-pastel-blue to-pastel-blue/50 rounded-full"
                        style={{
                          width: `${
                            credits.total_credits_received > 0
                              ? Math.min(
                                  (credits.credits_used /
                                    credits.total_credits_received) *
                                    100,
                                  100
                                )
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-white/60">
                      <span>{credits.credits_used} used</span>
                      <span>{credits.total_credits_received} total</span>
                    </div>
                  </div>
                  <Link
                    to="/pricing"
                    className="block w-full py-2 px-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg text-sm font-medium text-center"
                  >
                    Get More Credits
                  </Link>
                </div>
              ) : (
                <div className="text-white/70 text-center py-4">
                  Error loading credits
                  <button
                    onClick={() => {
                      setCreditsLoading(true);
                      loadUserCredits();
                    }}
                    className="block mx-auto mt-2 text-pastel-blue text-sm underline"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#23262F] p-6 rounded-xl border border-[#23262F]/60 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Recent Images</h2>
                <Link
                  to="/create"
                  className="text-sm text-pastel-blue hover:text-pastel-blue/80 flex items-center"
                >
                  <ImagePlus size={16} className="mr-1" />
                  <span>Create</span>
                </Link>
              </div>
              <p className="text-xs text-white/70 mb-3">
                Drag these images into your posts
              </p>
              {isLoadingImages ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`skel-img-${idx}`}
                      className="bg-[#181A20] rounded-lg aspect-square animate-pulse w-full"
                    />
                  ))}
                </div>
              ) : generatedImages.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-1">
                  {generatedImages.map((image, index) => (
                    <motion.div
                      key={image.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="relative aspect-square rounded-lg overflow-hidden border border-[#181A20] hover:border-pastel-blue/30 cursor-move shadow-sm group"
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", image.base64Image);
                        const dragImage = new Image();
                        dragImage.src = image.base64Image;
                        dragImage.className = "w-12 h-12 object-cover";
                        document.body.appendChild(dragImage);
                        e.dataTransfer.setDragImage(dragImage, 30, 30);
                        setTimeout(
                          () => document.body.removeChild(dragImage),
                          0
                        );
                      }}
                    >
                      <img
                        src={image.base64Image}
                        alt={image.title || `Gen image ${index + 1}`}
                        className="w-full h-full object-cover object-center"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-pastel-blue/90 text-[#181A20] text-xs px-2 py-1 rounded-full font-medium">
                          Drag me
                        </div>
                      </div>
                      {image.daysRemaining !== undefined && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-pastel-blue/80 text-[#181A20]">
                          {image.daysRemaining}d
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-[#181A20]/30 rounded-lg">
                  <ImagePlus
                    size={24}
                    className="mx-auto mb-3 text-pastel-blue/30"
                  />
                  <h3 className="text-base font-medium mb-2">No images yet</h3>
                  <p className="text-white/60 text-xs mb-4">
                    Create images in the Image Studio
                  </p>
                  <Link
                    to="/create"
                    className="inline-block px-3 py-1.5 bg-pastel-blue text-[#181A20] rounded-lg text-xs font-medium"
                  >
                    <ImagePlus size={12} className="inline-block mr-1" />
                    Create Images
                  </Link>
                </div>
              )}
              {generatedImages.length > 0 && (
                <div className="mt-4 text-xs text-white/50 bg-[#181A20]/30 rounded-lg p-3 text-center">
                  <p>⚡ Drag an image directly to include it in your post</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SidebarIcon({ icon, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, backgroundColor: "rgba(123, 223, 242, 0.1)" }}
      whileTap={{ scale: 0.9 }}
      className="text-gray-400 hover:text-[#7BDFF2] p-3 rounded-xl transition-all"
      onClick={onClick}
    >
      {icon}
    </motion.button>
  );
}

export default SocialMediaPage;
