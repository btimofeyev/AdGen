// client/src/components/ImageModal.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Share2 } from 'lucide-react';

const ImageModal = ({ isOpen, onClose, image, onDownload, onCopy }) => {
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

  if (!isOpen || !image) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-4xl w-full bg-white rounded-xl shadow-2xl overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          
          {/* Image display */}
          <div className="bg-soft-white p-4">
            <div className="overflow-hidden bg-gray-100 rounded-lg">
              <img 
                src={image.base64Image || image.src} 
                alt={image.theme || image.alt || "Generated image"} 
                className="w-full object-contain max-h-[70vh]"
              />
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="p-4 flex items-center justify-center gap-4 bg-white border-t border-light-gray/40">
            <button
              onClick={() => onDownload(image.base64Image || image.src, image.id || 0)}
              className="flex items-center gap-1.5 py-2 px-4 bg-pastel-blue/10 hover:bg-pastel-blue/20 text-pastel-blue rounded-lg transition-colors"
            >
              <Download size={16} />
              <span className="text-sm font-medium">Download</span>
            </button>
            
            <button
              onClick={() => onCopy(image.base64Image || image.src, image.id || 0)}
              className="flex items-center gap-1.5 py-2 px-4 bg-soft-white hover:bg-light-gray/20 text-charcoal rounded-lg transition-colors"
            >
              <Copy size={16} />
              <span className="text-sm font-medium">Copy</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageModal;