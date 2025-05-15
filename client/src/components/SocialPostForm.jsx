import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, UploadCloud, Image, Check, Calendar, Copy, Clock, X, AlertCircle,
  Store, User, BookOpen, Zap, ChevronDown, ChevronRight, Send, Info, Edit, ChevronLeft
} from 'lucide-react';
import supabase from '../lib/supabase';
import { API_URL } from '../config';

const POST_TYPES = [
  { id: 'business', name: 'Business', icon: <Store size={20} />, description: 'Content for marketing, promotions and business announcements', themes: [ { id: 'product_promotion', name: 'Product Promotion', emoji: '✨' }, { id: 'sale_announcement', name: 'Sale Announcement', emoji: '🏷️' }, { id: 'holiday_special', name: 'Holiday Special', emoji: '🎄' }, { id: 'limited_time_offer', name: 'Limited Time Offer', emoji: '⏱️' } ] },
  { id: 'personal', name: 'Personal', icon: <User size={20} />, description: 'Content for personal branding and lifestyle sharing', themes: [ { id: 'lifestyle_update', name: 'Lifestyle Update', emoji: '🌟' }, { id: 'travel_memory', name: 'Travel Memory', emoji: '✈️' }, { id: 'celebration', name: 'Celebration', emoji: '🎉' }, { id: 'personal_milestone', name: 'Personal Milestone', emoji: '🏆' } ] },
  { id: 'educational', name: 'Educational', icon: <BookOpen size={20} />, description: 'Content for sharing knowledge and expertise', themes: [ { id: 'tips_and_tricks', name: 'Tips & Tricks', emoji: '💡' }, { id: 'tutorial', name: 'Tutorial', emoji: '📝' }, { id: 'industry_insight', name: 'Industry Insight', emoji: '📊' }, { id: 'expert_advice', name: 'Expert Advice', emoji: '🧠' } ] }
];

const PLATFORMS = [
  { id: 'instagram', name: 'Instagram', color: '#E1306C' },
  { id: 'facebook', name: 'Facebook', color: '#1877F2' },
  { id: 'twitter', name: 'Twitter', color: '#1DA1F2' },
  { id: 'linkedin', name: 'LinkedIn', color: '#0A66C2' }
];

const THEME_DESCRIPTIONS = {
  product_promotion: 'Announce the key benefit of …',
  sale_announcement: 'Highlight urgency and % discount …',
  holiday_special: 'Create excitement for a festive offer ...',
  limited_time_offer: 'Emphasize scarcity for a special deal ...',
  lifestyle_update: 'Share a recent personal experience or insight ...',
  travel_memory: 'Recount a memorable travel story ...',
  celebration: 'Announce a joyful event or achievement ...',
  personal_milestone: 'Reflect on a significant personal landmark ...',
  tips_and_tricks: 'Offer actionable advice on ...',
  tutorial: 'Provide a step-by-step guide for ...',
  industry_insight: 'Share a key observation about current trends in ...',
  expert_advice: 'Give authoritative guidance on ...',
};

const fileToDataUri = (file) => new Promise((resolve, reject) => {
  if (!(file instanceof Blob)) {
    reject(new Error("Input is not a File or Blob."));
    return;
  }
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onabort = () => reject(new Error('File read aborted'));
  reader.onerror = (error) => reject(error);
  reader.readAsDataURL(file);
});

