import React, { useState } from 'react';
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Textarea } from "./components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import { Label } from "./components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Loader2, Upload, Download, ImagePlus } from "lucide-react";

// API endpoint
const API_URL = 'http://localhost:5000/api';

function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState(null);
  const [error, setError] = useState(null);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload an image first');
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

      // Generate the ad
      const generateResponse = await fetch(`${API_URL}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filepath: uploadData.filepath,
          prompt,
          theme,
        }),
      });

      const generateData = await generateResponse.json();
      
      if (!generateResponse.ok) {
        throw new Error(generateData.error || 'Failed to generate image');
      }

      // Display the generated image
      setGeneratedImage(generateData.base64Image);
    } catch (err) {
      setError(err.message || 'An error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `ad-wizard-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Ad Wizard</h1>
          <p className="text-slate-600 mt-2">
            Transform your product images into engaging advertisements
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Upload & Customize</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="image">Product Image</Label>
                    <div 
                      className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors"
                      onClick={() => document.getElementById('image-upload').click()}
                    >
                      {preview ? (
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="max-h-48 object-contain mb-2" 
                        />
                      ) : (
                        <ImagePlus className="h-12 w-12 text-slate-400 mb-2" />
                      )}
                      <p className="text-sm text-slate-500">
                        {preview ? 'Click to change image' : 'Click to upload'}
                      </p>
                      <Input
                        id="image-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="prompt">Ad Description</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Describe your product and desired ad style..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </div>

                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="theme">Theme (Optional)</Label>
                    <Input
                      id="theme"
                      placeholder="e.g., Father's Day, Summer Sale, etc."
                      value={theme}
                      onChange={(e) => setTheme(e.target.value)}
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                      {error}
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || !file}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Generate Ad
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Generated Advertisement</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mb-2" />
                  <p>Creating your advertisement...</p>
                </div>
              ) : generatedImage ? (
                <div className="flex flex-col items-center">
                  <img 
                    src={generatedImage} 
                    alt="Generated Ad" 
                    className="max-w-full max-h-[400px] object-contain rounded-md" 
                  />
                  <Button 
                    onClick={handleDownload} 
                    className="mt-4"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              ) : (
                <div className="text-center text-slate-500">
                  <ImagePlus className="h-12 w-12 mx-auto mb-2 text-slate-300" />
                  <p>Your generated ad will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;