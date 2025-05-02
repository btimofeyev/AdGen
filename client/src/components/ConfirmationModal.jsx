// client/src/components/ConfirmationModal.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action', 
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false
}) => {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-[#23262F] rounded-xl shadow-2xl p-6 w-full max-w-md relative border border-[#23262F]/60"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full text-white/70 hover:text-white hover:bg-[#181A20]/40 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
          
          <div className="flex flex-col items-center text-center mb-6">
            {destructive && (
              <div className="w-12 h-12 rounded-full bg-pastel-pink/20 flex items-center justify-center mb-4">
                <AlertTriangle size={22} className="text-pastel-pink" />
              </div>
            )}
            
            <h2 className="text-xl font-bold mb-3 text-white">{title}</h2>
            <p className="text-white/70">{message}</p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="px-5 py-2 rounded-lg text-white/80 hover:text-white bg-[#181A20]/50 hover:bg-[#181A20]/70 font-medium transition-colors"
            >
              {cancelText}
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`px-5 py-2 rounded-lg text-white font-medium ${
                destructive 
                  ? 'bg-pastel-pink hover:bg-pastel-pink/80' 
                  : 'bg-pastel-blue hover:bg-pastel-blue/80 text-[#181A20]'
              }`}
            >
              {confirmText}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ConfirmationModal;