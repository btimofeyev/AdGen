// client/src/pages/AdCreator.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Download, Image as ImageIcon, Copy, ChevronDown, ChevronUp, Maximize2, X, AlertCircle } from "lucide-react"; // Added AlertCircle
import { API_URL } from '../config';
import ImageModal from '../components/ImageModal';

// Sample prompts (no changes needed here)
const SAMPLE_PROMPTS = {
  social: [
    "Create an Instagram post announcing our summer collection with a clean, minimalist aesthetic",
    "Design a vibrant social media post for our weekend flash sale with bold typography",
    "Make a LinkedIn announcement for our new product launch with a professional tone"
  ],
  email: [
    "Design an email header for our newsletter with a modern, airy feel",
    "Create a bold promotional email banner highlighting our 30% off sale",
    "Make an elegant email header for our premium customer appreciation message"
  ],
  ads: [
    "Design a Facebook ad for our fitness product with energetic visuals",
    "Create a clean, minimalist Google display ad for our tech product",
    "Generate a website banner ad with seasonal themes for our holiday promotion"
  ]
};


function AdCreator() {
  // State variables (no changes needed here)
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(3);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [activePromptCategory, setActivePromptCategory] = useState('social');
  const [showPrompts, setShowPrompts] = useState(true);
  const [uploadedFilePath, setUploadedFilePath] = useState(null);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const promptInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  // --- Handlers (Keep the same logic) ---
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

  const handleSamplePromptSelect = (samplePrompt) => {
    setPrompt(samplePrompt);
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

      const response = await fetch(`${API_URL}/generate/multiple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: currentFilepath, prompt, count: numImages })
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

  // --- Refined Neutral Apple-Inspired Styling ---

  return (
    // Neutral base: white background, dark text
    <div className="min-h-screen bg-white font-sans text-zinc-900">
      {/* Header: Lighter border, retain subtle blue for icon */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-30 border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <Link to="/" className="text-xl font-semibold flex items-center gap-2 text-zinc-900 hover:opacity-80 transition-opacity">
            {/* Keep blue isolated to the icon */}
            <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <span className="hidden sm:inline">Visual Creator</span>
             <span className="sm:hidden">VC</span> {/* Shorter name for mobile */}
          </Link>
          {/* Header actions could go here */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        {/* Page Title: Still large, but using neutral colors */}
        <div className="mb-16 md:mb-20 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-black">
            Generate Visual Content
          </h1>
          <p className="text-lg sm:text-xl text-zinc-600 max-w-3xl mx-auto">
            Bring your ideas to life. Create stunning visuals for social media, email campaigns, and ads with AI.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Left Column: Inputs - Focus on grays */}
          <div className="lg:col-span-5 space-y-8">

            {/* Inspiration Card: Neutral tones */}
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl shadow-sm overflow-hidden">
              <div
                className="flex justify-between items-center p-5 border-b border-zinc-200/90 cursor-pointer group"
                onClick={() => setShowPrompts(!showPrompts)}
              >
                <h2 className="text-lg font-medium text-zinc-900">Inspiration</h2>
                <button className="text-zinc-500 group-hover:text-zinc-800 transition-colors" aria-label={showPrompts ? "Hide prompts" : "Show prompts"}>
                  {showPrompts ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
              </div>

              <AnimatePresence>
                {showPrompts && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    {/* Tabs: Active state uses darker text/border, not blue */}
                    <div className="border-b border-zinc-200/90">
                      <div className="flex px-3 space-x-1">
                        {Object.keys(SAMPLE_PROMPTS).map((category) => (
                          <button
                            key={category}
                            className={`py-3 px-4 font-medium text-sm rounded-t-lg transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                              activePromptCategory === category
                                ? 'text-black font-semibold border-b-2 border-black' // Active: Black bold text + border
                                : 'text-zinc-600 hover:text-black hover:bg-zinc-100/70 focus-visible:ring-zinc-500' // Inactive: Gray text, black on hover
                            }`}
                            onClick={() => setActivePromptCategory(category)}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Sample Prompts List: Subtle gray hover */}
                    <div className="p-5 space-y-2.5 max-h-64 overflow-y-auto">
                      {SAMPLE_PROMPTS[activePromptCategory].map((promptText, index) => (
                        <div
                          key={index}
                          className="p-3.5 rounded-lg border border-transparent hover:border-zinc-200 hover:bg-zinc-100/80 cursor-pointer transition-all duration-150 text-sm text-zinc-700 hover:text-zinc-900"
                          onClick={() => handleSamplePromptSelect(promptText)}
                        >
                          {promptText}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Main Input Form Card: Lighter background */}
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl shadow-sm p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Image Upload Area: Neutral hover */}
                {preview ? (
                  <div className="relative group border border-zinc-200 rounded-xl p-3 bg-white">
                    <img src={preview} alt="Reference preview" className="max-h-48 w-auto object-contain rounded-lg mx-auto"/>
                    <button type="button" aria-label="Remove image"
                      className="absolute top-2.5 right-2.5 bg-black/5 backdrop-blur-sm rounded-full p-1.5 text-zinc-600 hover:text-black hover:bg-black/10 transition-all opacity-50 group-hover:opacity-100 focus:opacity-100"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); setUploadedFilePath(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <button type="button"
                    className="w-full flex flex-col items-center justify-center gap-2.5 py-8 px-4 border-2 border-dashed border-zinc-300/90 rounded-xl text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 bg-white hover:bg-zinc-100/50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 focus:ring-offset-zinc-50"
                    onClick={handleFileButtonClick}>
                    <ImageIcon size={28} className="mb-1" />
                    <span className="text-sm font-medium">Add Reference Image</span>
                    <span className="text-xs text-zinc-400">(Optional)</span>
                  </button>
                )}
                <input ref={fileInputRef} type="file" className="hidden" accept="image/*,.heic,.heif" onChange={handleFileChange} />

                {/* Number of Images: Subtle gray selection */}
                <div className="flex items-center justify-between py-2">
                  <label htmlFor="num-images-label" className="text-sm font-medium text-zinc-800">
                    Number of visuals:
                  </label>
                  <div id="num-images-label" className="flex items-center bg-zinc-200/70 rounded-lg p-1">
                    {[1, 2, 3, 4].map((num) => (
                      <button key={num} type="button"
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                          numImages === num
                            ? 'bg-white text-black shadow-sm' // Selected: White bg, black text
                            : 'text-zinc-600 hover:text-black focus-visible:ring-zinc-500' // Inactive: Gray text, black on hover/focus
                        }`}
                        onClick={() => setNumImages(num)}>
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error Message: Standard red, maybe less saturated */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      className="p-3.5 bg-red-50 border border-red-300/80 rounded-lg text-red-800 text-sm font-medium flex items-center gap-2">
                       <AlertCircle size={18} className="text-red-600 flex-shrink-0"/>
                       <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Prompt Input & Submit: Dark Submit Button */}
                <div className="flex items-center gap-3 pt-3">
                  <input ref={promptInputRef} type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 appearance-none rounded-full border border-zinc-300/90 px-5 py-3 text-base placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 bg-white" // Keep blue focus ring here for input clarity
                    placeholder="Describe the visual you want..." />
                  <button type="submit" aria-label="Generate visuals"
                    className={`flex-shrink-0 p-3 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-50 ${
                      loading || !prompt.trim()
                        ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' // Disabled: Light gray
                        : 'bg-black text-white hover:bg-zinc-800 active:bg-zinc-900 transform hover:scale-105 active:scale-100 focus:ring-black' // Active: Black/dark gray
                      }`}
                    disabled={loading || !prompt.trim()}>
                    {loading ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/50 border-t-white" /> // White spinner on dark bg
                    ) : (
                      <Send size={22} />
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column: Results Area - Clean neutral presentation */}
          <div className="lg:col-span-7">
            <div className="bg-zinc-50 border border-zinc-200/90 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
              <div className="flex justify-between items-center p-5 border-b border-zinc-200/90">
                <h2 className="text-lg font-medium text-zinc-900">
                  {generatedImages.length > 0 ? 'Generated Visuals' : 'Preview Area'}
                </h2>
                {generatedImages.length > 0 && (
                  <button type="button"
                    className="px-3.5 py-1.5 bg-zinc-200/70 text-zinc-700 rounded-lg text-sm font-medium hover:bg-zinc-300/70 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-500 focus:ring-offset-zinc-50"
                    onClick={handleReset}>
                    Start New
                  </button>
                )}
              </div>

              {/* Content Area: Neutral loading/empty states */}
              <div className="p-6 md:p-8 flex-grow">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-600 pt-10">
                    {/* Simple neutral spinner */}
                    <div className="relative w-8 h-8 mb-6">
                      <div className="absolute inset-0 border-4 border-zinc-200 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-t-zinc-600 rounded-full animate-spin"></div>
                    </div>
                    <h3 className="text-xl font-medium text-zinc-900">Generating...</h3>
                    <p className="text-base mt-1">Your visuals are being created.</p>
                  </div>
                ) : generatedImages.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {generatedImages.map((item, index) => (
                      // Card for each image
                      <div key={`img-${index}`} className="border border-zinc-200/80 rounded-xl overflow-hidden bg-white flex flex-col group transition-shadow duration-200 hover:shadow-lg">
                         <div className="p-2">
                           {item.error ? (
                            <div className="aspect-video flex flex-col items-center justify-center bg-red-50/80 p-4 rounded-lg text-red-800 text-sm border border-red-200/80">
                               <AlertCircle size={24} className="mb-2 text-red-600"/>
                               <p className="font-medium text-center">Error generating visual</p>
                               <p className="text-xs text-center mt-1">{item.error}</p>
                             </div>
                           ) : (
                             <div className="relative aspect-video rounded-lg overflow-hidden cursor-pointer shadow-inner shadow-black/5" onClick={() => handleImageClick(item, index)}>
                               <img src={item.base64Image} alt={`Generated ${item.format || item.theme || `visual ${index + 1}`}`} className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105" loading="lazy"/>
                               <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-2">
                                 <button aria-label="Enlarge image" className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-zinc-800 shadow-md hover:scale-110 transition-transform" onClick={(e) => { e.stopPropagation(); handleImageClick(item, index); }}>
                                   <Maximize2 size={18} />
                                 </button>
                               </div>
                             </div>
                           )}
                         </div>
                         <div className="p-3 pt-2 flex flex-col flex-grow">
                            <div className="flex justify-between items-start mb-2 flex-grow min-h-[40px]"> {/* Ensure minimum height */}
                              <span className="text-sm font-medium text-zinc-900 leading-snug line-clamp-2">{item.format || item.theme || `Visual Result`}</span>
                              <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full text-zinc-600 font-semibold flex-shrink-0 ml-2 mt-0.5">#{index + 1}</span>
                            </div>
                           {!item.error && (
                             <div className="flex mt-auto pt-2 border-t border-zinc-200/70 -mx-3 -mb-3 px-2 pb-2 bg-zinc-50/50">
                               {/* Action buttons: cleaner style */}
                               <button type="button" className="flex-1 flex justify-center items-center gap-1.5 py-2 px-1 text-sm font-medium text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition-colors focus:outline-none focus-visible:bg-zinc-100" onClick={() => handleDownload(item.base64Image, index)}>
                                 <Download size={16} /> <span>Download</span>
                               </button>
                               <div className="w-px bg-zinc-200/90 mx-1 my-1"></div> {/* Slightly darker separator */}
                               <button type="button" className="flex-1 flex justify-center items-center gap-1.5 py-2 px-1 text-sm font-medium text-zinc-700 hover:text-black hover:bg-zinc-100 rounded-md transition-colors focus:outline-none focus-visible:bg-zinc-100" onClick={() => handleCopyImage(item.base64Image, index)}>
                                 <Copy size={16} /> <span>Copy</span>
                               </button>
                             </div>
                           )}
                         </div>
                       </div>
                    ))}
                  </div>
                ) : (
                  // Empty State: Neutral icon, clearer text
                  <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 pt-10 pb-16">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 flex items-center justify-center mb-8 text-zinc-400">
                      <ImageIcon size={40} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-xl font-semibold text-zinc-900 mb-2">Your visuals will appear here</h3>
                    <p className="max-w-sm mx-auto text-base text-zinc-600">
                      Describe your idea, add an optional image, and click the arrow to generate.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer: Cleaner separation */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 mt-20 md:mt-28 border-t border-zinc-200">
        <div className="max-w-7xl mx-auto text-center text-zinc-500 text-sm">
          <p>© {new Date().getFullYear()} Visual Creator. Powered by AI.</p>
        </div>
      </footer>

      {/* Image Modal (Needs styling consistent with this neutral theme) */}
      <ImageModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        image={selectedImage || { src: '', alt: '', title: '' }}
        onDownload={() => selectedImage && handleDownload(selectedImage.src, selectedImage.index)}
        onCopy={() => selectedImage && handleCopyImage(selectedImage.src, selectedImage.index)}
        // Pass neutral colors if possible: e.g., accentColor="black" or buttonBg="zinc-200"
      />
    </div>
  );
}

export default AdCreator;