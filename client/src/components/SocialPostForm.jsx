import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, UploadCloud, Image, Check, Calendar, Copy, Clock, X, AlertCircle,
  Store, User, BookOpen, Zap, ChevronDown, ChevronRight, Send, Info, Edit, ChevronLeft
} from 'lucide-react';
// Import Supabase for authentication and API integration
import supabase from '../lib/supabase';
import { API_URL } from '../config';

// Redesigned category-based post types and themes
const POST_TYPES = [
  { 
    id: 'business', 
    name: 'Business', 
    icon: <Store size={20} />,
    description: 'Content for marketing, promotions and business announcements',
    themes: [
      { id: 'product_promotion', name: 'Product Promotion', emoji: '✨' },
      { id: 'sale_announcement', name: 'Sale Announcement', emoji: '🏷️' },
      { id: 'holiday_special', name: 'Holiday Special', emoji: '🎄' },
      { id: 'limited_time_offer', name: 'Limited Time Offer', emoji: '⏱️' }
    ]
  },
  { 
    id: 'personal', 
    name: 'Personal', 
    icon: <User size={20} />,
    description: 'Content for personal branding and lifestyle sharing',
    themes: [
      { id: 'lifestyle_update', name: 'Lifestyle Update', emoji: '🌟' },
      { id: 'travel_memory', name: 'Travel Memory', emoji: '✈️' },
      { id: 'celebration', name: 'Celebration', emoji: '🎉' },
      { id: 'personal_milestone', name: 'Personal Milestone', emoji: '🏆' }
    ]
  },
  { 
    id: 'educational', 
    name: 'Educational', 
    icon: <BookOpen size={20} />,
    description: 'Content for sharing knowledge and expertise',
    themes: [
      { id: 'tips_and_tricks', name: 'Tips & Tricks', emoji: '💡' },
      { id: 'tutorial', name: 'Tutorial', emoji: '📝' },
      { id: 'industry_insight', name: 'Industry Insight', emoji: '📊' },
      { id: 'expert_advice', name: 'Expert Advice', emoji: '🧠' }
    ]
  }
];

// Social platforms
const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'twitter', name: 'Twitter', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' }
];

/**
 * Enhanced Social Post Form Component
 * Redesigned with a guided, AI-first approach
 */
