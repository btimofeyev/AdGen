import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusCircle, FileUp, X, ArrowRight, ImagePlus, Home, User, Settings, LogOut } from 'lucide-react';
import { API_URL } from '../config';
import ImageModal from '../components/ImageModal';

function AdCreator() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [numImages, setNumImages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const promptInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (promptInputRef.current) {
      promptInputRef.current.focus();
    }
  }, []);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setGeneratedImages(Array.from({ length: numImages }, (_, i) => `/ads/ad${i + 1}.png`));
      setLoading(false);
    }, 1500);
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

  return (
    <div className="min-h-screen flex bg-soft-white text-charcoal">

      {/* Sidebar */}
      <div className="w-16 bg-white shadow flex flex-col items-center py-6 space-y-6 border-r border-light-gray/40">
        <div className="flex items-center justify-center rounded-full bg-pastel-blue/20 p-2">
          <ImagePlus size={20} className="text-pastel-blue" />
        </div>
        <SidebarIcon icon={<User size={20} />} />
        <SidebarIcon icon={<Home size={20} />} />
        <SidebarIcon icon={<Settings size={20} />} />
        <div className="mt-auto">
          <SidebarIcon icon={<LogOut size={20} />} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">

        {/* Header */}
        <header className="bg-white px-6 py-4 shadow flex items-center justify-between border-b border-light-gray/40">
          <h1 className="text-2xl font-extrabold">
            <span className="text-pastel-blue">SnapSceneAI</span> Studio
          </h1>
        </header>

        <div className="flex flex-1 overflow-hidden">

          {/* Center Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-10 overflow-y-auto">

            {/* Loading Skeleton */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {Array.from({ length: numImages }).map((_, idx) => (
                  <div key={idx} className="w-full h-64 bg-soft-white animate-pulse rounded-xl border border-light-gray/30" />
                ))}
              </div>
            ) : generatedImages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
                {generatedImages.map((img, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-xl overflow-hidden shadow hover:shadow-lg transition cursor-pointer border border-light-gray/40"
                  >
                    <img src={img} alt={`Visual ${idx + 1}`} className="w-full h-auto object-cover" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center p-4 bg-pastel-blue/20 rounded-full mb-4">
                  <ImagePlus size={32} className="text-pastel-blue" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Your First Scene</h3>
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

          {/* Right Sidebar */}
          <div className="w-80 p-6 bg-white border-l border-light-gray/40 overflow-y-auto">
            {/* Upload Thumbnail */}
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-3">Your Product</h2>
              {preview ? (
                <div className="relative rounded-xl overflow-hidden shadow border border-light-gray/40">
                  <img src={preview} alt="Uploaded" className="object-contain w-full h-36" />
                  <button
                    onClick={() => { setPreview(null); setFile(null); }}
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
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
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
              disabled={!prompt.trim()}
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal px-6 py-3 rounded-full font-bold shadow-md transition"
            >
              {loading ? '...' : 'Generate'}
            </button>
          </div>
        </form>

      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalOpen && (
          <ImageModal
            image={selectedImage}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarIcon({ icon }) {
  return (
    <button className="text-charcoal/70 hover:text-pastel-blue hover:bg-pastel-blue/10 p-3 rounded-xl transition">
      {icon}
    </button>
  );
}

export default AdCreator;