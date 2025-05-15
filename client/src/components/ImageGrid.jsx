import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Copy, Trash2, Clock, Eye, ImageIcon, CheckSquare } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", damping: 15, stiffness: 200 } },
  exit: { opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }
};

const ImageCardAction = React.memo(({ icon, title, onClick, className = "" }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${className}`}
    title={title}
  >
    {icon}
  </motion.button>
));

const ImageCard = React.memo(({ image, index, onDownload, onCopy, onModalOpen, onDelete, selectedImages, toggleImageSelection, deletingId, setDeletingId, hoveredId, setHoveredId }) => {
  
  const handleDeleteClick = useCallback(() => {
    if (!onDelete) return;
    if (deletingId === image.id) {
      onDelete(image.id);
      setDeletingId(null);
    } else {
      setDeletingId(image.id);
      setTimeout(() => setDeletingId(null), 3000);
    }
  }, [onDelete, deletingId, image.id, setDeletingId]);

  const getExpirationStyle = useCallback((daysRemaining) => {
    if (daysRemaining === undefined || daysRemaining === null) return 'bg-gray-400/70 text-white border-gray-500/30';
    if (daysRemaining <= 1) return 'bg-pastel-pink/80 text-white border-pastel-pink/40'; 
    if (daysRemaining <= 3) return 'bg-amber-500/80 text-white border-amber-600/30';
    return 'bg-pastel-blue/80 text-white border-pastel-blue/40';
  }, []);

  const handleCardClick = useCallback(() => {
    if (Object.values(selectedImages).some(v => v) && !image.error) {
      toggleImageSelection(image.id, { stopPropagation: () => {} }); // Pass dummy event
    } else if (!image.error && onModalOpen) {
      onModalOpen(image);
    }
  }, [selectedImages, image, onModalOpen, toggleImageSelection]);

  return (
    <motion.div 
      key={image.id || `img-${index}`}
      variants={itemVariants}
      layout
      exit="exit"
      onHoverStart={() => setHoveredId && setHoveredId(image.id)}
      onHoverEnd={() => setHoveredId && setHoveredId(null)}
      className="relative group"
    >
      <motion.div 
        className={`bg-background rounded-xl overflow-hidden shadow-sm border transition-all ${selectedImages[image.id] ? 'border-pastel-blue shadow-md' : 'border-border hover:shadow-md'}`}
        whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
      >
        <div 
          className="relative aspect-square overflow-hidden cursor-pointer"
          onClick={handleCardClick}
        >
          {image.error ? (
            <div className="absolute inset-0 flex items-center justify-center bg-pastel-pink/10 p-3">
              <p className="text-xs text-red-500 text-center">Error: {image.error}</p>
            </div>
          ) : (
            <>
              <img src={image.base64Image} alt={image.prompt || `Generated image ${index + 1}`} className="w-full h-full object-cover object-center"/>
              
              <motion.div 
                className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 opacity-0 group-hover:opacity-100"
                initial={false}
                animate={{ opacity: hoveredId === image.id ? 1 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {onModalOpen && (
                  <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-center">
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: hoveredId === image.id ? 1 : 0.8, opacity: hoveredId === image.id ? 1 : 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white/90 dark:bg-[#23262F]/90 hover:bg-white dark:hover:bg-[#23262F] text-charcoal dark:text-white rounded-full p-2 shadow-lg"
                      onClick={(e) => { e.stopPropagation(); onModalOpen(image); }}
                      title="View Image"
                    >
                      <Eye size={18} />
                    </motion.button>
                  </div>
                )}
              </motion.div>
              
              {image.daysRemaining !== undefined && (
                <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium flex items-center shadow-sm backdrop-blur-sm ${getExpirationStyle(image.daysRemaining)}`}>
                  <Clock size={10} className="mr-1" />
                  <span className="text-[10px]">{image.daysRemaining}d</span>
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="px-4 py-3 border-t border-border">
          <h3 className="text-sm font-medium text-charcoal dark:text-white truncate" title={image.prompt || "Generated Image"}>
            {image.prompt || "Generated Image"}
          </h3>
          {image.created_at && (
            <p className="text-xs text-charcoal/50 dark:text-gray-400 mt-1">
              {new Date(image.created_at).toLocaleDateString()}
            </p>
          )}
        </div>
        
        {!image.error && (
          <div className="flex justify-between p-3 pt-0 gap-2">
            <div className="flex space-x-1">
              <ImageCardAction icon={<Download size={16} className="text-charcoal/70 dark:text-white group-hover:text-charcoal dark:group-hover:text-pastel-blue" />} title="Download" onClick={() => onDownload && onDownload(image.base64Image, index)} className="hover:bg-soft-white dark:hover:bg-[#23262F] group"/>
              <ImageCardAction icon={<Copy size={16} className="text-charcoal/70 dark:text-white group-hover:text-charcoal dark:group-hover:text-pastel-blue" />} title="Copy" onClick={() => onCopy && onCopy(image.base64Image, index)} className="hover:bg-soft-white dark:hover:bg-[#23262F] group"/>
              <ImageCardAction 
                icon={<CheckSquare size={16} />} 
                title="Select" 
                onClick={(e) => toggleImageSelection(image.id, e)} 
                className={`${selectedImages[image.id] ? 'bg-pastel-blue text-white' : 'hover:bg-soft-white dark:hover:bg-[#23262F] text-charcoal/70 dark:text-white hover:text-charcoal dark:hover:text-pastel-blue'}`}
              />
            </div>
            {onDelete && (
              <ImageCardAction 
                icon={<Trash2 size={16} />} 
                title={deletingId === image.id ? "Confirm delete" : "Delete"} 
                onClick={handleDeleteClick}
                className={`${deletingId === image.id ? 'bg-pastel-pink text-white animate-pulse' : 'hover:bg-soft-white dark:hover:bg-[#23262F] text-charcoal/70 dark:text-white hover:text-pastel-pink dark:hover:text-pastel-pink'}`}
              />
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
});

const ImageGrid = ({ 
  images, 
  onDownload, 
  onCopy, 
  onModalOpen, 
  onDelete,
  selectedImages = {}, 
  setSelectedImages = () => {} 
}) => {
  const [deletingId, setDeletingId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  
  const toggleImageSelection = useCallback((imageId, e) => {
    e.stopPropagation(); // Prevent card click when selecting
    setSelectedImages(prev => ({ ...prev, [imageId]: !prev[imageId] }));
  }, [setSelectedImages]);

  if (!images || images.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center h-64 w-full bg-background rounded-xl border border-border shadow-sm"
      >
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-background p-4 rounded-full mb-4">
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
            <ImageCard
              key={image.id || `img-${index}`} // Ensure key is stable and unique
              image={image}
              index={index}
              onDownload={onDownload}
              onCopy={onCopy}
              onModalOpen={onModalOpen}
              onDelete={onDelete}
              selectedImages={selectedImages}
              toggleImageSelection={toggleImageSelection}
              deletingId={deletingId}
              setDeletingId={setDeletingId}
              hoveredId={hoveredId}
              setHoveredId={setHoveredId}
            />
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ImageGrid;