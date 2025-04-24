// client/src/pages/AdCreator.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { 
  Loader2, Download, ImagePlus, Sparkles, ArrowRight, ArrowLeft,
  Camera, Image, Star, Zap, CheckCircle2, PencilLine
} from "lucide-react";
import { Link } from 'react-router-dom';

// API endpoint
const API_URL = 'http://localhost:5000/api';

// Prompt ideas (simplified)
const PROMPT_IDEAS = [
  {
    title: "Instagram Post",
    description: "Create a stylish social media post for Instagram",
    icon: <Image className="h-5 w-5" />,
    color: "bg-gradient-to-r from-pink-500 to-purple-500"
  },
  {
    title: "Product Showcase",
    description: "Display your product with clean details and features",
    icon: <Camera className="h-5 w-5" />,
    color: "bg-gradient-to-r from-blue-500 to-cyan-500"
  },
  {
    title: "Sale Promotion",
    description: "Announce a special offer or limited-time sale",
    icon: <Zap className="h-5 w-5" />,
    color: "bg-gradient-to-r from-orange-500 to-red-500"
  },
  {
    title: "Lifestyle Shot",
    description: "Show your product in a real-life context or setting",
    icon: <Star className="h-5 w-5" />,
    color: "bg-gradient-to-r from-green-500 to-teal-500"
  }
];

// Visual styles
const VISUAL_STYLES = [
  {
    name: "Minimalist",
    description: "Clean, simple design with lots of white space",
    color: "bg-slate-100"
  },
  {
    name: "Vibrant",
    description: "Bold colors and eye-catching elements",
    color: "bg-gradient-to-r from-pink-400 to-orange-400"
  },
  {
    name: "Elegant",
    description: "Sophisticated design with premium feel",
    color: "bg-gradient-to-r from-slate-700 to-slate-900"
  },
  {
    name: "Playful",
    description: "Fun and energetic design elements",
    color: "bg-gradient-to-r from-purple-400 to-blue-400"
  }
];

