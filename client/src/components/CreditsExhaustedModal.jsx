import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { X, CreditCard, Sparkles } from 'lucide-react';
import { Button } from './ui/button';

const CreditsExhaustedModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative"
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="absolute top-4 right-4 text-charcoal/60 hover:text-charcoal p-1 rounded-full hover:bg-light-gray/20"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-pastel-blue/20 flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-pastel-blue" />
            </div>
            
            <h2 className="text-2xl font-bold mb-2">
              You're out of credits
            </h2>
            
            <p className="text-charcoal/70 mb-6">
              You've used all your available image generation credits. Upgrade your plan or purchase more credits to continue creating amazing visuals.
            </p>
            
            <div className="grid grid-cols-1 gap-3 w-full">
              <Link to="/pricing" className="w-full">
                <Button className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  View Pricing Plans
                </Button>
              </Link>
              
              <button 
                onClick={onClose}
                className="text-charcoal/70 hover:text-charcoal text-sm"
              >
                I'll upgrade later
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CreditsExhaustedModal;