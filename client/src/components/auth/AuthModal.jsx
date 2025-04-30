import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
};

const AuthModal = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
        onClick={onClose}
      >
        <motion.div
          className="bg-background text-foreground rounded-2xl shadow-2xl p-8 w-full max-w-md relative border border-border"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={modalVariants}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-charcoal/60 hover:text-charcoal text-xl font-bold"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default AuthModal; 