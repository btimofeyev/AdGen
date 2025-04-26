// client/src/components/ImageModal.jsx
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy } from 'lucide-react';

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
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative max-w-3xl w-full bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 p-1 rounded-full bg-white/90 shadow-md hover:bg-white transition-colors"
              aria-label="Close"
            >
              <X size={20} />
            </button>
            
            {/* Image display */}
            <div className="overflow-hidden bg-gray-100">
              <img 
                src={image.src} 
                alt={image.alt || "Expanded view"} 
                className="w-full object-contain max-h-[70vh]"
              />
            </div>
            
            {/* Action buttons */}
            <div className="p-4 flex items-center justify-between bg-white border-t">
              <div className="text-sm font-medium text-gray-700">
                {image.title || "Generated Visual"}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={onDownload}
                  className="flex items-center gap-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors"
                >
                  <Download size={16} />
                  <span>Download</span>
                </button>
                
                <button
                  onClick={onCopy}
                  className="flex items-center gap-1.5 py-2 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                >
                  <Copy size={16} />
                  <span>Copy</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;