// client/src/pages/AdCreator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Send, 
  Download, 
  ImagePlus, 
  Copy, 
  ChevronRight, 
  Maximize2, 
  X, 
  AlertCircle,
  Grid,
  User,
  LogOut,
  Home,
  Settings,
  PlusCircle,
  FileUp,
  ChevronUp,
  ChevronDown,
  Menu,
  ArrowRight
} from "lucide-react";
import { API_URL } from '../config';
import ImageModal from '../components/ImageModal';

function AdCreator() {
  // State variables
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showTemplates, setShowTemplates] = useState(true);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('');
  const [activeTemplateTab, setActiveTemplateTab] = useState('Product');

  const promptInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // Template data
  const templateCategories = [
    { id: 'Product', label: 'Product' },
    { id: 'Promotional', label: 'Promotional' },
    { id: 'Seasonal', label: 'Seasonal' }
  ];

  const templates = {
    'Product': [
      {
        id: 'product-showcase',
        title: 'Product Showcase',
        description: 'Highlight your product features and benefits',
        formats: ['Instagram Post', 'Facebook Ad'],
        prompt: 'Create a clean product showcase highlighting features and benefits',
        theme: 'New Arrival',
        icon: '📸'
      },
      {
        id: 'product-collection',
        title: 'Product Collection',
        description: 'Display multiple items from your product line',
        formats: ['Instagram Post', 'Email Header'],
        prompt: 'Design a grid layout showing multiple items from the product collection',
        theme: 'Featured Collection',
        icon: '🗂️'
      }
    ],
    'Promotional': [
      {
        id: 'sales-promo',
        title: 'Sales Promotion',
        description: 'Announce discounts and limited-time offers',
        formats: ['Instagram Story', 'Facebook Ad'],
        prompt: 'Create a bold sales promotion with eye-catching discount callout',
        theme: 'Flash Sale',
        icon: '🏷️'
      },
      {
        id: 'special-offer',
        title: 'Special Offer',
        description: 'Promote bundles, gifts with purchase, or exclusive deals',
        formats: ['Instagram Post', 'Web Banner'],
        prompt: 'Design a special offer advertisement highlighting bundle value',
        theme: 'Limited Edition',
        icon: '🎁'
      }
    ],
    'Seasonal': [
      {
        id: 'holiday-theme',
        title: 'Holiday Theme',
        description: 'Seasonal promotions tied to holidays and events',
        formats: ['Instagram Post', 'Email Header'],
        prompt: 'Create a festive holiday-themed advertisement with seasonal elements',
        theme: 'Holiday Special',
        icon: '🎄'
      }
    ]
  };

  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  // --- Handlers ---
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(selectedFile);
    setUploadedFilePath(null);
    setError(null);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current.click();
  };

  // Handler for template selection
  const handleTemplateSelect = (template) => {
    setPrompt(template.prompt);
    
    // Set theme and format from template
    if (template.theme) {
      setSelectedTheme(template.theme);
    }
    
    if (template.formats && template.formats.length > 0) {
      setSelectedFormat(template.formats[0]);
    }
    
    promptInputRef.current?.focus();
  };

  const handleDownload = (imageData, index) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `visual-content-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyImage = async (imageData, index) => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not available.');
      }
      const response = await fetch(imageData);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      alert('Image copied to clipboard!'); // Replace with toast later
    } catch (err) {
      console.error('Failed to copy image: ', err);
      alert(`Failed to copy: ${err.message}. Downloading instead.`);
      handleDownload(imageData, index);
    }
  };

  const handleImageClick = (item, index) => {
    if (item.error) return;
    setSelectedImage({
      src: item.base64Image,
      alt: `Generated ${item.format || item.theme || `visual ${index + 1}`}`,
      title: item.format || item.theme || `Visual #${index + 1}`,
      index
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!prompt || prompt.trim() === '') {
      promptInputRef.current?.focus();
      setError('Please describe the visual you want to create.');
      return;
    }

    setLoading(true);
    setGeneratedImages([]);

    try {
      let currentFilepath = uploadedFilePath;
      if (file && !currentFilepath) {
        const formData = new FormData();
        formData.append('image', file);
        const uploadResponse = await fetch(`${API_URL}/upload`, { method: 'POST', body: formData });
        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to upload image before generation');
        }
        const uploadData = await uploadResponse.json();
        currentFilepath = uploadData.filepath;
        setUploadedFilePath(currentFilepath);
      }

      // Add theme and format to the request if selected
      const requestData = {
        filepath: currentFilepath, 
        prompt, 
        count: numImages
      };
      
      if (selectedTheme) {
        requestData.themes = [selectedTheme];
      }
      
      if (selectedFormat) {
        requestData.formats = [selectedFormat];
      }

      const response = await fetch(`${API_URL}/generate/multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setGeneratedImages(data.results);
        setPrompt('');
      } else {
         if (response.status === 200 && (!data.results || data.results.length === 0)) {
            setError("Generation complete, but no images were returned. Try adjusting your prompt.");
         } else {
            throw new Error('The generation process returned no images.');
         }
      }
    } catch (err) {
      console.error('Error generating images:', err);
      setError(err.message || 'An unexpected error occurred during generation.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setGeneratedImages([]);
    setPrompt('');
    setFile(null);
    setPreview(null);
    setUploadedFilePath(null);
    setError(null);
    setNumImages(3);
    if (fileInputRef.current) fileInputRef.current.value = "";
    promptInputRef.current?.focus();
  };
  
  const removeSelectedOption = (type) => {
    if (type === 'theme') {
      setSelectedTheme('');
    } else if (type === 'format') {
      setSelectedFormat('');
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Left Navigation */}
      <div className="w-16 bg-white shadow-md flex flex-col items-center py-6 z-10">
        <div className="flex flex-col items-center gap-7">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
            <User size={16} />
          </div>
          
          <button className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-colors">
            <Home size={20} />
          </button>
          
          <button className="p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900 transition-colors">
            <Settings size={20} />
          </button>
          
          <div className="mt-auto">
            <button className="p-2.5 rounded-xl hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-grow flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-lg font-medium">Visual Creator</span>
          </div>
        </header>
        
        <div className="flex flex-grow overflow-hidden">
          {/* Main Content */}
          <div className="flex-grow flex flex-col overflow-hidden">
            <div className="flex flex-grow overflow-hidden">
              {/* Preview/Results Area - Left Side */}
              <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                <div className="flex-grow flex flex-col items-center justify-center rounded-xl bg-white p-6 min-h-[400px] shadow-sm border border-zinc-200">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin mb-6"></div>
                      <h3 className="text-xl font-medium text-zinc-900 mb-2">Generating...</h3>
                      <p className="text-zinc-500">Your visuals are being created</p>
                    </div>
                  ) : generatedImages.length > 0 ? (
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-medium text-zinc-900">Generated Visuals</h2>
                        <button
                          className="px-3.5 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors"
                          onClick={handleReset}
                        >
                          Start New
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {generatedImages.map((item, index) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            key={`img-${index}`} 
                            className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="p-3">
                              {item.error ? (
                                <div className="aspect-video flex flex-col items-center justify-center bg-red-50 p-4 rounded-lg text-red-800 text-sm border border-red-200">
                                  <AlertCircle size={24} className="mb-2 text-red-600" />
                                  <p className="font-medium text-center">Error generating visual</p>
                                  <p className="text-xs text-center mt-1">{item.error}</p>
                                </div>
                              ) : (
                                <div 
                                  className="aspect-video relative rounded-lg overflow-hidden cursor-pointer shadow-inner" 
                                  onClick={() => handleImageClick(item, index)}
                                >
                                  <img 
                                    src={item.base64Image} 
                                    alt={`Generated ${item.format || item.theme || `visual ${index + 1}`}`} 
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end justify-center pb-3">
                                    <button 
                                      className="bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md text-zinc-800"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleImageClick(item, index);
                                      }}
                                    >
                                      <Maximize2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="p-3 pt-1">
                              <div className="flex justify-between items-center mb-3">
                                <span className="text-sm font-medium">{item.format || item.theme || "Visual"}</span>
                                <span className="bg-blue-50 text-xs px-2 py-0.5 rounded-full text-blue-600 font-medium">#{index + 1}</span>
                              </div>
                              
                              {!item.error && (
                                <div className="flex gap-2">
                                  <button 
                                    className="flex-1 py-1.5 px-1 text-sm flex justify-center items-center gap-1.5 text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
                                    onClick={() => handleDownload(item.base64Image, index)}
                                  >
                                    <Download size={15} /> <span>Download</span>
                                  </button>
                                  <button 
                                    className="flex-1 py-1.5 px-1 text-sm flex justify-center items-center gap-1.5 text-zinc-600 hover:bg-zinc-50 rounded-lg transition-colors"
                                    onClick={() => handleCopyImage(item.base64Image, index)}
                                  >
                                    <Copy size={15} /> <span>Copy</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-100">
                        <Grid size={40} className="text-blue-400" />
                      </div>
                      <h3 className="text-xl font-medium text-zinc-900 mb-2">Your visuals will appear here</h3>
                      <p className="text-zinc-500 max-w-md mx-auto">
                        Choose a template, describe your idea, and click the send button to generate.
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 flex items-center gap-2"
                    >
                      <AlertCircle size={16} className="text-red-600" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Configuration Options - Right Side */}
              <div className="w-96 bg-white border-l border-zinc-200 shadow-sm flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-zinc-100">
                  <h2 className="text-lg font-medium text-zinc-900">Templates</h2>
                  <button 
                    className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1 px-2 py-1 hover:bg-zinc-100 rounded-md"
                    onClick={() => setShowTemplates(!showTemplates)}
                  >
                    {showTemplates ? 'Hide' : 'Show'}
                    <ChevronUp size={16} className={showTemplates ? '' : 'rotate-180'} />
                  </button>
                </div>
                
                <div className="flex-grow flex flex-col overflow-hidden">
                  {/* Templates Section */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        className="overflow-hidden border-b border-zinc-100"
                      >
                        {/* Template Tabs */}
                        <div className="px-5 pt-3">
                          <div className="flex border-b border-zinc-200">
                            {templateCategories.map(category => (
                              <button
                                key={category.id}
                                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                                  activeTemplateTab === category.id 
                                    ? 'text-blue-600' 
                                    : 'text-zinc-500 hover:text-zinc-900'
                                }`}
                                onClick={() => setActiveTemplateTab(category.id)}
                              >
                                {category.label}
                                {activeTemplateTab === category.id && (
                                  <motion.div 
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"
                                    layoutId="activeTab"
                                  />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        {/* Template Cards */}
                        <div className="p-5 overflow-y-auto max-h-[400px]">
                          <div className="space-y-3">
                            {templates[activeTemplateTab].map(template => (
                              <motion.div 
                                key={template.id}
                                whileHover={{ y: -2 }}
                                className="border border-zinc-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer bg-white"
                                onClick={() => handleTemplateSelect(template)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="h-12 w-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0 border border-blue-100">
                                    {template.icon}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-zinc-900">{template.title}</h3>
                                    <p className="text-xs text-zinc-500 mt-1 mb-2">{template.description}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {template.formats.map((format, idx) => (
                                        <span key={idx} className="inline-flex text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                          {format}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Other Config Options */}
                  <div className="flex-grow p-5 space-y-6 overflow-y-auto">
                    {/* Reference Image */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900 mb-3 flex items-center">
                        <FileUp size={15} className="mr-1.5 text-blue-500" />
                        Reference Image
                      </h3>
                      {preview ? (
                        <div className="relative rounded-lg overflow-hidden bg-white border border-zinc-200">
                          <img src={preview} alt="Reference preview" className="w-full object-contain" />
                          <button 
                            type="button" 
                            aria-label="Remove image"
                            className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-sm text-zinc-500 hover:text-zinc-700"
                            onClick={() => { 
                              setFile(null); 
                              setPreview(null); 
                              setUploadedFilePath(null); 
                              if (fileInputRef.current) fileInputRef.current.value = ""; 
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-blue-200 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 transition-colors bg-blue-50/50"
                          onClick={handleFileButtonClick}
                        >
                          <div className="flex flex-col items-center">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center mb-2 text-blue-600">
                              <ImagePlus size={18} />
                            </div>
                            <p className="text-sm text-blue-600 font-medium">Add Image</p>
                            <p className="text-xs text-blue-400 mt-1">Optional</p>
                          </div>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.heic,.heif" onChange={handleFileChange} />
                    </div>
                    
                    {/* Selected Options */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900 mb-3 flex items-center">
                        <Settings size={15} className="mr-1.5 text-blue-500" />
                        Selected Options
                      </h3>
                      <div className="space-y-2">
                        {selectedTheme ? (
                          <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 px-3 py-2.5 rounded-lg text-blue-700 text-sm">
                            <div className="flex items-center">
                              <span className="mr-2">🏷️</span>
                              <span>{selectedTheme}</span>
                            </div>
                            <button 
                              onClick={() => removeSelectedOption('theme')} 
                              className="text-blue-400 hover:text-blue-600 p-1 hover:bg-blue-200/50 rounded-full"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm border border-zinc-200 text-center">
                            No theme selected
                          </div>
                        )}
                        
                        {selectedFormat ? (
                          <div className="flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100 px-3 py-2.5 rounded-lg text-purple-700 text-sm">
                            <div className="flex items-center">
                              <span className="mr-2">📱</span>
                              <span>{selectedFormat}</span>
                            </div>
                            <button 
                              onClick={() => removeSelectedOption('format')} 
                              className="text-purple-400 hover:text-purple-600 p-1 hover:bg-purple-200/50 rounded-full"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="px-3 py-2.5 rounded-lg text-zinc-400 text-sm border border-zinc-200 text-center">
                            No format selected
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Number of visuals */}
                    <div>
                      <h3 className="text-sm font-medium text-zinc-900 mb-3 flex items-center">
                        <Grid size={15} className="mr-1.5 text-blue-500" />
                        Number of visuals
                      </h3>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map((num) => (
                          <button
                            key={num}
                            className={`flex items-center justify-center rounded-lg py-2.5 ${
                              numImages === num
                                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-medium shadow-sm'
                                : 'border border-zinc-200 text-zinc-700 hover:border-blue-300 hover:bg-blue-50/50'
                            } transition-all duration-200`}
                            onClick={() => setNumImages(num)}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Enhanced Input Area - Fixed at bottom */}
            <div className="sticky bottom-0 bg-gradient-to-b from-zinc-50/80 via-white to-white backdrop-blur-md pt-6 pb-8 px-6">
              <div className="max-w-3xl mx-auto">
                {/* Enhanced Double-height Input Form */}
                <form onSubmit={handleSubmit}>
                  <div className="relative rounded-xl border-2 border-blue-300 shadow-lg bg-white overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                    {/* Text area for input */}
                    <div className="min-h-[100px] px-4 py-3 flex">
                      <textarea
                        ref={promptInputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="flex-1 resize-none border-none outline-none bg-transparent text-zinc-800 placeholder-zinc-400 h-full min-h-[70px] pt-1.5"
                        placeholder="Attach files or start a conversation now and add files later..."
                        rows={2}
                      />
                    </div>
                    
                    {/* Bottom toolbar */}
                    <div className="border-t border-zinc-100 px-4 py-2.5 flex justify-between items-center bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
                      <div className="flex items-center">
                        <button
                          type="button"
                          onClick={handleFileButtonClick}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
                        >
                          <PlusCircle size={20} />
                        </button>
                      </div>
                      
                      <button
                        type="submit"
                        disabled={loading || !prompt.trim()}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all shadow-sm ${
                          loading || !prompt.trim()
                            ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md active:scale-95'
                        }`}
                      >
                        {loading ? (
                          <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="font-medium">Send</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              
                {/* File attachment display (when file is selected) */}
                {file && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 bg-blue-50 py-2 px-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 text-sm text-blue-700">
                        <FileUp size={14} />
                        <span className="font-medium truncate max-w-[300px]">{file.name}</span>
                        <span className="text-blue-500 text-xs">
                          {file.type.split('/')[0]}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="ml-auto text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Helper text */}
                <div className="text-xs text-center text-blue-400 mt-2">
                  Start typing or choose a template from the sidebar
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        image={selectedImage || { src: '', alt: '', title: '' }}
        onDownload={() => selectedImage && handleDownload(selectedImage.src, selectedImage.index)}
        onCopy={() => selectedImage && handleCopyImage(selectedImage.src, selectedImage.index)}
      />
    </div>
  );
}

export default AdCreator;