function AdCreator() {
  // State variables
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [selectedPromptIdea, setSelectedPromptIdea] = useState(null);
  const [visualStyle, setVisualStyle] = useState(null);
  const [customText, setCustomText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Handle file upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  // Handle prompt idea selection
  const handlePromptIdeaClick = (idea) => {
    setSelectedPromptIdea(idea);
    // Auto-set the prompt based on the idea title
    setPrompt(`Create a ${idea.title.toLowerCase()} featuring my product`);
  };

  // Handle visual style selection
  const handleStyleClick = (style) => {
    setVisualStyle(style);
    
    // Update the prompt to include the style
    let basePrompt = prompt;
    // Remove any previous style mentions
    const styleRegex = /\. Style: ([^.]+)/;
    if (styleRegex.test(basePrompt)) {
      basePrompt = basePrompt.replace(styleRegex, '');
    }
    
    setPrompt(`${basePrompt.trim()}. Style: ${style.name}`);
  };

  // Navigation between steps
  const goToNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload an image first');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      setError('Please enter a prompt or select an idea');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload the image
      const formData = new FormData();
      formData.append('image', file);

      const uploadResponse = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadResponse.json();
      
      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || 'Failed to upload image');
      }

      // Generate the ad with the user's prompt
      const finalPrompt = prompt + (customText ? `. ${customText}` : '');
      console.log('Sending data to backend:');
      console.log('- Prompt:', finalPrompt);
      console.log('- Filepath:', uploadData.filepath);
      console.log('- Style:', visualStyle?.name || 'Default');
      
      const generateResponse = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: uploadData.filepath,
          prompt: finalPrompt,
          theme: visualStyle?.name || '',
        }),
      });

      const generateData = await generateResponse.json();
      
      if (!generateResponse.ok) {
        throw new Error(generateData.error || 'Failed to generate image');
      }

      // Display the generated image
      setGeneratedImage(generateData.base64Image);
      setCurrentStep(4); // Move to the final step
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle image download
  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `adripple-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Check if can proceed to next step
  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1: return !!file;
      case 2: return !!selectedPromptIdea || !!prompt;
      case 3: return true; // Visual style is optional
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tracking-tight">
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Create Amazing Visuals
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Transform your product images in just a few easy steps
          </p>
        </motion.div>

        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex justify-between items-center max-w-md mx-auto">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div 
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold mb-1
                    ${currentStep === step 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : currentStep > step 
                        ? 'bg-green-500 text-white'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                >
                  {currentStep > step ? <CheckCircle2 className="h-5 w-5" /> : step}
                </div>
                <span className={`text-xs ${currentStep === step ? 'text-blue-600 font-medium' : 'text-slate-500'}`}>
                  {step === 1 ? 'Upload' : 
                   step === 2 ? 'Choose Idea' : 
                   step === 3 ? 'Style' : 'Create'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main container */}
        <Card className="overflow-visible border-0 rounded-3xl shadow-xl bg-white mb-8">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row min-h-[650px]">
              {/* Left side - steps */}
              <div className="md:w-3/5 p-6 md:p-8 overflow-y-auto max-h-[650px]">
                {/* Always visible prompt editor */}
                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor="prompt" className="text-sm font-medium text-slate-700 flex items-center">
                      <PencilLine className="h-4 w-4 mr-1 text-blue-500" />
                      Your Prompt
                    </Label>
                    
                    {/* Quick Generate button */}
                    <Button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={loading || !file || !prompt}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3 mr-1" />
                          Quick Generate
                        </>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe what you want to create..."
                    className="min-h-[80px] resize-none bg-white border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Edit this prompt directly or use the guided process below
                  </p>
                </div>

                <AnimatePresence mode="wait">
                  {/* Step 1: Upload Image */}
                  {currentStep === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardTitle className="text-2xl font-bold mb-6">
                        <span className="text-blue-600 mr-2">1.</span> Upload Your Image
                      </CardTitle>
                      
                      <div className="space-y-4">
                        <motion.div 
                          className="border-2 border-dashed border-blue-200 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50/30 transition-colors"
                          onClick={() => document.getElementById('image-upload').click()}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        >
                          {preview ? (
                            <motion.div
                              className="relative rounded-2xl overflow-hidden shadow-md"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.4 }}
                            >
                              <img 
                                src={preview} 
                                alt="Preview" 
                                className="max-h-64 object-contain" 
                              />
                            </motion.div>
                          ) : (
                            <div className="bg-blue-100/50 w-32 h-32 rounded-full flex items-center justify-center">
                              <ImagePlus className="h-12 w-12 text-blue-400" />
                            </div>
                          )}
                          <p className="text-blue-600 font-semibold mt-6 mb-1">
                            {preview ? 'Change image' : 'Upload product image'}
                          </p>
                          <p className="text-sm text-slate-500">
                            Drag & drop or click to select
                          </p>
                          <Input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </motion.div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Choose Prompt Idea */}
                  {currentStep === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardTitle className="text-2xl font-bold mb-6">
                        <span className="text-blue-600 mr-2">2.</span> Choose an Idea
                      </CardTitle>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {PROMPT_IDEAS.map((idea, index) => (
                            <motion.div
                              key={idea.title}
                              className={`p-5 rounded-2xl cursor-pointer transition-all ${
                                selectedPromptIdea?.title === idea.title
                                  ? 'ring-2 ring-blue-500 shadow-lg'
                                  : 'border border-slate-200 hover:border-blue-200 hover:shadow-md'
                              }`}
                              onClick={() => handlePromptIdeaClick(idea)}
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0,
                                transition: { delay: index * 0.1 }
                              }}
                            >
                              <div className="flex items-start">
                                <div className={`h-10 w-10 rounded-xl ${idea.color} flex items-center justify-center mr-3 text-white`}>
                                  {idea.icon}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-800 mb-1">{idea.title}</h3>
                                  <p className="text-sm text-slate-500">{idea.description}</p>
                                </div>
                                
                                {selectedPromptIdea?.title === idea.title && (
                                  <div className="ml-auto">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="text-center text-sm text-slate-500 mt-4">
                          <p>Select an idea or use your own prompt above</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Choose Visual Style */}
                  {currentStep === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardTitle className="text-2xl font-bold mb-6">
                        <span className="text-blue-600 mr-2">3.</span> Choose a Style
                      </CardTitle>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {VISUAL_STYLES.map((style, index) => (
                            <motion.div
                              key={style.name}
                              className={`p-5 rounded-2xl cursor-pointer transition-all ${
                                visualStyle?.name === style.name
                                  ? 'ring-2 ring-blue-500 shadow-lg'
                                  : 'border border-slate-200 hover:border-blue-200 hover:shadow-md'
                              }`}
                              onClick={() => handleStyleClick(style)}
                              whileHover={{ y: -5 }}
                              whileTap={{ scale: 0.98 }}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ 
                                opacity: 1, 
                                y: 0, 
                                transition: { delay: index * 0.1 }
                              }}
                            >
                              <div className="flex items-start">
                                <div className={`h-10 w-10 rounded-xl ${style.color} flex items-center justify-center mr-3 text-white`}>
                                  <span className="font-bold text-sm">{style.name.charAt(0)}</span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-slate-800 mb-1">{style.name}</h3>
                                  <p className="text-sm text-slate-500">{style.description}</p>
                                </div>
                                
                                {visualStyle?.name === style.name && (
                                  <div className="ml-auto">
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        <div className="mt-6">
                          <Label htmlFor="customText" className="font-medium text-slate-700 mb-2 block">
                            Additional Details (Optional)
                          </Label>
                          <Textarea
                            id="customText"
                            placeholder="Add any specific details you'd like (colors, mood, elements, etc.)"
                            value={customText}
                            onChange={(e) => setCustomText(e.target.value)}
                            className="min-h-[80px] bg-white border-slate-200 rounded-xl focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Review & Generate */}
                  {currentStep === 4 && (
                    <motion.div
                      key="step4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardTitle className="text-2xl font-bold mb-6">
                        <span className="text-blue-600 mr-2">4.</span> Your Creation
                      </CardTitle>
                      
                      <div className="space-y-4">
                        {!generatedImage ? (
                          <>
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                              <h3 className="font-semibold text-slate-800 mb-3">Review Your Selections</h3>
                              
                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <div className="w-24 text-sm text-slate-500">Image:</div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {file ? file.name : 'None selected'}
                                  </div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-24 text-sm text-slate-500">Type:</div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {selectedPromptIdea?.title || 'Custom prompt'}
                                  </div>
                                </div>
                                
                                <div className="flex items-center">
                                  <div className="w-24 text-sm text-slate-500">Style:</div>
                                  <div className="text-sm font-medium text-slate-700">
                                    {visualStyle?.name || 'Default'}
                                  </div>
                                </div>
                                
                                {customText && (
                                  <div className="flex items-start">
                                    <div className="w-24 text-sm text-slate-500">Details:</div>
                                    <div className="text-sm font-medium text-slate-700">
                                      {customText}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Error display */}
                            {error && (
                              <motion.div 
                                className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <p>{error}</p>
                              </motion.div>
                            )}

                            {/* Generate button */}
                            <motion.div
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Button 
                                onClick={handleSubmit} 
                                className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md text-base font-semibold"
                                disabled={loading}
                              >
                                {loading ? (
                                  <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Creating Your Visual...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="mr-2 h-5 w-5" />
                                    Create My Visual
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center mt-4 md:hidden">
                            <p className="text-slate-700 mb-4 text-center">
                              Your image has been created successfully!
                            </p>
                            <Button 
                              onClick={handleDownload} 
                              className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </Button>
                            
                            <Button
                              onClick={() => {
                                setGeneratedImage(null);
                                setCurrentStep(1);
                              }}
                              variant="outline"
                              className="mt-3"
                            >
                              Create Another
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    variant="outline"
                    className={`flex items-center ${currentStep === 1 || (currentStep === 4 && generatedImage) ? 'invisible' : ''}`}
                    onClick={goToPreviousStep}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  
                  {currentStep < 4 && (
                    <Button
                      type="button"
                      className="flex items-center"
                      onClick={goToNextStep}
                      disabled={!canProceedToNextStep()}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Right side - preview */}
              <div className="md:w-2/5 bg-gradient-to-b from-slate-50 to-slate-100 p-6 flex flex-col rounded-r-3xl">
                <CardTitle className="text-lg font-semibold mb-4">Preview</CardTitle>
                
                <div className="flex-grow flex flex-col items-center justify-center">
                  {loading ? (
                    <motion.div 
                      className="flex flex-col items-center justify-center text-center"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <div className="relative mb-6">
                        <div className="h-14 w-14 rounded-full bg-blue-100 flex items-center justify-center">
                          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                        </div>
                      </div>
                      <h3 className="text-lg font-medium mb-2 text-slate-800">Creating Magic...</h3>
                      <p className="text-sm text-slate-500 max-w-[200px]">
                        Transforming your product into something amazing
                      </p>
                    </motion.div>
                  ) : generatedImage ? (
                    <motion.div 
                      className="flex flex-col items-center text-center"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5 }}
                    >
                      <motion.div
                        className="relative rounded-xl overflow-hidden shadow-md border border-slate-200 mb-4"
                        whileHover={{ scale: 1.03 }}
                        transition={{ type: "spring", stiffness: 300, damping: 10 }}
                      >
                        <img 
                          src={generatedImage} 
                          alt="Generated Visual" 
                          className="max-w-full w-full max-h-[350px] object-contain bg-white" 
                        />
                      </motion.div>
                      
                      <div className="hidden md:flex flex-col items-center mt-4">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="mb-4"
                        >
                          <Button 
                            onClick={handleDownload} 
                            className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </motion.div>
                        
                        <Button
                          onClick={() => {
                            setGeneratedImage(null);
                            setCurrentStep(1);
                          }}
                          variant="outline"
                        >
                          Create Another
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      {preview ? (
                        <div className="relative rounded-xl overflow-hidden shadow-md border border-slate-200 mb-4">
                          <img 
                            src={preview} 
                            alt="Product" 
                            className="max-w-full max-h-[200px] object-contain bg-white" 
                          />
                        </div>
                      ) : (
                        <div className="bg-white w-24 h-24 rounded-full flex items-center justify-center mb-4 border border-slate-200">
                          <ImagePlus className="h-8 w-8 text-slate-300" />
                        </div>
                      )}
                      <h3 className="text-lg font-medium mb-2 text-slate-600">
                        {currentStep === 1 ? "Upload an image to start" :
                         currentStep === 2 ? "Choose a prompt idea" :
                         currentStep === 3 ? "Select a visual style" :
                         "Ready to create!"}
                      </h3>
                      <p className="text-sm text-slate-500 max-w-[200px]">
                        Follow the steps or use Quick Generate above
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Return to home link */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link to="/">
              <Button 
                variant="link" 
                className="text-slate-500 hover:text-blue-600 flex items-center transition-colors"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Return to Home
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }
  
  export default AdCreator;