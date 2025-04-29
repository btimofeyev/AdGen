// client/src/pages/AdCreator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileUp, X, ImagePlus, Home, User, Settings, LogOut, Zap } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_URL } from '../config';
import supabase from '../lib/supabase';
import ImageModal from '../components/ImageModal';
import ImageGrid from '../components/ImageGrid';
import { Elements } from '@stripe/react-stripe-js';
import stripePromise from '../lib/stripe';
import UserCredits from '../components/UserCredits';

function AdCreator() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [credits, setCredits] = useState(null);
  const [creditsLoading, setCreditsLoading] = useState(true);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('create'); 
  const [paymentComplete, setPaymentComplete] = useState(false);

  // State for tracking if a generation request is in progress
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState(0);

  const promptInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Focus on prompt input on component mount
  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
    
    // If no user, redirect to login
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // Effect to load user's saved images when component mounts
  useEffect(() => {
    if (user) {
      loadUserImages();
      loadUserCredits();
    }
  }, [user]);

  // Load user credits
  const loadUserCredits = async () => {
    try {
      setCreditsLoading(true);
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCreditsLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/users/credits`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          // No credits found, this is okay for new users
          setCredits({
            available_credits: 0,
            total_credits_received: 0,
            credits_used: 0
          });
        } else {
          throw new Error('Failed to load credits');
        }
      } else {
        const data = await response.json();
        setCredits(data);
      }
    } catch (err) {
      console.error('Error loading user credits:', err);
    } finally {
      setCreditsLoading(false);
    }
  };

  // Function to load user's saved images
  const loadUserImages = async () => {
    try {
      setIsLoadingImages(true);
      // Get auth token for the request
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoadingImages(false);
        return;
      }

      console.log('Fetching user images...');
      const response = await fetch(`${API_URL}/user/images`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load images');
      }

      const data = await response.json();
      if (data.images && data.images.length > 0) {
        console.log(`Loaded ${data.images.length} images from server`);
        setGeneratedImages(data.images);
      } else {
        console.log('No images found for this user');
        setGeneratedImages([]);
      }
    } catch (err) {
      console.error('Error loading user images:', err);
      setError(`Failed to load your gallery: ${err.message}`);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Reset states
    setError(null);
    setFile(selectedFile);
    setUploadedFilePath(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  // Upload the image to the server
  const uploadImage = async () => {
    if (!file) return null;
    
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      const formData = new FormData();
      formData.append('image', file);
      
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      const data = await response.json();
      return data.filepath;
    } catch (err) {
      setError(`Upload error: ${err.message}`);
      return null;
    }
  };

  // Generate images based on the uploaded image and prompt
  const generateImages = async (filePath) => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Generate a unique ID for this request
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      const requestBody = {
        filepath: filePath,
        prompt: prompt,
        count: numImages,
        requestId // Include request ID for server-side tracking
      };
      
      console.log(`Sending image generation request: ${requestId} for ${numImages} images`);
      
      const response = await fetch(`${API_URL}/generate/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          throw new Error(`Insufficient credits: ${errorData.message || 'You need more credits to generate these images.'}`);
        }
        throw new Error(errorData.error || 'Failed to generate images');
      }
      
      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(`Generation error: ${err.message}`);
      return [];
    }
  };

  // Generate images from scratch (without reference image)
  const generateImagesFromScratch = async () => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Generate a unique ID for this request
      const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      const requestBody = {
        prompt: prompt,
        count: numImages,
        requestId // Include request ID for server-side tracking
      };
      
      console.log(`Sending image generation from scratch request: ${requestId} for ${numImages} images`);
      
      const response = await fetch(`${API_URL}/generate/multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session ? `Bearer ${session.access_token}` : ''
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 402) {
          throw new Error(`Insufficient credits: ${errorData.message || 'You need more credits to generate these images.'}`);
        }
        throw new Error(errorData.error || 'Failed to generate images');
      }
      
      const data = await response.json();
      return data.results;
    } catch (err) {
      setError(`Generation error: ${err.message}`);
      return [];
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading || isSubmitting) {
      console.log('Generation already in progress, ignoring duplicate submission');
      return;
    }
    
    // Add debounce to prevent accidental double clicks (300ms)
    const now = Date.now();
    if (now - lastRequestTime < 300) {
      console.log('Request throttled, please wait');
      return;
    }
    setLastRequestTime(now);
    
    if (!prompt.trim()) return;
    
    // Check if user has enough credits first
    if (credits && numImages > credits.available_credits) {
      setError(`You don't have enough credits. You have ${credits.available_credits} credits but need ${numImages} to generate these images.`);
      return;
    }
    
    // Generate a request ID on the client side
    const requestId = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    console.log(`Starting generation request: ${requestId} for ${numImages} images`);
    
    setLoading(true);
    setIsSubmitting(true);
    setError(null);
    
    try {
      let results = [];
      
      if (file) {
        // For subsequent requests, always re-upload to ensure server has the file
        let filePath = null;
        
        // If we're quickly generating images again, always upload a fresh copy
        // This ensures we don't run into file cleanup issues on the server
        if (now - lastRequestTime < 30000) { // If within 30 seconds of last request
          console.log('Recent request detected - uploading fresh copy of image');
          filePath = await uploadImage();
        } else {
          // Try to use existing path first, but fall back to re-uploading
          filePath = uploadedFilePath || await uploadImage();
        }
        
        if (!filePath) throw new Error('Failed to upload image');
        
        // Save the file path for future generations
        setUploadedFilePath(filePath);
        
        // Generate images with the uploaded image as reference
        results = await generateImages(filePath);
      } else {
        // Generate images from scratch based only on the prompt
        results = await generateImagesFromScratch();
      }
      
      if (results.length === 0) {
        throw new Error('No images were generated');
      }
      
      // Format the results with additional metadata - no explicit labels
      const formattedResults = results.map((result, index) => ({
        ...result,
        id: result.id || Date.now() + index, // Use server-provided ID or generate one
        timestamp: new Date().toISOString()
      }));
      
      // Add new images to existing ones
      setGeneratedImages(prev => [...formattedResults, ...prev]);
      
      // Refresh credits after generation
      loadUserCredits();
      
      // Switch to gallery tab
      setActiveTab('gallery');
    } catch (err) {
      setError(err.message);
      console.error('Error in generation process:', err);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  // Handle image download
  const handleDownload = (base64Image, index) => {
    const link = document.createElement('a');
    link.href = base64Image;
    link.download = `generated-ad-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy image to clipboard
  const handleCopyImage = async (imageBase64, index) => {
    try {
      // Convert the base64 string to a blob
      const fetchResponse = await fetch(imageBase64);
      const blob = await fetchResponse.blob();
      
      // Create a ClipboardItem and write to clipboard
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      
      // You could add a toast notification here to confirm copy
      alert('Image copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy image: ', err);
      // Fallback for browsers that don't support clipboard API
      handleDownload(imageBase64, index);
    }
  };

  // Handle opening the modal with a specific image
  const handleOpenModal = (image) => {
    setSelectedImage(image);
    setModalOpen(true);
  };

  // Handle image deletion
  const handleDeleteImage = async (imageId) => {
    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('You must be logged in to delete images');
        return;
      }
      
      const response = await fetch(`${API_URL}/user/images/${imageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete image');
      }
      
      // Remove the image from the state
      setGeneratedImages(prev => prev.filter(img => img.id !== imageId));
    } catch (err) {
      setError(`Delete error: ${err.message}`);
    }
  };

  const funPrompts = [
    "Place my product in a cozy living room",
    "Put my product on a marble desk",
    "Feature my product with a beach background",
    "Show my product on a luxury shelf",
    "Style my product in an outdoor market",
  ];

  const handleFunPromptClick = (text) => {
    setPrompt(text);
    promptInputRef.current.focus();
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
          <ImagePlus size={20} className="text-pastel-blue" />
        </div>
        <SidebarIcon icon={<User size={20} />} onClick={() => navigate('/account')} />
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
          <div className="flex items-center">
            <h1 className="text-2xl font-extrabold">
              <span className="text-pastel-blue">SnapSceneAI</span> Studio
            </h1>
            
            {/* Credits Quick View */}
            {!creditsLoading && credits && (
              <Link to="/account" className="ml-6 flex items-center text-sm bg-pastel-blue/10 hover:bg-pastel-blue/20 px-3 py-1 rounded-full transition">
                <Zap size={14} className="text-pastel-blue mr-1" />
                <span className="font-medium">{credits.available_credits}</span>
                <span className="text-charcoal/60 ml-1">credits</span>
              </Link>
            )}
          </div>
          
          {/* Tabs */}
          <div className="flex space-x-1 bg-soft-white rounded-lg p-1">
            <button 
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'create'
                  ? 'bg-white shadow-sm text-charcoal'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-white/50'
              }`}
            >
              Create
            </button>
            <button 
              onClick={() => setActiveTab('gallery')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'gallery'
                  ? 'bg-white shadow-sm text-charcoal'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-white/50'
              }`}
            >
              Gallery {generatedImages.length > 0 && `(${generatedImages.length})`}
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">

          {/* Center Area */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto">

            {/* Error Message */}
            {error && (
              <div className="w-full max-w-5xl mx-auto mb-6 bg-pastel-pink/20 border border-pastel-pink/50 rounded-lg p-4 text-red-700">
                <p className="font-medium">Error: {error}</p>
                {error.includes('Failed to load your gallery') && (
                  <button 
                    onClick={loadUserImages}
                    className="mt-2 text-sm bg-pastel-pink/10 hover:bg-pastel-pink/20 px-3 py-1 rounded-md text-pastel-pink transition-colors"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}

            {/* Create Tab */}
            {activeTab === 'create' && (
              <div className="w-full max-w-5xl mx-auto">
                {/* Loading State */}
                {loading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                    {Array.from({ length: numImages }).map((_, idx) => (
                      <div key={idx} className="aspect-square bg-soft-white animate-pulse rounded-lg border border-light-gray/30" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center p-4 bg-pastel-blue/20 rounded-full mb-4">
                      <ImagePlus size={32} className="text-pastel-blue" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Create Your Scene</h3>
                    <p className="text-charcoal/70 max-w-md mx-auto mb-6">
                      Upload your product image, choose a scene style, and let SnapSceneAI transform it.
                    </p>
                    {!preview && (
                      <button
                        className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal px-6 py-3 rounded-full font-semibold shadow-md transition"
                        onClick={() => fileInputRef.current.click()}
                      >
                        <FileUp className="h-4 w-4 mr-2 inline-block" />
                        Upload Image
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Gallery Tab */}
            {activeTab === 'gallery' && (
              <div className="w-full max-w-6xl mx-auto">
                <h2 className="text-xl font-bold mb-4 flex items-center justify-between">
                  <span>Your Generated Visuals</span>
                  {!isLoadingImages && (
                    <button
                      onClick={loadUserImages}
                      className="text-sm bg-pastel-blue/10 hover:bg-pastel-blue/20 px-3 py-1 rounded-md text-pastel-blue transition-colors"
                    >
                      Refresh
                    </button>
                  )}
                </h2>
                
                {isLoadingImages ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                    {Array.from({ length: 4 }).map((_, idx) => (
                      <div key={idx} className="aspect-square bg-soft-white animate-pulse rounded-lg border border-light-gray/30" />
                    ))}
                  </div>
                ) : generatedImages.length > 0 ? (
                  <ImageGrid 
                    images={generatedImages} 
                    onDownload={handleDownload}
                    onCopy={handleCopyImage}
                    onModalOpen={handleOpenModal}
                    onDelete={handleDeleteImage}
                  />
                ) : (
                  <div className="bg-white rounded-lg border border-light-gray/40 p-8 text-center">
                    <p className="text-charcoal/70 mb-4">You haven't generated any images yet.</p>
                    <button
                      onClick={() => setActiveTab('create')}
                      className="bg-pastel-blue/10 text-pastel-blue hover:bg-pastel-blue/20 px-4 py-2 rounded-lg font-medium"
                    >
                      Go to Create
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Right Sidebar */}
          <div className="w-80 p-6 bg-white border-l border-light-gray/40 overflow-y-auto">
            {/* Credit Usage */}
            <div className="mb-8">
              <UserCredits />
            </div>
            
            {/* Upload Thumbnail */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3">Your Product</h2>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden shadow border border-light-gray/40">
                  <img src={preview} alt="Uploaded" className="object-contain w-full h-36" />
                  <button
                    onClick={() => { setPreview(null); setFile(null); setUploadedFilePath(null); }}
                    className="absolute top-2 right-2 bg-white p-1 rounded-full shadow"
                  >
                    <X size={16} className="text-pastel-pink" />
                  </button>
                </div>
              ) : (
                <button 
                  className="w-full flex flex-col items-center justify-center gap-2 border-2 border-dashed border-pastel-blue/30 p-6 rounded-xl hover:bg-pastel-blue/10 transition"
                  onClick={() => fileInputRef.current.click()}
                >
                  <ImagePlus size={24} className="text-pastel-blue" />
                  <span className="text-sm font-semibold text-pastel-blue">Upload Image</span>
                </button>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png,image/jpeg,image/jpg,image/webp"
              />
            </div>

            {/* Fun Prompts */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3">Scene Ideas</h2>
              <div className="space-y-2">
                {funPrompts.map((text, idx) => (
                  <button 
                    key={idx}
                    onClick={() => handleFunPromptClick(text)}
                    className="w-full text-left text-sm text-pastel-blue bg-pastel-blue/10 hover:bg-pastel-blue/20 p-2 rounded-lg font-medium transition"
                  >
                    {text}
                  </button>
                ))}
              </div>
            </div>

            {/* Number of Images Selector */}
            <div>
              <h2 className="text-lg font-bold mb-3">How Many Visuals?</h2>
              
              {/* Credit Status Indicator */}
              {!creditsLoading && credits && (
                <div className={`mb-3 p-2 rounded-lg text-sm ${
                  credits.available_credits < numImages 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : credits.available_credits < 5
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-green-100 text-green-700 border border-green-200'
                }`}>
                  <div className="flex items-center">
                    <Zap size={14} className="mr-1 flex-shrink-0" />
                    <span>
                      {credits.available_credits < numImages 
                        ? `Need ${numImages - credits.available_credits} more credit${numImages - credits.available_credits !== 1 ? 's' : ''}` 
                        : `${credits.available_credits} credit${credits.available_credits !== 1 ? 's' : ''} available`
                      }
                    </span>
                  </div>
                  {credits.available_credits < numImages && (
                    <Link 
                      to="/account" 
                      className="mt-1 block text-center w-full px-2 py-1 bg-white rounded text-xs font-medium shadow-sm hover:bg-gray-50"
                    >
                      Get More Credits
                    </Link>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    onClick={() => setNumImages(num)}
                    className={`rounded-lg py-2 font-semibold ${
                      numImages === num
                        ? 'bg-pastel-blue text-charcoal'
                        : 'bg-soft-white text-charcoal hover:bg-pastel-blue/20 border border-light-gray/40'
                    } transition`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              
              {/* Credit cost explanation */}
              <p className="text-xs text-charcoal/60 mt-2">
                Each image costs 1 credit
              </p>
            </div>

          </div>
        </div>

        {/* Prompt Input */}
        <form onSubmit={handleSubmit} className="bg-white border-t border-light-gray/40 p-6">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <textarea
              ref={promptInputRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows="2"
              placeholder="Describe your scene..."
              className="flex-1 p-4 border border-light-gray rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-pastel-blue focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!prompt.trim() || loading}
              className={`px-6 py-3 rounded-full font-bold shadow-md transition ${
                !prompt.trim() || loading 
                  ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                  : 'bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal'
              }`}
            >
              {loading ? 'Generating...' : 'Generate'}
            </button>
          </div>
        </form>

      </div>

      {/* Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        image={selectedImage}
        onDownload={handleDownload}
        onCopy={handleCopyImage}
      />
    </div>
  );
}

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

export default AdCreator;