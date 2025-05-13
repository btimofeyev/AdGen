// client/src/components/SocialPostForm.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, UploadCloud, Image, Check, Calendar, Copy, Clock, X, AlertCircle, Store, User } from 'lucide-react';
import { API_URL } from '../config';
import supabase from '../lib/supabase';

// Social platforms with consistent styling
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' }
];

// Theme suggestions for AI generation
const THEMES = [
  { id: 'product_promotion', name: 'Product Promotion', emoji: '✨' },
  { id: 'sale_announcement', name: 'Sale Announcement', emoji: '🏷️' },
  { id: 'holiday_special', name: 'Holiday Special', emoji: '🎄' },
  { id: 'tips_and_tricks', name: 'Tips & Tricks', emoji: '💡' }
];

const BUCKET_NAME = 'scenesnapai';

/**
 * Social Post Form Component
 * Combines manual composition with AI assistance
 */
const SocialPostForm = ({ onPostScheduled }) => {
  // Post content state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [productName, setProductName] = useState('');

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  // Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    instagram: true,
    facebook: false
  });

  // AI generation state
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // UI state
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiAssistMode, setAiAssistMode] = useState(false);

  // Get today + 1 day for default scheduling
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getDefaultTime = () => {
    return '12:00';
  };

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platformId]: !prev[platformId]
    }));
  };

  // Handle image file selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image file is too large. Maximum size is 10MB.');
        return;
      }
      
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  // Upload image to Supabase
  const uploadImageToSupabase = async (file) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to upload images');
      }
      
      const userId = session.user.id;
      const timestamp = Date.now();
      const safeName = file.name.replace(/[^A-Za-z0-9.\-_]/g, '_');
      const storagePath = `${userId}/social_images/${timestamp}_${safeName}`;
      
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file);
      
      if (uploadError) {
        throw uploadError;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);
      
      return { publicUrl, storagePath };
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  // Use AI to generate post ideas
  const handleGenerateWithAI = async () => {
    setError(null);
    setIsGenerating(true);
    
    try {
      const themeText = customTheme || selectedTheme;
      
      if (!themeText) {
        throw new Error('Please select a theme or enter a custom theme');
      }
      
      const selectedPlatformsList = Object.keys(selectedPlatforms).filter(platform => selectedPlatforms[platform]);
      
      if (selectedPlatformsList.length === 0) {
        throw new Error('Please select at least one platform');
      }
      
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to generate posts');
      }
      
      // Make API call
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
        throw new Error(errorData.message || 'Failed to generate posts');
      }
      
      const data = await response.json();
      
      if (data && data.posts && Array.isArray(data.posts)) {
        // If product name is provided, replace [product] placeholders
        const processedPosts = data.posts.map(post => {
          let processedContent = post.content;
          
          if (productName) {
            processedContent = processedContent.replace(/\[product\]/g, productName);
          }
          
          return {
            ...post,
            content: processedContent,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: new Date().toISOString()
          };
        });
        
        setGeneratedPosts(processedPosts);
      } else {
        throw new Error('Invalid response format from server');
      }
      
      // Show the AI results
      setAiAssistMode(true);
    } catch (err) {
      console.error('Error generating posts:', err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Use a generated post as the current post
  const applyGeneratedPost = (post) => {
    setTitle(post.title || '');
    setContent(post.content || '');
    setImagePrompt(post.imagePrompt || '');
    
    // Set default scheduling if not already set
    if (!scheduledDate) setScheduledDate(getTomorrowDate());
    if (!scheduledTime) setScheduledTime(getDefaultTime());
    
    // Exit AI assist mode
    setAiAssistMode(false);
  };

  // Schedule the post
  const handleSchedulePost = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    try {
      // Validation
      if (!content) {
        throw new Error('Please enter post content');
      }
      
      if (!scheduledDate || !scheduledTime) {
        throw new Error('Please select both date and time for scheduling');
      }
      
      const selectedPlatformsList = Object.keys(selectedPlatforms).filter(platform => selectedPlatforms[platform]);
      
      if (selectedPlatformsList.length === 0) {
        throw new Error('Please select at least one platform');
      }
      
      // Create a combined date-time string
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;
      
      // Ensure the scheduled time is in the future
      const scheduledTimestamp = new Date(scheduledDateTime).getTime();
      const now = new Date().getTime();
      
      if (scheduledTimestamp <= now) {
        throw new Error('Scheduled time must be in the future');
      }
      
      // Upload image if provided
      let imageUrl = null;
      let storagePath = null;
      
      if (imageFile) {
        const result = await uploadImageToSupabase(imageFile);
        imageUrl = result.publicUrl;
        storagePath = result.storagePath;
      }
      
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to schedule posts');
      }
      
      // Schedule the post
      const response = await fetch(`${API_URL}/social/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          postId: null, // For new posts
          title,
          content,
          imagePrompt,
          imageUrl,
          storagePath,
          scheduledDate,
          scheduledTime,
          platforms: selectedPlatformsList
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to schedule post');
      }
      
      const data = await response.json();
      
      // Show success message
      setShowSuccess(true);
      
      // Notify parent component if needed
      if (onPostScheduled) {
        onPostScheduled(data.scheduledPost);
      }
      
      // Reset form after successful submission
      setTitle('');
      setContent('');
      setImagePrompt('');
      setImageFile(null);
      setImagePreview(null);
      setScheduledDate('');
      setScheduledTime('');
      setAiAssistMode(false);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Error scheduling post:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Copy content to clipboard
  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    alert('Post content copied to clipboard!');
  };
  
  return (
    <div className="bg-[#23262F] p-6 rounded-xl border border-[#23262F]/60 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Calendar className="text-pastel-blue mr-2" size={24} />
          Social Media Post Creator
        </h2>
        <p className="text-white/70">
          Create and schedule posts for your social media platforms
        </p>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-400 flex items-start gap-2">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {/* Main Form or AI Results */}
      <AnimatePresence mode="wait">
        {aiAssistMode ? (
          <motion.div
            key="ai-results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">AI Generated Post Ideas</h3>
              <button 
                onClick={() => setAiAssistMode(false)}
                className="px-3 py-1.5 text-sm bg-[#181A20] hover:bg-[#181A20]/70 rounded-lg"
              >
                Back to Editor
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              {generatedPosts.length > 0 ? (
                generatedPosts.map((post, index) => (
                  <motion.div 
                    key={post.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-[#181A20] border border-[#181A20]/80 rounded-lg p-4"
                  >
                    <h4 className="font-medium mb-2 text-white">{post.title}</h4>
                    <p className="text-white/80 text-sm mb-4">{post.content}</p>
                    
                    {post.imagePrompt && (
                      <div className="p-3 bg-[#23262F]/60 rounded-lg mb-4">
                        <div className="flex items-center text-xs font-medium text-white/70 mb-1">
                          <span>Image Prompt:</span>
                        </div>
                        <p className="text-sm italic text-white/80">{post.imagePrompt}</p>
                      </div>
                    )}
                    
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
                        onClick={() => applyGeneratedPost(post)}
                        className="px-3 py-1.5 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg text-sm flex items-center"
                      >
                        <Check size={14} className="mr-1" />
                        <span>Use This</span>
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-white/70">No post ideas were generated. Please try again.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="px-4 py-2 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-[#181A20]/20 border-t-[#181A20] rounded-full mr-2"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    <span>Generate More Ideas</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.form
            key="post-form"
            onSubmit={handleSchedulePost}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Post Title */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">Post Title (optional)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Sale Announcement"
                className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
              />
            </div>
            
            {/* Post Content */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">Post Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your post content here..."
                rows={5}
                className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none resize-none"
              />
            </div>
            
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Image (optional)
              </label>
              <div className="flex items-center gap-3">
                <motion.label
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-1 cursor-pointer px-3 py-1.5 rounded-lg bg-[#181A20] hover:bg-[#181A20]/70 border border-[#181A20] text-white"
                >
                  <UploadCloud size={16} className="text-pastel-blue" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </motion.label>
                
                {imageFile && (
                  <div className="flex items-center gap-2">
                    <Image size={18} className="text-pastel-blue" />
                    <span className="text-sm text-white/80 truncate max-w-[150px]">{imageFile.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              {imagePreview && (
                <div className="mt-2 relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-40 rounded-lg object-contain"
                  />
                </div>
              )}
            </div>
            
            {/* Image Prompt */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Image Prompt (optional)
              </label>
              <input
                type="text"
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe the image you want to generate..."
                className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
              />
              <p className="text-xs text-white/60 mt-1">
                This will be used to generate an image if you don't upload one
              </p>
            </div>
            
            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Product Name (for AI generation)
              </label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g., Eco-friendly Water Bottle"
                className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
              />
              <p className="text-xs text-white/60 mt-1">
                This will replace [product] placeholders in AI-generated content
              </p>
            </div>
            
            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Platforms
              </label>
              <div className="flex flex-wrap gap-3">
                {PLATFORMS.map(platform => (
                  <motion.button
                    key={platform.id}
                    type="button"
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
                    <span style={{ color: selectedPlatforms[platform.id] ? platform.color : undefined }}>
                      {platform.name}
                    </span>
                    {selectedPlatforms[platform.id] && (
                      <Check size={16} style={{ color: platform.color }} />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
            
            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white/80">
                Schedule
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white"
                />
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white"
                />
              </div>
            </div>
            
            {/* AI Assistant */}
            <div className="pt-6 border-t border-[#181A20]">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold flex items-center">
                  <Sparkles className="h-5 w-5 text-pastel-blue mr-2" />
                  Need inspiration?
                </h3>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setShowThemeSelector(!showThemeSelector)}
                  className="text-sm text-pastel-blue hover:underline"
                >
                  {showThemeSelector ? 'Hide themes' : 'Show themes'}
                </motion.button>
              </div>
              
              {/* Theme Selector */}
              <AnimatePresence>
                {showThemeSelector && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Choose a theme for AI generation
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                        {THEMES.map(theme => (
                          <motion.button
                            key={theme.id}
                            type="button"
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
                      
                      <div>
                        <label className="block text-sm font-medium mb-2 text-white/80">
                          Or enter a custom theme:
                        </label>
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
                  </motion.div>
                )}
              </AnimatePresence>
              
              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGenerateWithAI}
                disabled={isGenerating}
                className="w-full py-3 bg-[#181A20] hover:bg-[#181A20]/70 text-white rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full mr-2"></div>
                    <span>Generating Ideas...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="mr-2" />
                    <span>Generate Post Ideas</span>
                  </>
                )}
              </motion.button>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isSubmitting}
                className="w-full py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-[#181A20]/20 border-t-[#181A20] rounded-full mr-2"></div>
                    <span>Scheduling...</span>
                  </>
                ) : (
                  <>
                    <Calendar size={18} className="mr-2" />
                    <span>Schedule Post</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.form>
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
    </div>
  );
};

export default SocialPostForm;