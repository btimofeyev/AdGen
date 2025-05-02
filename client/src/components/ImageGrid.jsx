// Updated ImageGrid with external selection state
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Trash2, Clock, Eye, ImageIcon, Check, CheckSquare } from "lucide-react";

const ImageGrid = ({ 
  images, 
  onDownload, 
  onCopy, 
  onModalOpen, 
  onDelete,
  selectedImages = {}, // Now passed from parent
  setSelectedImages = () => {} // Now passed from parent
}) => {
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  
  // Animation variants for container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  // Animation variants for grid items
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        damping: 15, 
        stiffness: 200
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -20,
      transition: { duration: 0.2 }
    }
  };

  // Toggle image selection
  const toggleImageSelection = (imageId, e) => {
    e.stopPropagation(); // Prevent opening the modal
    setSelectedImages(prev => ({
      ...prev,
      [imageId]: !prev[imageId]
    }));
  };

  // Handle delete with confirmation for a single image
  const handleDelete = (image) => {
    console.log('Delete button clicked for image:', image.id);
    
    if (deletingId === image.id) {
      // Confirm delete - log action and call parent handler
      console.log('Confirming delete for image:', image.id);
      onDelete(image.id);
      setDeletingId(null);
    } else {
      // Set this image as deleting, asking for confirmation
      console.log('First click on delete for image:', image.id);
      setDeletingId(image.id);
      
      // Auto-reset after 3 seconds
      setTimeout(() => {
        setDeletingId(null);
      }, 3000);
    }
  };

  // Get expiration status styling - Smaller badge
  const getExpirationStyle = (daysRemaining) => {
    if (daysRemaining <= 1) {
      return 'bg-pastel-pink text-white border border-pastel-pink/40'; 
    } else if (daysRemaining <= 3) {
      return 'bg-amber-500 text-white border border-amber-600/30';
    } else {
      return 'bg-pastel-blue text-white border border-pastel-blue/40';
    }
  };

  // If there are no images, show a styled placeholder message
  if (!images || images.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 w-full bg-background rounded-xl border border-border shadow-sm"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-background p-4 rounded-full mb-4"
        >
          <ImageIcon size={32} className="text-pastel-blue opacity-60" />
        </motion.div>
        <p className="text-charcoal/60 dark:text-gray-400 font-medium">No images generated yet</p>
        <p className="text-charcoal/40 dark:text-gray-500 text-sm mt-2">Create your first image to see it here</p>
      </motion.div>
    );
  }

  return (
    <div className="w-full">      
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <AnimatePresence mode="popLayout">
          {images.map((image, index) => (
            <motion.div 
              key={image.id || `img-${index}`}
              variants={itemVariants}
              layout
              exit="exit"
              onHoverStart={() => setHoveredId(image.id)}
              onHoverEnd={() => setHoveredId(null)}
              className="relative group"
            >
              <motion.div 
                className={`bg-background rounded-xl overflow-hidden shadow-sm border transition-all ${
                  selectedImages[image.id] 
                    ? 'border-pastel-blue shadow-md' 
                    : 'border-border hover:shadow-md'
                }`}
                whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
              >
                {/* Clickable image - with fixed aspect ratio container */}
                <div 
                  className="relative aspect-square overflow-hidden cursor-pointer"
                  onClick={() => {
                    if (Object.values(selectedImages).some(v => v) && !image.error) {
                      toggleImageSelection(image.id, { stopPropagation: () => {} });
                    } else if (!image.error) {
                      onModalOpen(image);
                    }
                  }}
                >
                  {image.error ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-pastel-pink/10 dark:bg-pastel-pink/20 p-3">
                      <p className="text-xs text-red-500">Error: {image.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Image with object-fit: cover to maintain aspect ratio while filling container */}
                      <img 
                        src={image.base64Image} 
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-full object-cover object-center transition-transform duration-300"
                      />
                      
                      {/* Overlay on hover */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        initial={false}
                        animate={{ opacity: hoveredId === image.id ? 1 : 0 }}
                      >
                        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-center">
                          <motion.button
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ 
                              scale: hoveredId === image.id ? 1 : 0.8, 
                              opacity: hoveredId === image.id ? 1 : 0 
                            }}
                            transition={{ delay: 0.1 }}
                            className="bg-white/90 dark:bg-[#23262F]/90 hover:bg-white dark:hover:bg-[#23262F] text-charcoal dark:text-white rounded-full p-2 mr-2 shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              onModalOpen(image);
                            }}
                          >
                            <Eye size={18} />
                          </motion.button>
                        </div>
                      </motion.div>
                      
                      {/* SMALLER Expiration badge */}
                      {image.daysRemaining !== undefined && (
                        <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center shadow-sm backdrop-blur-sm ${getExpirationStyle(image.daysRemaining)}`}>
                          <Clock size={10} className="mr-1" />
                          <span className="text-[10px]">{image.daysRemaining}d</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Image details section */}
                <div className="px-4 py-3 border-t border-border">
                  <h3 className="text-sm font-medium text-charcoal dark:text-white truncate">
                    {image.prompt || "Generated Image"}
                  </h3>
                  <p className="text-xs text-charcoal/50 dark:text-gray-400 mt-1">
                    {new Date(image.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Action buttons at the bottom - now includes selection */}
                {!image.error && (
                  <div className="flex justify-between p-3 pt-0 gap-2">
                    <div className="flex space-x-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDownload(image.base64Image, index)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-soft-white dark:hover:bg-[#23262F] rounded-md transition-colors"
                        title="Download"
                      >
                        <Download size={16} className="text-charcoal/70 dark:text-white hover:text-charcoal dark:hover:text-pastel-blue" />
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onCopy(image.base64Image, index)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-soft-white dark:hover:bg-[#23262F] rounded-md transition-colors"
                        title="Copy"
                      >
                        <Copy size={16} className="text-charcoal/70 dark:text-white hover:text-charcoal dark:hover:text-pastel-blue" />
                      </motion.button>
                      
                      {/* New selection button in the action row */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => toggleImageSelection(image.id, e)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                          selectedImages[image.id]
                            ? 'bg-pastel-blue text-white'
                            : 'hover:bg-soft-white dark:hover:bg-[#23262F] text-charcoal/70 dark:text-white hover:text-charcoal dark:hover:text-pastel-blue'
                        }`}
                        title="Select"
                      >
                        {selectedImages[image.id] ? (
                          <CheckSquare size={16} className="text-white" />
                        ) : (
                          <CheckSquare size={16} className="text-charcoal/70 dark:text-white hover:text-charcoal dark:hover:text-pastel-blue" />
                        )}
                      </motion.button>
                    </div>

                    {onDelete && (
                      <motion.button
                        whileHover={{ scale: deletingId === image.id ? 1 : 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(image)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md transition-all ${
                          deletingId === image.id 
                            ? 'bg-pastel-pink text-white animate-pulse' 
                            : 'hover:bg-soft-white dark:hover:bg-[#23262F] text-charcoal/70 dark:text-white hover:text-pastel-pink dark:hover:text-pastel-pink'
                        }`}
                        title={deletingId === image.id ? "Click again to confirm deletion" : "Delete"}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    )}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ImageGrid;