const SocialPostCreator = ({ onPostScheduled }) => {
  const [currentStep, setCurrentStep] = useState('post-type');
  const [selectedPostType, setSelectedPostType] = useState(null);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [customTheme, setCustomTheme] = useState('');
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imagePrompt, setImagePrompt] = useState('');
  const [productName, setProductName] = useState('');

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDraggingOverAI, setIsDraggingOverAI] = useState(false);
  const [isDraggingOverManual, setIsDraggingOverManual] = useState(false);

  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [selectedPlatforms, setSelectedPlatforms] = useState({ instagram: true, facebook: false, twitter: false, linkedin: false });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState([]);
  const [aiMode, setAiMode] = useState(true);

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setScheduledDate(tomorrow.toISOString().split('T')[0]);
    setScheduledTime('12:00');
  }, []);

  useEffect(() => {
    const currentPreview = imagePreview;
    return () => {
      if (currentPreview && currentPreview.startsWith('blob:')) {
        URL.revokeObjectURL(currentPreview);
      }
    };
  }, [imagePreview]);

  const clearImage = useCallback(() => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
  }, [imagePreview]);

  const processAndSetImage = useCallback(async (imageDataOrFile) => {
    setError(null);
    if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview); // Clean up previous blob URL
    }

    if (!imageDataOrFile) {
        setImageFile(null); setImagePreview(null); return;
    }

    let fileToProcess = null;
    let previewToSet = null;

    if (imageDataOrFile instanceof File) {
        fileToProcess = imageDataOrFile;
    } else if (typeof imageDataOrFile === 'string') {
        if (imageDataOrFile.startsWith('data:image') || imageDataOrFile.startsWith('http')) {
            previewToSet = imageDataOrFile;
        } else if (imageDataOrFile.startsWith('blob:')) {
            try {
                const response = await fetch(imageDataOrFile);
                if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
                const blob = await response.blob();
                fileToProcess = new File([blob], "dropped_blob_image." + (blob.type.split('/')[1] || 'png'), { type: blob.type });
            } catch (fetchErr) {
                console.error("Error processing blob URL string:", fetchErr);
                setError("Could not process the dropped image. Please try re-uploading the file.");
                clearImage(); return;
            }
        } else {
            setError("Invalid image data format.");
            clearImage(); return;
        }
    } else {
        setError("Unsupported item type for image.");
        clearImage(); return;
    }

    if (fileToProcess) {
        if (fileToProcess.size > 10 * 1024 * 1024) { // 10MB
            setError('Image file too large (max 10MB).'); clearImage(); return;
        }
        if (!fileToProcess.type.startsWith('image/')) {
            setError('Invalid file type (image required).'); clearImage(); return;
        }
        setImageFile(fileToProcess);
        setImagePreview(URL.createObjectURL(fileToProcess));
    } else if (previewToSet) {
        setImageFile(null);
        setImagePreview(previewToSet);
    } else {
        clearImage(); // Fallback if no valid image path determined
    }
  }, [imagePreview, clearImage]);


  const handleImageDrop = (e, type) => {
    e.preventDefault();
    type === 'ai' ? setIsDraggingOverAI(false) : setIsDraggingOverManual(false);
    const droppedItem = (e.dataTransfer.files && e.dataTransfer.files[0]) || e.dataTransfer.getData("text/plain");
    processAndSetImage(droppedItem);
  };

  const handleImageInputChange = (e) => {
    if (e.target.files && e.target.files[0]) processAndSetImage(e.target.files[0]);
    if (e.target) e.target.value = null;
  };

  const handlePostTypeSelect = (type) => { 
    setSelectedPostType(type); setCurrentStep('theme'); setSelectedTheme(''); setCustomTheme('');
  };

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId); setCurrentStep('creation');
    if (!customTheme && selectedPostType) {
      const themeObj = selectedPostType.themes.find(t => t.id === themeId);
      if (themeObj) setCustomTheme(THEME_DESCRIPTIONS[themeId] || '');
    }
    const focusTargetId = selectedPostType?.id === 'business' ? 'product-name-input' : 'custom-theme-input';
    setTimeout(() => document.getElementById(focusTargetId)?.focus(), 300);
  };

  const handleGenerateWithAI = async () => {
    setError(null); setIsGenerating(true); setGeneratedPosts([]);
    try {
      const themeText = customTheme || selectedTheme;
      if (!selectedPostType && !themeText && !imagePreview) {
        throw new Error('Please describe your post, select a theme/type, or add an image.');
      }
      
      const activePlatforms = Object.keys(selectedPlatforms).filter(p => selectedPlatforms[p]);
      if (activePlatforms.length === 0) throw new Error('Please select at least one platform.');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required.');
      
      let imageUrlForApi = null;
      if (imageFile) {
          imageUrlForApi = await fileToDataUri(imageFile);
      } else if (imagePreview) {
          if (imagePreview.startsWith('data:image') || imagePreview.startsWith('http')) {
              imageUrlForApi = imagePreview;
          } else if (imagePreview.startsWith('blob:')) {
              try {
                  const response = await fetch(imagePreview);
                  if (!response.ok) throw new Error(`Failed to fetch blob: ${response.statusText}`);
                  const blob = await response.blob();
                  imageUrlForApi = await fileToDataUri(blob);
              } catch (blobFetchErr) {
                  throw new Error("Could not process image preview for AI. Please re-upload.");
              }
          }
      }

      const payload = {
        theme: selectedTheme, customTheme, 
        postType: selectedPostType?.id || 'general', 
        platforms: activePlatforms,
        ...(productName && { productName }),
        count: 3,
        ...(imageUrlForApi && { imageUrl: imageUrlForApi }),
      };
      
      const response = await fetch(`${API_URL}/social/generate`, { 
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try { errorData = JSON.parse(errorText); } 
        catch(e) { errorData = { message: errorText || "Unknown server error."}; }
        throw new Error(errorData.message || `AI generation failed. Status: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.posts && Array.isArray(data.posts)) {
        setGeneratedPosts(data.posts.map(post => ({
          ...post, id: `ai_gen_${Math.random().toString(36).substring(2, 9)}`,
          sourceImageUrl: imageUrlForApi || null
        })));
      } else { throw new Error('Invalid response from AI server.'); }
    } catch (err) {
      setError(err.message);
    } finally { setIsGenerating(false); }
  };

  const applyGeneratedPost = (post) => {
    setTitle(post.title || ''); setContent(post.content || '');
    setImagePrompt(post.imagePrompt || ''); 
    
    if (post.sourceImageUrl) {
      // If imageFile is present and sourceImageUrl is a data URI (likely derived from imageFile),
      // we prefer to keep using the blob URL from imageFile for preview for performance.
      // Otherwise, use sourceImageUrl (which could be data URI from another source or an http URL).
      if (!(imageFile && post.sourceImageUrl.startsWith('data:image'))) {
        if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
        setImagePreview(post.sourceImageUrl);
        setImageFile(null); // Preview is now from AI source, not a local File object.
      }
      // If imageFile is set and sourceImageUrl IS a data URI, imagePreview should already be its blob URL. No action needed.
    }
    setAiMode(false); 
    setTimeout(() => document.getElementById('post-content-area')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  };

  const handleSchedulePost = async (e) => { 
    e.preventDefault(); setError(null); setIsSubmitting(true);
    try {
        if (!content.trim() && !title.trim()) throw new Error('Post content or title cannot be empty.');
        if (!scheduledDate || !scheduledTime) throw new Error('Please set a schedule date and time.');
        const activePlatforms = Object.keys(selectedPlatforms).filter(p => selectedPlatforms[p]);
        if (activePlatforms.length === 0) throw new Error('Please select at least one platform.');

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Authentication required.');

        let finalImageUrl = null; 
        let finalStoragePath = null;
        let imageToUpload = imageFile; 

        if (!imageToUpload && imagePreview && imagePreview.startsWith('data:image')) {
            try {
                const res = await fetch(imagePreview); 
                const blob = await res.blob();
                imageToUpload = new File([blob], `pasted_image.${blob.type.split('/')[1] || 'png'}`, { type: blob.type });
            } catch (convertError) {
                console.warn("Error converting data URI preview to file for schedule:", convertError);
            }
        }
        
        if (imageToUpload) {
            const formData = new FormData(); 
            formData.append('image', imageToUpload);
            const uploadResponse = await fetch(`${API_URL}/upload/social-post`, {
                method: 'POST', 
                headers: { 'Authorization': `Bearer ${session.access_token}` }, 
                body: formData 
            });
            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || errorData.message || 'Failed to upload image.');
            }
            const uploadData = await uploadResponse.json(); 
            finalImageUrl = uploadData.url; 
            finalStoragePath = uploadData.filepath; 
        } else if (imagePreview && imagePreview.startsWith('http')) { 
            finalImageUrl = imagePreview; 
        }

        const response = await fetch(`${API_URL}/social/schedule`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
            body: JSON.stringify({
                title, content, imagePrompt, 
                imageUrl: finalImageUrl, 
                storagePath: finalStoragePath,
                scheduledDate, scheduledTime, postType: selectedPostType?.id || 'general',
                theme: selectedTheme || customTheme, platforms: activePlatforms
            })
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Failed to schedule post.');
        
        const data = await response.json(); 
        setShowSuccess(true);
        if (onPostScheduled) onPostScheduled(data.scheduledPost || {});
        
        setTimeout(() => { 
          setTitle(''); setContent(''); setImagePrompt(''); clearImage();
          setCurrentStep('post-type'); setSelectedPostType(null); setSelectedTheme(''); setCustomTheme('');
          setGeneratedPosts([]); setProductName('');
          setShowSuccess(false);
        }, 2000);
    } catch (err) { setError(err.message); } 
    finally { setIsSubmitting(false); }
  };
  
  const handleGoBack = () => { 
    if (currentStep === 'theme') { setCurrentStep('post-type'); }
    else if (currentStep === 'creation') { setCurrentStep('theme'); setSelectedTheme(''); setCustomTheme(''); setGeneratedPosts([]); clearImage(); }
  };
  const handleStartOver = () => { 
    setCurrentStep('post-type'); setSelectedPostType(null); setSelectedTheme('');
    setCustomTheme(''); setTitle(''); setContent(''); setImagePrompt('');
    setProductName(''); clearImage(); setGeneratedPosts([]); setError(null);
  };
  const handleCopyContent = (textToCopy) => { 
    navigator.clipboard.writeText(textToCopy).then(() => {
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    });
  };
  const skipToCreation = () => setCurrentStep('creation');
  const togglePlatform = (platformId) => setSelectedPlatforms(prev => ({ ...prev, [platformId]: !prev[platformId] }));

  const renderPlatformButtons = (currentPlatforms, onToggle) => (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map(platform => (
        <motion.button key={platform.id} type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onToggle(platform.id)}
          className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${currentPlatforms[platform.id] ? 'bg-[#181A20] border-pastel-blue/50 text-white' : 'bg-[#181A20] border border-[#181A20] text-white/70'}`}
          style={currentPlatforms[platform.id] ? { borderColor: platform.color } : {}}>
          <span style={{ color: currentPlatforms[platform.id] ? platform.color : undefined }}>{platform.name}</span>
          {currentPlatforms[platform.id] && (<Check size={14} style={{ color: platform.color }} />)}
        </motion.button>
      ))}
    </div>
  );

  return (
    <div className="bg-[#23262F] p-6 rounded-xl border border-[#23262F]/60 shadow-sm">
      <AnimatePresence>
        {showCopySuccess && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-lg z-[100]">
            Content copied to clipboard!
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mb-6"> 
        <h2 className="text-2xl font-bold mb-2 flex items-center"> <Calendar className="text-pastel-blue mr-2" size={24} /> Social Media Post Creator </h2> 
        <p className="text-white/70"> Create and schedule posts for your social media platforms </p> 
      </div>
      <AnimatePresence> {error && ( <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6 p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-400 flex items-start gap-2 z-50 relative"> <AlertCircle size={18} className="mt-0.5 flex-shrink-0" /> <div><p className="font-medium">Error</p><p>{error}</p></div> </motion.div> )} </AnimatePresence>
      
      <AnimatePresence mode="wait">
        {currentStep === 'post-type' && ( 
          <motion.div key="post-type" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <span className="w-6 h-6 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2 text-sm text-pastel-blue">1</span>
              Select Post Type (Optional)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {POST_TYPES.map(type => (
                <motion.div key={type.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handlePostTypeSelect(type)}
                  className="p-4 bg-[#181A20] border border-[#181A20] rounded-lg cursor-pointer hover:border-pastel-blue/50 transition-all">
                  <div className="flex items-center mb-2"> <div className="w-10 h-10 rounded-lg bg-pastel-blue/10 flex items-center justify-center mr-3">{type.icon}</div> <h4 className="font-semibold text-white">{type.name}</h4> </div>
                  <p className="text-sm text-white/70">{type.description}</p>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 text-center"> <button onClick={skipToCreation} className="px-6 py-2 bg-pastel-blue/10 text-pastel-blue rounded-lg hover:bg-pastel-blue/20 transition-colors font-medium"> Skip and Describe Post → </button> </div>
          </motion.div>
        )}
        
        {currentStep === 'theme' && selectedPostType && ( 
          <motion.div key="theme" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
            <div className="flex items-center mb-4"> <button onClick={handleGoBack} className="mr-2 p-1 rounded hover:bg-[#181A20]"><ChevronLeft size={20} className="text-pastel-blue" /></button> <h3 className="text-lg font-semibold flex items-center"> <span className="w-6 h-6 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2 text-sm text-pastel-blue">2</span> Select Theme for {selectedPostType.name} Post </h3> </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {selectedPostType.themes.map(theme => (
                <motion.button key={theme.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleThemeSelect(theme.id)}
                  className="p-3 rounded-lg flex items-center border bg-[#181A20] border-[#181A20] hover:border-pastel-blue/50 text-white transition-all text-left">
                  <span className="text-xl mr-2">{theme.emoji}</span><span className="font-medium">{theme.name}</span>
                </motion.button>
              ))}
            </div>
            <div className="mt-4"> <label htmlFor="custom-theme-step2" className="block text-sm font-medium mb-2 text-white/80">Or custom theme:</label> <div className="flex items-center"> <input id="custom-theme-step2" type="text" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder={`e.g., ${selectedPostType.id === 'business' ? 'Summer Launch' : selectedPostType.id === 'personal' ? 'Travel Tales' : 'Industry Trends'}`} className="flex-1 p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none" /> <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { if (customTheme.trim()) { setCurrentStep('creation'); } else { setError('Please enter a custom theme or select one.'); } }} className="ml-2 px-4 py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium"> Continue </motion.button> </div> </div>
          </motion.div>
        )}
        
        {currentStep === 'creation' && ( 
          <motion.div key="creation" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <div className="flex items-center justify-between mb-4"> 
              <div className="flex items-center"> <button onClick={handleGoBack} className="mr-2 p-1 rounded hover:bg-[#181A20]"><ChevronLeft size={20} className="text-pastel-blue" /></button> <h3 className="text-lg font-semibold flex items-center"> <span className="w-6 h-6 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2 text-sm text-pastel-blue">3</span> Create Your Post </h3> </div>
              <div className="flex items-center gap-3"> <button onClick={handleStartOver} className="text-sm text-white/70 hover:text-white">Start Over</button> <div className="flex items-center gap-2 bg-[#181A20] p-1 rounded-full"> <button onClick={() => setAiMode(true)} className={`px-3 py-1 rounded-full text-sm ${aiMode ? 'bg-pastel-blue text-[#181A20] font-medium' : 'text-white/70'}`}> <div className="flex items-center"><Sparkles size={14} className="mr-1" />AI Mode</div> </button> <button onClick={() => setAiMode(false)} className={`px-3 py-1 rounded-full text-sm ${!aiMode ? 'bg-pastel-blue text-[#181A20] font-medium' : 'text-white/70'}`}> <div className="flex items-center"><Edit size={14} className="mr-1" />Manual</div> </button> </div> </div>
            </div>
            
            <AnimatePresence mode="wait">
              {aiMode ? ( 
                <motion.div key="ai-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-6">
                  <div className="bg-[#181A20] p-4 rounded-lg border border-[#181A20] mb-4">
                    <div className="flex items-start mb-4"><Sparkles size={20} className="text-pastel-blue mr-2 mt-1" /> <div><h4 className="font-medium text-white">Let AI create content</h4> <p className="text-sm text-white/70">Describe post or add an image.</p> </div> </div>
                    <div className="mb-4">  <label htmlFor="custom-theme-input" className="block text-sm font-medium mb-2 text-white/80">Post topic?</label> <textarea id="custom-theme-input" value={customTheme} onChange={(e) => setCustomTheme(e.target.value)} placeholder="e.g., New artisanal coffee beans, rich aroma, ethical sourcing." rows={3} className="w-full p-3 rounded-lg border border-[#232731] bg-[#232731] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none resize-none" /> </div>
                    {(selectedPostType?.id === 'business' || currentStep === 'creation') && ( <div className="mb-4"> <label htmlFor="product-name-input" className="block text-sm font-medium mb-2 text-white/80">Product Name (opt.)</label> <input id="product-name-input" type="text" value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g., 'Morning Bliss' Coffee" className="w-full p-3 rounded-lg border border-[#232731] bg-[#232731] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none" /> </div> )}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-2 text-white/80">Image for AI (opt.)</label>
                        <div onDragOver={(e) => {e.preventDefault(); setIsDraggingOverAI(true);}} onDragLeave={() => setIsDraggingOverAI(false)} onDrop={(e) => handleImageDrop(e, 'ai')} className={`p-4 rounded-lg transition-all border ${isDraggingOverAI ? 'border-2 border-dashed border-pastel-blue bg-[#181A20]/70' : 'border-[#232731] bg-[#232731]/50' }`}>
                            {!imagePreview ? (<label htmlFor="ai-image-input" className="cursor-pointer text-center"> <UploadCloud size={24} className="mx-auto mb-2 text-pastel-blue/70" /> <p className="text-sm text-white/70">Drag & drop or click</p> <input id="ai-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageInputChange}/> </label>) 
                            : (<div className="relative text-center"> <img src={imagePreview} alt="AI Preview" className="max-h-40 rounded object-contain mx-auto mb-2" /> <button type="button" onClick={clearImage} className="px-3 py-1 text-xs bg-pastel-pink/20 text-pastel-pink rounded hover:bg-pastel-pink/30"> <X size={12} className="inline mr-1"/>Clear</button> </div>)}
                        </div>
                    </div>
                    <div className="mb-4"> <label className="block text-sm font-medium mb-2 text-white/80">Platforms?</label> {renderPlatformButtons(selectedPlatforms, togglePlatform)} </div>
                    <motion.button onClick={handleGenerateWithAI} disabled={isGenerating} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                      {isGenerating ? (<><div className="animate-spin h-5 w-5 border-2 border-[#181A20]/20 border-t-[#181A20] rounded-full mr-2"></div>Generating...</>) : (<><Sparkles size={18} className="mr-2" />Generate Ideas {imagePreview && "(with Image)"}</>)}
                    </motion.button>
                  </div>
                  
                  {isGenerating && ( <div className="mt-6 text-center p-6 bg-[#181A20] rounded-lg"> <div className="animate-spin h-8 w-8 border-4 border-pastel-blue/30 border-t-pastel-blue rounded-full mx-auto mb-3"></div> <p className="text-white/80">Generating...</p> </div> )}
                  {!isGenerating && generatedPosts.length > 0 && ( 
                    <div className="mt-6 space-y-4"> <h4 className="font-medium text-white flex items-center mb-2"><Zap className="text-pastel-blue h-4 w-4 mr-2" />AI-Generated Ideas</h4>
                      {generatedPosts.map((post) => (
                        <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#232731] border border-[#232731] rounded-lg p-4">
                          {post.sourceImageUrl && (<div className="mb-3 p-2 bg-[#181A20] rounded-md flex items-center gap-2"> <Image size={16} className="text-pastel-blue" /> <span className="text-xs text-white/70">Inspired by your image.</span> </div>)}
                          <h4 className="font-medium mb-2 text-white">{post.title}</h4> <p className="text-white/80 text-sm mb-4 whitespace-pre-line">{post.content}</p>
                          {post.imagePrompt && ( <div className="p-3 bg-[#181A20] rounded-lg mb-4"> <div className="flex items-center text-xs font-medium text-white/70 mb-1"><Image size={12} className="mr-1" />Image Context:</div> <p className="text-sm italic text-white/80">{post.imagePrompt}</p> </div> )}
                          {post.bestTime && ( <div className="flex items-center text-xs text-white/60 mb-3"><Clock size={12} className="mr-1" />Best time: {post.bestTime}</div> )}
                          <div className="flex flex-wrap justify-between gap-2">  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => handleCopyContent(post.content)} className="px-3 py-1.5 border border-[#181A20] rounded-lg text-sm flex items-center hover:bg-[#181A20]/50"><Copy size={14} className="mr-1" />Copy</motion.button>  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => applyGeneratedPost(post)} className="px-3 py-1.5 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg text-sm flex items-center"><Check size={14} className="mr-1" />Use This</motion.button>  </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {!isGenerating && generatedPosts.length === 0 && !error && ( <div className="mt-6 text-center p-6 bg-[#181A20]/50 rounded-lg border border-[#181A20]"> <Zap size={24} className="mx-auto mb-2 text-pastel-blue/50" /> <p className="text-white/70 text-sm">AI ideas appear here.</p> </div> )}
                </motion.div>
              ) : ( 
                <motion.div key="manual-mode" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <form onSubmit={handleSchedulePost} className="space-y-4">
                    <div> <label htmlFor="manual-title" className="block text-sm font-medium mb-2 text-white/80">Title (opt.)</label> <input id="manual-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={selectedPostType?.id === 'business' ? "e.g., Summer Sale" : selectedPostType?.id === 'personal' ? "e.g., My Travel Adventure" : "e.g., 5 Productivity Tips"} className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none" /> </div>
                    <div> <label htmlFor="post-content-area" className="block text-sm font-medium mb-2 text-white/80">Content</label> <textarea id="post-content-area" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write post content..." rows={5} className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none resize-none" /> </div>
                    <div onDragOver={(e) => {e.preventDefault(); setIsDraggingOverManual(true);}} onDragLeave={() => setIsDraggingOverManual(false)} onDrop={(e) => handleImageDrop(e, 'manual')} className={`p-4 rounded-lg transition-all border ${isDraggingOverManual ? 'border-2 border-dashed border-pastel-blue bg-[#181A20]/70' : 'border-[#232731] bg-[#181A20]/30' }`}>
                      <label className="block text-sm font-medium mb-2 text-white/80"> Image (opt.) - Drag & Drop or</label>
                      <div className="flex items-center gap-3">
                        <motion.label htmlFor="manual-image-input" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#232731] hover:bg-[#232731]/70 border border-[#232731] hover:border-pastel-blue/50 text-white"> <UploadCloud size={16} className="text-pastel-blue" /><span>Upload</span> <input id="manual-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageInputChange}/> </motion.label>
                        {imageFile && ( <div className="flex items-center gap-2"> <Image size={18} className="text-pastel-blue" /> <span className="text-sm text-white/80 truncate max-w-[150px]">{imageFile.name}</span> <button type="button" onClick={clearImage} className="p-1 text-white/60 hover:text-white" title="Remove image"><X size={16} /></button> </div> )}
                      </div>
                      {imagePreview && ( <div className="mt-3 relative max-w-xs"> <p className="text-xs text-white/70 mb-1">Preview:</p> <img src={imagePreview} alt="Preview" className="max-h-40 rounded-lg object-contain bg-[#232731] p-1 border border-[#232731]" />  <button type="button" onClick={clearImage} className="absolute top-0 right-0 mt-1 mr-1 p-0.5 bg-[#181A20]/70 rounded-full text-white/80 hover:text-white" title="Clear preview"><X size={14} /></button> </div> )}
                      {isDraggingOverManual && (<p className="mt-2 text-sm text-pastel-blue text-center">Drop image here</p>)}
                    </div>
                    <div> <label htmlFor="manual-image-prompt" className="block text-sm font-medium mb-2 text-white/80">Image Prompt (if no image, AI can generate)</label> <input id="manual-image-prompt" type="text" value={imagePrompt} onChange={(e) => setImagePrompt(e.target.value)} placeholder="Describe image for AI generation..." className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white placeholder:text-white/50 focus:border-pastel-blue/50 outline-none" /> </div>
                    <div className="pt-2"> <button type="button" onClick={() => setShowAdvancedOptions(!showAdvancedOptions)} className="flex items-center text-white/70 hover:text-white text-sm"> {showAdvancedOptions ? <ChevronDown size={16} className="mr-1" /> : <ChevronRight size={16} className="mr-1" />} <span>{showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options</span> </button> </div>
                    <AnimatePresence>{showAdvancedOptions && ( <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden"> <div className="mb-4"> <label className="block text-sm font-medium mb-2 text-white/80">Platforms</label> {renderPlatformButtons(selectedPlatforms, togglePlatform)} </div> </motion.div> )}</AnimatePresence>
                    <div className="pt-4 border-t border-[#181A20]"> 
                      <h4 className="font-semibold text-white mb-3 flex items-center"><Calendar size={16} className="mr-2 text-pastel-blue" />Schedule Post</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        <div><label htmlFor="schedule-date" className="block text-sm font-medium mb-2 text-white/80">Date</label><input id="schedule-date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} min={new Date().toISOString().split('T')[0]} className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white" /></div>
                        <div><label htmlFor="schedule-time" className="block text-sm font-medium mb-2 text-white/80">Time</label><input id="schedule-time" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="w-full p-3 rounded-lg border border-[#181A20] bg-[#181A20] text-white" /></div>
                      </div>
                      <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full py-3 bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20] rounded-lg font-medium flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? (<><div className="animate-spin h-5 w-5 border-2 border-[#181A20]/20 border-t-[#181A20] rounded-full mr-2"></div>Scheduling...</>) : (<><Send size={18} className="mr-2" />Schedule Post</>)}
                      </motion.button>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence> 
        {showSuccess && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed bottom-4 right-4 bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-lg shadow-lg flex items-center z-[100]"> <Check size={20} className="mr-2" /><div><p className="font-medium">Post scheduled!</p><p className="text-sm">Added to schedule.</p></div> </motion.div>
        )}
      </AnimatePresence>
      
      <div className="fixed bottom-4 left-4 z-50"> 
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#181A20] p-2 rounded-full shadow-lg border border-pastel-blue/30 cursor-pointer group relative">
          <Info size={20} className="text-pastel-blue" />
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 0 }} whileHover={{ opacity: 1, scale: 1 }} className="absolute left-0 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity w-64 bg-[#181A20] p-3 rounded-lg border border-pastel-blue/20 shadow-xl pointer-events-none">
            <h5 className="font-medium text-white mb-1">Quick Tips</h5>
            <ul className="text-xs text-white/70 space-y-1 list-disc pl-4"> <li>Opt. select type/theme.</li> <li>AI Mode: Describe post and/or add image.</li> <li>Manual Mode: Write content & upload/drop image.</li> <li>Schedule for optimal engagement.</li> </ul>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SocialPostCreator;