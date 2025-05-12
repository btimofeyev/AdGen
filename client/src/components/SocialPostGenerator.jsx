// client/src/components/SocialPostGenerator.jsx
import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, Copy, Send, ArrowRight, Check, Edit, Trash2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_URL } from '../config';
import supabase from '../lib/supabase';

// Theme options for post generation
const THEMES = [
  { id: 'product_promotion', name: 'Product Promotion', emoji: '✨' },
  { id: 'sale_announcement', name: 'Sale Announcement', emoji: '🏷️' },
  { id: 'holiday_special', name: 'Holiday Special', emoji: '🎄' },
  { id: 'tips_and_tricks', name: 'Tips & Tricks', emoji: '💡' }
];

// Social platforms
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' }
];

/**
 * Social Post Generator Component
 */
const SocialPostGenerator = () => {
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    instagram: true,
    facebook: true
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [productName, setProductName] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [schedulingPost, setSchedulingPost] = useState(null);
  
  // Generate post content based on theme
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      // Prepare API request data
      const themeText = customTheme || selectedTheme;
      const selectedPlatformsList = Object.keys(selectedPlatforms).filter(platform => selectedPlatforms[platform]);
      
      if (!themeText) {
        throw new Error("Please select a theme or enter a custom theme");
      }
      
      if (selectedPlatformsList.length === 0) {
        throw new Error("Please select at least one platform");
      }
      
      // Get the auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to generate posts");
      }
      
      // Make the API call
      const response = await fetch(`${API_URL}/social/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          theme: selectedTheme,
          customTheme,
          platforms: selectedPlatformsList,
          count: 3 // Generate 3 posts
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate posts");
      }
      
      const data = await response.json();
      
      // Process received posts
      if (data && data.posts && Array.isArray(data.posts)) {
        // If product name is provided, replace [product] placeholders
        const processedPosts = data.posts.map(post => {
          let content = post.content;
          
          if (productName) {
            content = content.replace(/\[product\]/g, productName);
          }
          
          return {
            ...post,
            content,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: new Date().toISOString()
          };
        });
        
        setGeneratedPosts(processedPosts);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (err) {
      console.error("Error generating posts:", err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };
  
  // Schedule a post
  const handleSchedulePost = (post) => {
    // Show scheduler form
    setSchedulingPost(post);
    setShowScheduler(true);
    
    // Set default date and time (tomorrow at noon)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setScheduledTime('12:00');
  };
  
  // Confirm scheduling
  const confirmSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      alert('Please select both date and time');
      return;
    }
    
    try {
      // Get the auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("You must be logged in to schedule posts");
      }
      
      // Get selected platforms
      const selectedPlatformsList = Object.keys(selectedPlatforms).filter(platform => selectedPlatforms[platform]);
      
      // Make API call to schedule post
      const response = await fetch(`${API_URL}/social/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          postId: schedulingPost.id,
          title: schedulingPost.title,
          content: schedulingPost.content,
          imagePrompt: schedulingPost.imagePrompt,
          scheduledDate,
          scheduledTime,
          platforms: selectedPlatformsList
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to schedule post");
      }
      
      // Reset scheduler
      setShowScheduler(false);
      setSchedulingPost(null);
      
      // Show success message
      setShowSuccess(true);
      
      // Hide after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error("Error scheduling post:", err);
      alert("Failed to schedule post: " + err.message);
    }
  };
  
  // Copy post content to clipboard
  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    alert('Post copied to clipboard!');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#23262F] p-6 rounded-xl border border-[#23262F]/60 shadow-sm max-w-4xl mx-auto"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Sparkles className="text-pastel-blue mr-2" size={24} />
          Social Media Post Generator
        </h2>
        <p className="text-white/70">
          Generate engaging posts for your products in seconds
        </p>
      </div>
      
      {/* Theme Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Choose a Theme</h3>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          {THEMES.map(theme => (
            <motion.button
              key={theme.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedTheme(theme.id);
                setCustomTheme('');
              }}
              className={`p-3 rounded-lg flex items-center border transition-all ${
                selectedTheme === theme.id 
                  ? 'bg-pastel-blue/20 border-pastel-blue text-white' 
                  : 'bg-[#181A20] border-[#181A20] hover:border-pastel-blue/30 text-white/80 hover:text-white'
              }`}
            >
              <span className="text-xl mr-2">{theme.emoji}</span>
              <span className="font-medium">{theme.name}</span>
            </motion.button>
          ))}
        </div>
        
        <div className="mb-5">
          <label className="block text-sm font-medium mb-2 text-white/80">Or enter a custom theme:</label>
          <input
            type="text"
            value={customTheme}
            onChange={(e) => {
              setCustomTheme(e.target.value);
              setSelectedTheme('');
            }}
            placeholder="e.g., Summer Collection Launch"
            className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
          />
        </div>
      </div>
      
      {/* Product Info */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Product Details</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white/80">Product Name (will replace [product] in templates)</label>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="e.g., Eco-friendly Water Bottle"
            className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
          />
        </div>
      </div>
      
      {/* Platform Selection */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Choose Platforms</h3>
        
        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map(platform => (
            <motion.button
              key={platform.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => togglePlatform(platform.id)}
              className={`px-4 py-2 rounded-lg border flex items-center gap-2 transition-all ${
                selectedPlatforms[platform.id]
                  ? 'bg-[#181A20] border-pastel-blue/50 text-white'
                  : 'bg-[#181A20] border-[#181A20] text-white/70'
              }`}
              style={selectedPlatforms[platform.id] ? { borderColor: platform.color } : {}}
            >
              <span style={{ color: platform.color }}>{platform.name}</span>
              {selectedPlatforms[platform.id] && (
                <Check size={16} style={{ color: platform.color }} />
              )}
            </motion.button>
          ))}
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-400">
          <p className="font-medium">Error: {error}</p>
        </div>
      )}
      
      {/* Generate Button */}
      <div className="mb-8">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerate}
          disabled={isGenerating || (!selectedTheme && !customTheme)}
          className="w-full py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin h-5 w-5 border-2 border-[#181A20]/20 border-t-[#181A20] rounded-full mr-2"></div>
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} className="mr-2" />
              <span>Generate Post Ideas</span>
            </>
          )}
        </motion.button>
      </div>
      
      {/* Generated Posts */}
      {generatedPosts.length > 0 && (
        <div className="border-t border-[#181A20]/50 pt-6">
          <h3 className="text-lg font-semibold mb-4">Generated Posts</h3>
          
          <div className="space-y-6">
            {generatedPosts.map((post, index) => (
              <motion.div 
                key={post.id || index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-[#181A20] border border-[#181A20]/80 rounded-lg p-4"
              >
                <h4 className="font-medium mb-2 text-white">{post.title}</h4>
                <p className="text-white/80 text-sm mb-4">{post.content}</p>
                
                <div className="p-3 bg-[#23262F]/60 rounded-lg mb-4">
                  <div className="flex items-center text-xs font-medium text-white/70 mb-1">
                    <span>Image Prompt:</span>
                  </div>
                  <p className="text-sm italic text-white/80">{post.imagePrompt}</p>
                </div>
                
                {post.bestTime && (
                  <div className="flex items-center text-xs text-white/60 mb-3">
                    <Clock size={12} className="mr-1" />
                    <span>Best time to post: {post.bestTime}</span>
                  </div>
                )}
                
                <div className="flex flex-wrap justify-between gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleCopyContent(post.content)}
                    className="px-3 py-1.5 border border-[#23262F] rounded-lg text-sm flex items-center hover:bg-[#23262F]/50"
                  >
                    <Copy size={14} className="mr-1" />
                    <span>Copy</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSchedulePost(post)}
                    className="px-3 py-1.5 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg text-sm flex items-center"
                  >
                    <Calendar size={14} className="mr-1" />
                    <span>Schedule Post</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Create Images CTA */}
          <div className="mt-8 p-4 bg-[#181A20] border border-[#181A20]/80 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="font-medium text-white">Need images for these posts?</h4>
              <p className="text-sm text-white/70">
                Use our Image Studio to create matching visuals
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => window.location.href = '/create'}
              className="px-4 py-2 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg flex items-center whitespace-nowrap"
            >
              <span>Create Images</span>
              <ArrowRight size={16} className="ml-1" />
            </motion.button>
          </div>
        </div>
      )}
      
      {/* Scheduler Modal */}
      <AnimatePresence>
        {showScheduler && schedulingPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowScheduler(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#23262F] rounded-xl p-6 max-w-lg w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Calendar className="mr-2 text-pastel-blue" size={20} />
                Schedule Post
              </h3>
              
              <div className="mb-4">
                <div className="p-4 bg-[#181A20] rounded-lg mb-4">
                  <p className="text-white/80 text-sm">{schedulingPost.content}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white/80">
                      Platform
                    </label>
                    <div className="flex gap-3">
                      {PLATFORMS.map(platform => (
                        <button
                          key={platform.id}
                          type="button"
                          className={`flex-1 py-2 px-3 rounded-lg border ${
                            selectedPlatforms[platform.id]
                              ? 'border-' + platform.color.substring(1) + '/50 bg-' + platform.color.substring(1) + '/10'
                              : 'border-[#181A20] bg-[#181A20] text-white/60'
                          }`}
                          style={{ borderColor: selectedPlatforms[platform.id] ? platform.color : undefined }}
                          onClick={() => togglePlatform(platform.id)}
                        >
                          <span style={{ color: selectedPlatforms[platform.id] ? platform.color : undefined }}>
                            {platform.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={() => setShowScheduler(false)}
                    className="px-4 py-2 border border-[#181A20] hover:border-pastel-blue/30 rounded-lg"
                  >
                    Cancel
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    onClick={confirmSchedule}
                    className="px-4 py-2 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium"
                  >
                    Schedule Post
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-50"
          >
            <Check size={20} className="mr-2" />
            <div>
              <p className="font-medium">Post scheduled!</p>
              <p className="text-sm">Your post has been added to the schedule</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SocialPostGenerator;