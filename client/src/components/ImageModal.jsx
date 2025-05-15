import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Clock, Trash2 } from 'lucide-react'; // Share2 removed as not used

const ImageModalActionButton = ({ icon, text, onClick, variant = 'primary', ...props }) => {
  const baseClasses = "flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium shadow-sm transition-all";
  const variants = {
    primary: "bg-pastel-blue hover:bg-pastel-blue/90 text-charcoal",
    secondary: "bg-charcoal/60 border border-charcoal/30 hover:border-pastel-blue/40 text-white/80 hover:text-white",
    danger: "border border-pastel-pink/40 text-pastel-pink hover:bg-pastel-pink/10",
  };
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]}`}
      {...props}
    >
      {icon}
      <span>{text}</span>
    </motion.button>
  );
};

const ImageModal = ({ isOpen, onClose, image, onDownload, onCopy, onDelete }) => {
  const modalRef = useRef(null);
  
  const handleClose = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) handleClose();
    };
    const handleEscKey = (e) => {
      if (e.key === 'Escape') handleClose();
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, handleClose]);

  const getExpirationStyle = (daysRemaining) => {
    if (daysRemaining === undefined || daysRemaining === null) return 'bg-gray-500 text-white shadow-lg'; // Default or unknown
    if (daysRemaining <= 1) return 'bg-pastel-pink text-white shadow-lg'; 
    if (daysRemaining <= 3) return 'bg-amber-500 text-white shadow-lg';
    return 'bg-pastel-blue text-white shadow-lg';
  };

  if (!isOpen || !image) return null;

  const { base64Image, src, prompt, alt, created_at, expires_at, daysRemaining, expirationText, id } = image;
  const displayImageSrc = base64Image || src;
  const imageAltText = prompt || alt || "Generated image";

  const handleDelete = () => {
    if (onDelete && window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
      onDelete(id);
      handleClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
      >
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-5xl w-full bg-charcoal rounded-2xl shadow-2xl overflow-hidden"
        >
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-charcoal/90 text-white shadow-lg hover:bg-charcoal/70"
            aria-label="Close"
          >
            <X size={20} />
          </motion.button>
          
          <div className="grid md:grid-cols-5 gap-0">
            <div className="md:col-span-3 bg-black relative flex items-center justify-center">
              <img src={displayImageSrc} alt={imageAltText} className="max-w-full max-h-[80vh] object-contain"/>
              {daysRemaining !== undefined && (
                <div className={`absolute top-4 left-4 px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg border border-white/20 ${getExpirationStyle(daysRemaining)}`}>
                  <Clock size={14} className="mr-2" />
                  {expirationText || `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
                </div>
              )}
            </div>
            
            <div className="md:col-span-2 p-6 flex flex-col bg-charcoal">
              <div className="flex-grow">
                <h2 className="text-xl font-bold text-white">Image Details</h2>
                
                {created_at && <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">Created</h3>
                  <p className="text-white">{new Date(created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>}
                
                <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">Prompt</h3>
                  <p className="text-white bg-charcoal/60 p-3 rounded-lg border border-charcoal/30 text-sm break-words max-h-28 overflow-y-auto">
                    {prompt || "No prompt information."}
                  </p>
                </div>
                
                {expires_at && <div className="mt-4">
                  <h3 className="text-xs uppercase tracking-wider text-white/50 font-medium mb-1">Expiration</h3>
                  <p className="text-white">{new Date(expires_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  {daysRemaining !== undefined && (<p className="text-sm text-white/60 mt-1">{daysRemaining <= 1 ? "⚠️ Expiring soon! Download now." : `Deletes in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`}</p>)}
                </div>}
              </div>
              
              <div className="mt-6 pt-6 border-t border-charcoal/40">
                <div className="grid grid-cols-2 gap-3">
                  <ImageModalActionButton icon={<Download size={16} />} text="Download" onClick={() => onDownload && onDownload(displayImageSrc, id || 0)} />
                  <ImageModalActionButton icon={<Copy size={16} />} text="Copy" onClick={() => onCopy && onCopy(displayImageSrc, id || 0)} variant="secondary" />
                </div>
                {onDelete && (
                  <ImageModalActionButton icon={<Trash2 size={16} />} text="Delete Image" onClick={handleDelete} variant="danger" className="mt-3 w-full" />
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