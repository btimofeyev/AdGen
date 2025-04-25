// client/src/pages/AdCreator.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Sample prompts for inspiration
const SAMPLE_PROMPTS = [
  "Create a sleek, minimalist ad for my product with a clean white background and bold typography",
  "Make a colorful, eye-catching ad that showcases my product with a playful design",
  "Design a professional ad with elegant styling that highlights the premium quality of my product",
  "Generate a summer-themed promotional ad featuring my product with bright colors"
];

function AdCreator() {
  // State variables
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [error, setError] = useState(null);
  
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

  // Handle sample prompt selection
  const handleSamplePromptSelect = (samplePrompt) => {
    setPrompt(samplePrompt);
  };

  // Handle image download
  const handleDownload = (imageData, index) => {
    const link = document.createElement('a');
    link.href = imageData;
    link.download = `ad-wizard-${index}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please upload a product image first');
      return;
    }

    if (!prompt || prompt.trim() === '') {
      setError('Please enter a description of what you want to create');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Generate a few variations based on the prompt
      // For simplicity, we'll simulate this with mock data
      // In a real implementation, you would call your API here
      
      // Simulated delay and response
      setTimeout(() => {
        // Dummy response simulating successful generation
        setGeneratedImages([
          {
            theme: 'Variation 1',
            base64Image: preview, // Just using the preview as a placeholder
            error: null
          },
          {
            theme: 'Variation 2',
            base64Image: preview,
            error: null
          },
          {
            theme: 'Variation 3',
            base64Image: preview,
            error: null
          },
          {
            theme: 'Variation 4',
            base64Image: preview,
            error: null
          }
        ]);
        setLoading(false);
      }, 2000);

    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error(err);
      setLoading(false);
    }
  };

  // Reset the form
  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setPrompt('');
    setGeneratedImages([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b shadow-sm py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            Ad Wizard
          </Link>
          <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link>
        </div>
      </header>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-2">
          Create Amazing Ads
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Transform your product images into professional advertisements
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Input form */}
          <div className="lg:col-span-1">
            <div className="bg-white border rounded-lg shadow-sm p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload section */}
                <div>
                  <label htmlFor="product-image" className="block text-sm font-medium mb-2 text-gray-700">
                    Product Image
                  </label>
                  
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-50"
                    onClick={() => document.getElementById('product-image').click()}
                  >
                    {preview ? (
                      <div className="relative">
                        <img 
                          src={preview} 
                          alt="Product preview" 
                          className="max-h-40 object-contain mx-auto rounded" 
                        />
                        <button
                          type="button"
                          className="absolute top-1 right-1 bg-white rounded-full p-1 shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                            setPreview(null);
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-blue-600 font-medium">Upload product image</p>
                        <p className="text-xs text-gray-500 mt-1">Click or drag & drop</p>
                      </div>
                    )}
                    <input
                      id="product-image"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                
                {/* Prompt */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700">
                      Describe what you want
                    </label>
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:text-blue-800"
                      onClick={() => document.getElementById('prompt-ideas').scrollIntoView({ behavior: 'smooth' })}
                    >
                      Get inspiration
                    </button>
                  </div>
                  <textarea
                    id="prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe the ad you want to create..."
                  />
                </div>

                {/* Sample prompts */}
                <div id="prompt-ideas" className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Prompt Ideas:</h3>
                  <div className="space-y-2">
                    {SAMPLE_PROMPTS.map((samplePrompt, index) => (
                      <div
                        key={index}
                        className="bg-white border border-gray-200 rounded-md p-2 text-sm cursor-pointer hover:bg-blue-50 hover:border-blue-200"
                        onClick={() => handleSamplePromptSelect(samplePrompt)}
                      >
                        {samplePrompt}
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Error display */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {/* Submit button */}
                <button 
                  type="submit" 
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition-colors"
                  disabled={loading || !file || !prompt}
                  style={{ opacity: loading || !file || !prompt ? 0.5 : 1 }}
                >
                  {loading ? 'Generating Ads...' : 'Generate Ads'}
                </button>
              </form>
            </div>
          </div>
          
          {/* Right column - Results */}
          <div className="lg:col-span-2">
            <div className="bg-white border rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {generatedImages.length > 0 ? 'Your Generated Ads' : 'Ad Preview'}
                </h2>
                
                {generatedImages.length > 0 && (
                  <button
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    onClick={handleReset}
                  >
                    Create New
                  </button>
                )}
              </div>
              
              {generatedImages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {generatedImages.map((item, index) => (
                    <div key={index} className="border rounded-lg overflow-hidden">
                      <div className="p-3">
                        <h3 className="font-medium mb-2">{item.theme}</h3>
                        <img 
                          src={item.base64Image} 
                          alt={`${item.theme}`} 
                          className="w-full object-contain rounded bg-gray-50 h-48"
                        />
                      </div>
                      <div className="p-3 pt-0 border-t mt-3">
                        <button 
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          onClick={() => handleDownload(item.base64Image, index)}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16">
                  {loading ? (
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <h3 className="text-lg font-medium text-gray-700">Creating Your Ads</h3>
                      <p className="text-gray-500 mt-2">This may take a moment...</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="bg-gray-100 p-8 rounded-lg mb-6 w-full max-w-md">
                        <h3 className="text-lg font-medium text-gray-700 mb-2">Your ads will appear here</h3>
                        <p className="text-gray-500 text-sm">
                          Upload a product image and describe what you want
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <footer className="bg-gray-50 border-t py-8 px-6 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-600">© 2025 Ad Wizard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default AdCreator;