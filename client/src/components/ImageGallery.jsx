// client/src/components/ImageGallery.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Copy } from "lucide-react";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Button } from "./ui/button";

const ImageGallery = ({ images, onDownload }) => {
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
      const link = document.createElement('a');
      link.href = imageBase64;
      link.download = `ad-wizard-${index}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[700px] overflow-y-auto pr-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {images.map((item, index) => (
        <motion.div key={index} variants={item}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow rounded-xl border border-slate-200">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700 truncate">{item.theme}</h3>
                {item.format && (
                  <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                    {item.format}
                  </span>
                )}
              </div>
              
              {item.error ? (
                <div className="bg-red-50 text-red-500 p-3 rounded-md text-xs">
                  Error: {item.error}
                </div>
              ) : (
                <div className="relative group">
                  <img 
                    src={item.base64Image} 
                    alt={`${item.theme} advertisement`} 
                    className="w-full h-48 object-contain rounded-md bg-slate-50"
                  />
                  
                  {/* Quick action buttons on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => onDownload(item.base64Image, index)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="bg-white/90 hover:bg-white"
                        onClick={() => handleCopyImage(item.base64Image, index)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            
            {!item.error && (
              <CardFooter className="p-3 pt-0 flex justify-between">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => onDownload(item.base64Image, index)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => handleCopyImage(item.base64Image, index)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              </CardFooter>
            )}
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ImageGallery;