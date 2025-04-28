// client/src/components/ImageGrid.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Trash2 } from "lucide-react";

const ImageGrid = ({ images, onDownload, onCopy, onModalOpen, onDelete }) => {
  const [deletingId, setDeletingId] = useState(null);

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

  // Handle delete with confirmation
  const handleDelete = (image) => {
    if (deletingId === image.id) {
      // Confirm delete
      onDelete(image.id);
      setDeletingId(null);
    } else {
      // Set this image as deleting, asking for confirmation
      setDeletingId(image.id);
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setDeletingId(null);
      }, 3000);
    }
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
          key={image.id || index}
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
              <div className="flex justify-between p-2 gap-1 border-t border-light-gray/20">
                <button
                  onClick={() => onDownload(image.base64Image, index)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-soft-white rounded-md transition-colors"
                  title="Download"
                >
                  <Download size={16} className="text-charcoal/70 hover:text-charcoal" />
                </button>
                
                <button
                  onClick={() => onCopy(image.base64Image, index)}
                  className="w-8 h-8 flex items-center justify-center hover:bg-soft-white rounded-md transition-colors"
                  title="Copy"
                >
                  <Copy size={16} className="text-charcoal/70 hover:text-charcoal" />
                </button>

                {onDelete && (
                  <button
                    onClick={() => handleDelete(image)}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors
                      ${deletingId === image.id 
                        ? 'bg-pastel-pink/20 text-pastel-pink animate-pulse' 
                        : 'hover:bg-soft-white text-charcoal/70 hover:text-pastel-pink'}`}
                    title={deletingId === image.id ? "Click again to confirm deletion" : "Delete"}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ImageGrid;