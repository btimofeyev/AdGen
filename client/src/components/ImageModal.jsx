// Enhanced ImageModal.jsx component with darker theme
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Share2, Clock, Trash2 } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, image, onDownload, onCopy, onDelete }) => {
  const modalRef = useRef(null);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Prevent body scrolling when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Re-enable scrolling when modal is closed
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  // Get expiration status styling with solid background
  const getExpirationStyle = (daysRemaining) => {
    if (!daysRemaining) return '';
    
    if (daysRemaining <= 1) {
      return 'bg-pastel-pink text-white shadow-lg'; 
    } else if (daysRemaining <= 3) {
      return 'bg-amber-500 text-white shadow-lg';
    } else {
      return 'bg-pastel-blue text-white shadow-lg';
    }
  };

  if (!isOpen || !image) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-5xl w-full bg-charcoal rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-charcoal/90 text-white shadow-lg hover:bg-charcoal/70 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </motion.button>
          
          <div className="grid md:grid-cols-5 gap-0">
            {/* Image display - takes up 3/5 of the space on desktop */}
            <div className="md:col-span-3 bg-black relative">
              <div className="overflow-hidden bg-black w-full h-full flex items-center justify-center">
                <img 
                  src={image.base64Image || image.src} 
                  alt={image.prompt || image.alt || "Generated image"} 
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
              
              {/* Expiration badge with solid background */}
              {image.daysRemaining !== undefined && (
                <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg border border-white/20 ${getExpirationStyle(image.daysRemaining)}`}>
                  <Clock size={14} className="mr-2" />
                  {image.expirationText || `Expires in ${image.daysRemaining} days`}
                </div>
              )}
            </div>
            
            {/* Image details and actions - takes up 2/5 of the space on desktop */}
            <div className="md:col-span-2 p-6 flex flex-col bg-charcoal">
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-white">
                  Image Details
                </h2>
                
                {/* Creation date */}
                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">
                    Created on
                  </h3>
                  <p className="text-white">
                    {new Date(image.created_at).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                
                {/* Prompt info */}
                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">
                    Prompt
                  </h3>
                  <p className="text-white bg-charcoal/60 p-3 rounded-lg border border-charcoal/30 text-sm break-words">
                    {image.prompt || "No prompt information available"}
                  </p>
                </div>
                
                {/* Expiration info */}
                {image.expires_at && (
                  <div className="mt-4">
                    <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">
                      Expiration
                    </h3>
                    <p className="text-white">
                      {new Date(image.expires_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {image.daysRemaining !== undefined && (
                      <p className="text-sm text-white/60 mt-1">
                        {image.daysRemaining <= 1 
                          ? "⚠️ Expiring soon! Make sure to download this image." 
                          : `This image will be automatically deleted after ${image.daysRemaining} days.`}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {/* Action buttons */}
              <div className="mt-6 pt-6 border-t border-charcoal/40">
                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onDownload(image.base64Image || image.src, image.id || 0)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-pastel-blue hover:bg-pastel-blue/90 text-charcoal rounded-lg font-medium shadow-sm transition-all"
                  >
                    <Download size={16} />
                    <span>Download</span>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onCopy(image.base64Image || image.src, image.id || 0)}
                    className="flex items-center justify-center gap-2 py-3 px-4 bg-charcoal/60 border border-charcoal/30 hover:border-pastel-blue/40 text-white/80 hover:text-white rounded-lg font-medium shadow-sm hover:shadow transition-all"
                  >
                    <Copy size={16} />
                    <span>Copy</span>
                  </motion.button>
                </div>
                
                {/* Delete button */}
                {onDelete && (
                  <motion.button
                    whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 165, 194, 0.3)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
                        onDelete(image.id);
                        onClose();
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 mt-3 w-full border border-pastel-pink/40 text-pastel-pink hover:text-pastel-pink rounded-lg font-medium transition-all"
                  >
                    <Trash2 size={16} />
                    <span>Delete Image</span>
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal;