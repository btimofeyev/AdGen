// client/src/components/ImageGrid.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy } from "lucide-react";

const ImageGrid = ({ images, onDownload, onCopy, onModalOpen }) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  // If there are no images, show a placeholder message
  if (!images || images.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 w-full bg-soft-white rounded-xl border border-light-gray/30">
        <p className="text-charcoal/60 font-medium">No images generated yet</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {images.map((image, index) => (
        <motion.div 
          key={index}
          variants={itemVariants}
          className="relative group"
        >
          <div className="bg-white rounded-lg overflow-hidden shadow-sm border border-light-gray/40 hover:shadow-md transition-shadow">
            {/* Clickable image */}
            <div 
              className="relative aspect-square overflow-hidden cursor-pointer"
              onClick={() => !image.error && onModalOpen(image)}
            >
              {image.error ? (
                <div className="absolute inset-0 flex items-center justify-center bg-pastel-pink/10 p-3">
                  <p className="text-xs text-red-500">Error: {image.error}</p>
                </div>
              ) : (
                <img 
                  src={image.base64Image} 
                  alt={`Generated image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Action buttons at the bottom */}
            {!image.error && (
              <div className="flex justify-center p-2 gap-3 border-t border-light-gray/20">
                <button
                  onClick={() => onDownload(image.base64Image, index)}
                  className="w-10 h-8 flex items-center justify-center hover:bg-soft-white rounded-md transition-colors"
                  title="Download"
                >
                  <Download size={18} className="text-charcoal/70 hover:text-charcoal" />
                </button>
                
                <button
                  onClick={() => onCopy(image.base64Image, index)}
                  className="w-10 h-8 flex items-center justify-center hover:bg-soft-white rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy size={18} className="text-charcoal/70 hover:text-charcoal" />
                </button>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ImageGrid;