const EnhancedSocialPostCreator = ({ onPostScheduled }) => {
  // Step tracking for the guided flow
  const [currentStep, setCurrentStep] = useState('post-type'); // post-type -> theme -> creation
  
  // Post type and theme selection
  const [selectedPostType, setSelectedPostType] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  
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
    facebook: false,
    twitter: false,
    linkedin: false
  });

  // AI generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [aiMode, setAiMode] = useState(true); // Default to AI mode

  // UI state
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Get tomorrow's date and default time for scheduling
  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setScheduledTime('12:00');
  }, []);

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

  // Select a post type and move to theme selection
  const handlePostTypeSelect = (type) => {
    setSelectedPostType(type);
    setCurrentStep('theme');
    
    // Reset theme selection when changing post type
    setSelectedTheme('');
    setCustomTheme('');
  };

  // Handle theme select and continue to creation step
  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    setCurrentStep('creation');
    
    // Add default theme description based on the selected theme
    // This helps users understand what to write about
    if (!customTheme) {
      const themeObj = selectedPostType.themes.find(t => t.id === themeId);
      if (themeObj) {
        const themeDescriptions = {
          // Business theme descriptions
          'product_promotion': 'Showcasing our product features and benefits',
          'sale_announcement': 'Limited time discount or special offer',
          'holiday_special': 'Seasonal promotion tied to an upcoming holiday',
          'limited_time_offer': 'Exclusive deal available for a short period',
          
          // Personal theme descriptions
          'lifestyle_update': 'Sharing my personal experience or daily routine',
          'travel_memory': 'A journey or travel experience I want to share',
          'celebration': 'A special occasion or achievement',
          'personal_milestone': 'An important moment or accomplishment',
          
          // Educational theme descriptions
          'tips_and_tricks': 'Helpful advice or hacks related to my expertise',
          'tutorial': 'Step-by-step instructions to accomplish a task',
          'industry_insight': 'Expert observations about trends in my field',
          'expert_advice': 'Professional recommendations from my experience'
        };
        
        setCustomTheme(themeDescriptions[themeId] || '');
      }
    }
    
    // Auto-focus on product name if business post type or custom theme if educational/personal
    if (selectedPostType.id === 'business') {
      setTimeout(() => {
        const productInput = document.getElementById('product-name-input');
        if (productInput) productInput.focus();
      }, 300);
    } else {
      setTimeout(() => {
        const themeInput = document.getElementById('custom-theme-input');
        if (themeInput) themeInput.focus();
      }, 300);
    }
  };

  // Use AI to generate post ideas
  const handleGenerateWithAI = async () => {
    setError(null);
    setIsGenerating(true);
    
    try {
      const themeText = customTheme || selectedTheme;
      const postTypeLabel = selectedPostType ? selectedPostType.name : 'General';
      
      if (!selectedPostType) {
        throw new Error('Please select a post type');
      }
      
      if (!themeText && !selectedTheme) {
        throw new Error('Please select a theme or describe what your post should be about');
      }
      
      const selectedPlatformsList = Object.keys(selectedPlatforms).filter(platform => selectedPlatforms[platform]);
      
      if (selectedPlatformsList.length === 0) {
        throw new Error('Please select at least one platform');
      }
      
      // Get auth session from Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to generate posts');
      }
      
      // Build a more specific prompt based on the product name and theme
      const themeObj = selectedPostType.themes.find(t => t.id === selectedTheme);
      const themeName = themeObj ? themeObj.name : customTheme || selectedTheme;
      
      // Add specific product context to ensure the generated content is relevant
      // Detect product type to give more specific guidance
      let productType = '';
      if (productName) {
        if (productName.toLowerCase().includes('coffee') || productName.toLowerCase().includes('bean')) {
          productType = 'coffee';
        } else if (productName.toLowerCase().includes('tea')) {
          productType = 'tea';
        } else if (productName.toLowerCase().includes('food') || productName.toLowerCase().includes('snack') || 
                   productName.toLowerCase().includes('cookie') || productName.toLowerCase().includes('cake')) {
          productType = 'food';
        }
      }
      
      // Customize additional context based on product type and user's custom theme
      let additionalContext = ''; 
      
      // Add the user's specific post content request if provided
      if (customTheme) {
        additionalContext += `The post should specifically be about: "${customTheme}". `;
      }
      
      // Add product context if available
      if (productName) {
        additionalContext += `The posts should prominently feature the product "${productName}". `;
      }
        
      if (productType === 'coffee') {
        additionalContext += ` These are coffee beans, so the content should mention coffee-related terms like brewing, aroma, flavor notes, roast, organic, fair trade, etc. The image prompts should specifically show coffee beans, coffee packaging, or brewed coffee in cups - NOT generic product images.`;
      } else if (productType === 'tea') {
        additionalContext += ` These are tea products, so the content should mention tea-related terms like brewing, steeping, flavor notes, varieties, organic, etc. The image prompts should specifically show tea leaves, tea packaging, or brewed tea in cups - NOT generic product images.`;
      } else if (productType === 'food') {
        additionalContext += ` This is a food product, so the content should mention food-related terms like flavor, ingredients, organic, natural, etc. The image prompts should specifically show the food product, its packaging, or the food being served/enjoyed - NOT generic product images.`;
      }
      
      // Call the API using the socialController endpoint
      const response = await fetch(`${API_URL}/social/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          theme: selectedTheme,
          customTheme,
          postType: selectedPostType.id,
          platforms: selectedPlatformsList,
          productName: productName || undefined,
          additionalContext: additionalContext,
          count: 3 // Generate 3 posts
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate posts');
      }
      
      const data = await response.json();
      
      if (data && data.posts && Array.isArray(data.posts)) {
        // Process the posts to ensure product name is included if not already
        const processedPosts = data.posts.map(post => {
          let processedContent = post.content;
          let processedImagePrompt = post.imagePrompt;
          let processedTitle = post.title;
          
          // If product name is provided but not in the content, add it to ensure relevance
          if (productName) {
            // Replace generic terms with the actual product name in content
            processedContent = processedContent
              .replace(/our product/gi, productName)
              .replace(/the product/gi, productName)
              .replace(/this product/gi, productName);
              
            // If the product name still isn't in the content, prepend it
            if (!processedContent.includes(productName)) {
              processedContent = `${productName} - ${processedContent}`;
            }
            
            // Fix image prompts to be product-specific
            if (productType === 'coffee') {
              // Check if the image prompt doesn't mention coffee-related terms
              if (!processedImagePrompt.toLowerCase().includes('coffee') &&
                  !processedImagePrompt.toLowerCase().includes('bean') &&
                  !processedImagePrompt.toLowerCase().includes('brew')) {
                  
                // Replace generic image descriptions with coffee-specific ones
                processedImagePrompt = `A beautifully packaged bag of ${productName} coffee beans with rich, dark roasted beans visible. The packaging highlights its organic nature, with coffee being brewed in the background and steam rising with visible coffee aroma.`;
              }
            }
            
            // Make sure title includes product name if needed
            if (!processedTitle.includes(productName)) {
              // If title is very generic, replace it
              if (processedTitle.includes('Option') || processedTitle.length < 15) {
                if (productType === 'coffee') {
                  const coffeeTitles = [
                    `Experience ${productName}`,
                    `Morning Magic: ${productName}`,
                    `Organic Excellence: ${productName}`,
                    `Brew Perfection with ${productName}`,
                    `${productName}: Ethically Sourced Delight`
                  ];
                  processedTitle = coffeeTitles[Math.floor(Math.random() * coffeeTitles.length)];
                } else {
                  processedTitle = `${productName} - ${processedTitle}`;
                }
              }
            }
          }
          
          return {
            ...post,
            title: processedTitle,
            content: processedContent,
            imagePrompt: processedImagePrompt,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: new Date().toISOString()
          };
        });
        
        setGeneratedPosts(processedPosts);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error generating posts:', err);
      setError(err.message);
      
      // If API fails, use mock data for development as fallback
      if (selectedPostType) {
        const selectedThemeObj = selectedPostType.themes.find(t => t.id === selectedTheme);
        const themeName = selectedThemeObj ? selectedThemeObj.name : customTheme || 'Custom Theme';
        
        // Make sure to include the actual product name in the mock data
        const productPlaceholder = productName || '[your product]';
        
        let mockPosts = [];
        
        if (selectedPostType.id === 'business') {
          mockPosts = [
            {
              id: 'gen1',
              title: `Morning Magic: ${productPlaceholder}`,
              content: `✨ NEW ARRIVAL! Introducing our freshly roasted ${productPlaceholder} - ethically sourced and carefully roasted for a perfect morning brew! Rich flavor notes of chocolate and berries in every cup. #OrganicCoffee #MorningRitual #EthicallySourced`,
              imagePrompt: `Professional product photography of ${productPlaceholder} package with coffee beans spilling out onto a wooden surface, morning light streaming in, steam rising from a freshly brewed cup of coffee nearby`,
              bestTime: 'Tuesday at 8:00 AM'
            },
            {
              id: 'gen2',
              title: `Taste the Difference: ${productPlaceholder}`,
              content: `Elevate your coffee experience with our organic ${productPlaceholder}! Our small-batch roasting process preserves the complex flavor profile that coffee lovers crave. Fair trade certified ✅ Organic ✅ Delicious ✅ #SpecialtyCoffee #OrganicLiving`,
              imagePrompt: `Close-up of ${productPlaceholder} coffee being brewed in a pour-over setup, rich coffee dripping into a clear glass carafe, coffee beans scattered around the scene, warm morning lighting highlighting the deep color of the coffee`,
              bestTime: 'Thursday at 5:30 PM'
            },
            {
              id: 'gen3',
              title: `Limited Harvest: ${productPlaceholder}`,
              content: `The wait is finally over! 🎉 Our seasonal ${productPlaceholder} has arrived and it's everything coffee connoisseurs have been waiting for. This limited harvest won't last long! Use code FRESHBEANS for 10% off your first order. #LimitedEdition #SpecialtyCoffee`,
              imagePrompt: `Artful arrangement of ${productPlaceholder} packaging with coffee beans visible, steam rising from freshly brewed coffee in a stylish mug, a coffee plant leaf accent, and soft natural lighting highlighting the rich color of the beans`,
              bestTime: 'Wednesday at 2:00 PM'
            }
          ];
        } else if (selectedPostType.id === 'personal') {
          // Adjust the personal posts to include product if business product was provided
          mockPosts = [
            {
              id: 'gen1',
              title: `My Morning Ritual with ${productPlaceholder}`,
              content: `Taking a moment to appreciate life's simple pleasures with a cup of ${productPlaceholder}. The rich aroma fills my kitchen as I brew this organic goodness. Every sip brings notes of caramel and dark chocolate. What's your morning ritual? #SlowLiving #CoffeeRitual #OrganicLiving`,
              imagePrompt: `Person enjoying a peaceful morning moment with a freshly brewed cup of ${productPlaceholder} coffee by a window, steam rising from the cup, coffee beans and coffee bag visible on a rustic wooden table, golden morning light filtering in`,
              bestTime: 'Sunday at 10:00 AM'
            },
            {
              id: 'gen2',
              title: `Weekend Vibes & ${productPlaceholder}`,
              content: `The perfect weekend companion: a freshly brewed cup of ${productPlaceholder} and a good book. These organic beans make every slow morning special with their complex flavor profile. What are you sipping on this weekend? #WeekendVibes #CoffeeAndBooks #OrganicCoffee`,
              imagePrompt: `Cozy scene with a steaming cup of ${productPlaceholder} coffee, the branded coffee bag visible, open book beside it, comfortable reading nook with blanket, warm filtered lighting creating a comfortable atmosphere`,
              bestTime: 'Saturday at 9:00 AM'
            },
            {
              id: 'gen3',
              title: `Coffee Journey: ${productPlaceholder}`,
              content: `Just discovered ${productPlaceholder} and it's changed my coffee experience completely! As someone who appreciates ethically sourced products, I love that these beans support fair wages for farmers while delivering exceptional flavor. #CoffeeDiscovery #EthicalCoffee #SupportSmallFarms`,
              imagePrompt: `Person preparing ${productPlaceholder} coffee using a French press or pour-over method, focus on the brewing process, coffee beans and packaging visible, bright kitchen setting with plants, emphasizing the organic, natural aspects`,
              bestTime: 'Monday at 8:00 AM'
            }
          ];
        } else if (selectedPostType.id === 'educational') {
          // Adjust educational posts to include product if provided
          mockPosts = [
            {
              id: 'gen1',
              title: `The Organic Advantage: ${productPlaceholder}`,
              content: `Did you know? ${productPlaceholder} is grown without synthetic pesticides or fertilizers, supporting healthier soil and ecosystems. This sustainable approach creates a richer, more complex flavor profile in every cup while protecting our planet! #OrganicCoffee #SustainableFarming #CoffeeEducation`,
              imagePrompt: `Educational infographic about organic coffee farming practices used for ${productPlaceholder}, showing comparison between organic and conventional methods, coffee plant growth stages, and final packaged product, presented in a clean, informative layout`,
              bestTime: 'Tuesday at 9:00 AM'
            },
            {
              id: 'gen2',
              title: `3 Ways to Brew ${productPlaceholder}`,
              content: `Perfect Brewing Methods for ${productPlaceholder}:\n1. Pour Over - for bright, clean flavors\n2. French Press - for rich, full-bodied taste\n3. Cold Brew - for smooth, low-acidity finish\nEach method highlights different flavor notes in our organic beans. Which brewing method do you prefer? #BrewingTips #CoffeeLover #OrganicCoffee`,
              imagePrompt: `Clean, educational graphic showing three different brewing methods (pour-over, French press, and cold brew) for ${productPlaceholder} coffee with the beans and packaging visible in each setup, clearly labeled with brewing times and techniques`,
              bestTime: 'Wednesday at 1:00 PM'
            },
            {
              id: 'gen3',
              title: `Bean to Cup: The Journey of ${productPlaceholder}`,
              content: `${productPlaceholder} begins its journey on small, family-owned farms in the highlands of Ethiopia, where ideal growing conditions create exceptional flavor notes of blueberry, chocolate, and citrus. Our direct trade partnerships ensure farmers receive fair wages! #CoffeeOrigins #BeanToCup #EthicalCoffee`,
              imagePrompt: `Visual story of ${productPlaceholder} journey from Ethiopian coffee farms to consumer, showing farmers harvesting coffee cherries, processing, roasting stages, and final packaged product, with a map highlighting the coffee's origin region`,
              bestTime: 'Thursday at 11:00 AM'
            }
          ];
        }
        
        // Process the posts and add IDs, creation date
        const processedPosts = mockPosts.map(post => ({
          ...post,
          id: `gen-${Math.random().toString(36).substring(2, 15)}`,
          createdAt: new Date().toISOString()
        }));
        
        setGeneratedPosts(processedPosts);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Use a generated post and switch to manual edit mode to complete scheduling
  const applyGeneratedPost = (post) => {
    setTitle(post.title || '');
    setContent(post.content || '');
    setImagePrompt(post.imagePrompt || '');
    
    // If there's a best time recommendation, parse and set it
    if (post.bestTime) {
      try {
        const timeMatch = post.bestTime.match(/(\d+):(\d+)/);
        if (timeMatch) {
          setScheduledTime(`${timeMatch[1].padStart(2, '0')}:${timeMatch[2].padStart(2, '0')}`);
        }
      } catch (e) {
        console.log("Could not parse recommended time", e);
      }
    }
    
    // Switch to edit mode for scheduling
    setAiMode(false);
    
    // Auto scroll to content area
    setTimeout(() => {
      const contentArea = document.getElementById('post-content-area');
      if (contentArea) contentArea.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
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
      
      // Get authentication session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('You must be logged in to schedule posts');
      }
      
      // Upload image if provided
      let imageUrl = null;
      let storagePath = null;
      
      if (imageFile) {
        try {
          const formData = new FormData();
          formData.append('image', imageFile);
          
          const uploadResponse = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`
            },
            body: formData
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.message || 'Failed to upload image');
          }
          
          const uploadData = await uploadResponse.json();
          imageUrl = uploadData.url;
          storagePath = uploadData.filepath;
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr);
          // Continue without image if upload fails
        }
      }
      
      // Call the API to schedule the post
      const response = await fetch(`${API_URL}/social/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          content,
          imagePrompt,
          imageUrl,
          storagePath,
          scheduledDate,
          scheduledTime,
          postType: selectedPostType?.id || 'general',
          theme: selectedTheme || customTheme,
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
        onPostScheduled(data.scheduledPost || {
          id: Math.random().toString(36).substring(2, 15),
          title,
          content,
          imagePrompt,
          imageUrl: imagePreview,
          scheduledDate: new Date(scheduledDateTime),
          status: 'scheduled',
          platforms: selectedPlatformsList,
          created_at: new Date().toISOString(),
          scheduled_at: scheduledDateTime
        });
      }
      
      // Reset form after successful submission
      setTimeout(() => {
        setTitle('');
        setContent('');
        setImagePrompt('');
        setImageFile(null);
        setImagePreview(null);
        setCurrentStep('post-type');
        setSelectedPostType(null);
        setSelectedTheme('');
        setCustomTheme('');
        
        // Hide success message after delay
        setTimeout(() => {
          setShowSuccess(false);
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error('Error scheduling post:', err);
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Go back to previous step
  const handleGoBack = () => {
    if (currentStep === 'theme') {
      setCurrentStep('post-type');
      setSelectedPostType(null);
    } else if (currentStep === 'creation') {
      setCurrentStep('theme');
      setSelectedTheme('');
      setCustomTheme('');
      setGeneratedPosts([]);
    }
  };
  
  // Start over from scratch
  const handleStartOver = () => {
    setCurrentStep('post-type');
    setSelectedPostType(null);
    setSelectedTheme('');
    setCustomTheme('');
    setTitle('');
    setContent('');
    setImagePrompt('');
    setProductName('');
    setImageFile(null);
    setImagePreview(null);
    setGeneratedPosts([]);
  };
  
  // Copy content to clipboard
  const handleCopyContent = (content) => {
    navigator.clipboard.writeText(content);
    
    // Show temporary success message
    const copySuccess = document.createElement('div');
    copySuccess.className = 'fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
    copySuccess.innerHTML = 'Content copied to clipboard!';
    document.body.appendChild(copySuccess);
    
    setTimeout(() => {
      copySuccess.remove();
    }, 2000);
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
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-400 flex items-start gap-2"
          >
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Post Type Selection (Step 1) */}
      <AnimatePresence mode="wait">
        {currentStep === 'post-type' && (
          <motion.div
            key="post-type"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2 text-sm text-pastel-blue">1</span>
              Select Post Type
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {POST_TYPES.map(type => (
                <motion.div
                  key={type.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePostTypeSelect(type)}
                  className="p-4 bg-[#181A20] border border-[#181A20] rounded-lg cursor-pointer hover:border-pastel-blue/50 transition-all"
                >
                  <div className="flex items-center mb-2">
                    <div className="w-10 h-10 rounded-lg bg-pastel-blue/10 flex items-center justify-center mr-3">
                      {type.icon}
                    </div>
                    <h4 className="font-semibold text-white">{type.name}</h4>
                  </div>
                  <p className="text-sm text-white/70">{type.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Theme Selection (Step 2) */}
        {currentStep === 'theme' && selectedPostType && (
          <motion.div
            key="theme"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-6"
          >
            <div className="flex items-center mb-4">
              <button 
                onClick={handleGoBack}
                className="mr-2 p-1 rounded hover:bg-[#181A20]"
              >
                <ChevronLeft size={20} className="text-pastel-blue" />
              </button>
              <h3 className="text-lg font-semibold flex items-center">
                <span className="w-6 h-6 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2 text-sm text-pastel-blue">2</span>
                Select a Theme for your {selectedPostType.name} Post
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {selectedPostType.themes.map(theme => (
                <motion.button
                  key={theme.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleThemeSelect(theme.id)}
                  className="p-3 rounded-lg flex items-center border bg-[#181A20] border-[#181A20] hover:border-pastel-blue/50 text-white hover:text-white transition-all text-left"
                >
                  <span className="text-xl mr-2">{theme.emoji}</span>
                  <span className="font-medium">{theme.name}</span>
                </motion.button>
              ))}
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2 text-white/80">
                Or enter a custom theme:
              </label>
              <div className="flex items-center">
                <input
                  type="text"
                  value={customTheme}
                  onChange={(e) => setCustomTheme(e.target.value)}
                  placeholder={`e.g., ${selectedPostType.id === 'business' ? 'Summer Collection Launch' : 
                              selectedPostType.id === 'personal' ? 'Travel Journey' : 'Industry Trends'}`}
                  className="flex-1 p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
                />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (customTheme.trim()) {
                      setCurrentStep('creation');
                    } else {
                      setError('Please enter a custom theme');
                    }
                  }}
                  className="ml-2 px-4 py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
        
        {/* Post Creation (Step 3) */}
        {currentStep === 'creation' && (
          <motion.div
            key="creation"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <button 
                  onClick={handleGoBack}
                  className="mr-2 p-1 rounded hover:bg-[#181A20]"
                >
                  <ChevronLeft size={20} className="text-pastel-blue" />
                </button>
                <h3 className="text-lg font-semibold flex items-center">
                  <span className="w-6 h-6 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2 text-sm text-pastel-blue">3</span>
                  Create Your {selectedPostType.name} Post
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={handleStartOver}
                  className="text-sm text-white/70 hover:text-white"
                >
                  Start Over
                </button>
                
                <div className="flex items-center gap-2 bg-[#181A20] p-1 rounded-full">
                  <button
                    onClick={() => setAiMode(true)}
                    className={`px-3 py-1 rounded-full text-sm ${aiMode ? 'bg-pastel-blue text-[#181A20] font-medium' : 'text-white/70'}`}
                  >
                    <div className="flex items-center">
                      <Sparkles size={14} className="mr-1" />
                      <span>AI Mode</span>
                    </div>
                  </button>
                  <button
                    onClick={() => setAiMode(false)}
                    className={`px-3 py-1 rounded-full text-sm ${!aiMode ? 'bg-pastel-blue text-[#181A20] font-medium' : 'text-white/70'}`}
                  >
                    <div className="flex items-center">
                      <Edit size={14} className="mr-1" />
                      <span>Manual</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {aiMode ? (
                <motion.div
                  key="ai-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6"
                >
                                      {/* AI Generation Mode */}
                  <div className="bg-[#181A20] p-4 rounded-lg border border-[#181A20] mb-4">
                    <div className="flex items-start mb-4">
                      <Sparkles size={20} className="text-pastel-blue mr-2 mt-1" />
                      <div>
                        <h4 className="font-medium text-white">Let AI create content for you</h4>
                        <p className="text-sm text-white/70">We'll generate post ideas based on your selections</p>
                      </div>
                    </div>
                    
                    {/* Post Details Input - NEW SECTION */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        What should this post be about?
                      </label>
                      <textarea
                        id="custom-theme-input"
                        value={customTheme}
                        onChange={(e) => setCustomTheme(e.target.value)}
                        placeholder={selectedPostType?.id === 'business' 
                          ? "Describe what you want to promote, e.g. 'Our new coffee beans with hints of chocolate and caramel'" 
                          : selectedPostType?.id === 'personal'
                            ? "Describe your experience, e.g. 'My morning coffee ritual and how it improves my day'"
                            : "Describe what you want to teach, e.g. 'The benefits of different brewing methods for coffee'"}
                        rows={3}
                        className="w-full p-3 rounded-lg border border-[#232731] bg-[#232731] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none resize-none"
                      />
                      <p className="text-xs text-white/60 mt-1">
                        Be specific about what you want your post to focus on
                      </p>
                    </div>
                    
                    {/* Product Name Input (Business only) */}
                    {selectedPostType && selectedPostType.id === 'business' && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-white/80">
                          What product are you promoting?
                        </label>
                        <input
                          id="product-name-input"
                          type="text"
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g., Organic Coffee Beans, Smart Watch, Yoga Mat"
                          className="w-full p-3 rounded-lg border border-[#232731] bg-[#232731] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
                        />
                      </div>
                    )}
                    
                    {/* Platform Selection */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2 text-white/80">
                        Which platforms are you posting to?
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map(platform => (
                          <motion.button
                            key={platform.id}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => togglePlatform(platform.id)}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                              selectedPlatforms[platform.id]
                                ? 'bg-[#232731] border border-pastel-blue/50 text-white'
                                : 'bg-[#232731] border border-[#232731] text-white/70'
                            }`}
                            style={selectedPlatforms[platform.id] ? { borderColor: platform.color } : {}}
                          >
                            <span style={{ color: selectedPlatforms[platform.id] ? platform.color : undefined }}>
                              {platform.name}
                            </span>
                            {selectedPlatforms[platform.id] && (
                              <Check size={14} style={{ color: platform.color }} />
                            )}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGenerateWithAI}
                      disabled={isGenerating}
                      className="w-full py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin h-5 w-5 border-2 border-[#181A20]/20 border-t-[#181A20] rounded-full mr-2"></div>
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
                  
                  {/* Generated Posts Results Section */}
                  {generatedPosts.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium text-white flex items-center mb-2">
                        <Zap className="text-pastel-blue h-4 w-4 mr-2" />
                        AI-Generated Post Ideas
                      </h4>
                      
                      {generatedPosts.map((post, index) => (
                        <motion.div 
                          key={post.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="bg-[#232731] border border-[#232731] rounded-lg p-4"
                        >
                          <h4 className="font-medium mb-2 text-white">{post.title}</h4>
                          <p className="text-white/80 text-sm mb-4 whitespace-pre-line">{post.content}</p>
                          
                          {post.imagePrompt && (
                            <div className="p-3 bg-[#181A20] rounded-lg mb-4">
                              <div className="flex items-center text-xs font-medium text-white/70 mb-1">
                                <Image size={12} className="mr-1" />
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
                              className="px-3 py-1.5 border border-[#181A20] rounded-lg text-sm flex items-center hover:bg-[#181A20]/50"
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
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="manual-mode"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {/* Manual Creation Mode */}
                  <form onSubmit={handleSchedulePost} className="space-y-4">
                    {/* Post Title */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">Post Title (optional)</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder={selectedPostType?.id === 'business' 
                          ? "e.g., Summer Sale Announcement" 
                          : selectedPostType?.id === 'personal'
                            ? "e.g., My Travel Adventure"
                            : "e.g., 5 Tips for Better Productivity"}
                        className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none"
                      />
                    </div>
                    
                    {/* Post Content */}
                    <div>
                      <label className="block text-sm font-medium mb-2 text-white/80">Post Content</label>
                      <textarea
                        id="post-content-area"
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
                        <div className="mt-2 relative max-w-xs">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-40 rounded-lg object-contain bg-[#181A20] p-2"
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
                    
                    {/* Toggle for Advanced Options */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                        className="flex items-center text-white/70 hover:text-white text-sm"
                      >
                        {showAdvancedOptions ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />}
                        <span>{showAdvancedOptions ? 'Hide Advanced Options' : 'Show Advanced Options'}</span>
                      </button>
                    </div>
                    
                    {/* Advanced Options (Collapsible) */}
                    <AnimatePresence>
                      {showAdvancedOptions && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          {/* Platform Selection */}
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-white/80">
                              Platforms
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {PLATFORMS.map(platform => (
                                <motion.button
                                  key={platform.id}
                                  type="button"
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => togglePlatform(platform.id)}
                                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                    selectedPlatforms[platform.id]
                                      ? 'bg-[#181A20] border border-pastel-blue/50 text-white'
                                      : 'bg-[#181A20] border border-[#181A20] text-white/70'
                                  }`}
                                  style={selectedPlatforms[platform.id] ? { borderColor: platform.color } : {}}
                                >
                                  <span style={{ color: selectedPlatforms[platform.id] ? platform.color : undefined }}>
                                    {platform.name}
                                  </span>
                                  {selectedPlatforms[platform.id] && (
                                    <Check size={14} style={{ color: platform.color }} />
                                  )}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Schedule Section */}
                    <div className="pt-4 border-t border-[#181A20]">
                      <h4 className="font-semibold text-white mb-3 flex items-center">
                        <Calendar size={16} className="mr-2 text-pastel-blue" />
                        Schedule Post
                      </h4>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
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
                      </div>
                      
                      {/* Submit Button */}
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
                            <Send size={18} className="mr-2" />
                            <span>Schedule Post</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
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
      
      {/* Help Tooltip */}
      <div className="fixed bottom-4 left-4 z-50">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-[#181A20] p-2 rounded-full shadow-lg border border-pastel-blue/30 cursor-pointer group relative"
        >
          <Info size={20} className="text-pastel-blue" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-64 bg-[#181A20] p-3 rounded-lg border border-pastel-blue/20 shadow-xl pointer-events-none"
          >
            <h5 className="font-medium text-white mb-1">Quick Tips</h5>
            <ul className="text-xs text-white/70 space-y-1 list-disc pl-4">
              <li>Select a post type to get started</li>
              <li>AI Mode will generate ideas for you</li>
              <li>Upload images or use AI image prompts</li>
              <li>Schedule your posts for optimal engagement</li>
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default EnhancedSocialPostCreator;