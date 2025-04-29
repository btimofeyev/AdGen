// client/src/components/ExpirationNotice.jsx
import React, { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';

const ExpirationNotice = () => {
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    // Check if we've shown this notice before
    const noticeShown = localStorage.getItem('expirationNoticeShown');
    if (!noticeShown) {
      setVisible(true);
    }
  }, []);
  
  const handleDismiss = () => {
    setVisible(false);
    // Remember that we've shown this notice
    localStorage.setItem('expirationNoticeShown', 'true');
  };
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-4 right-4 max-w-md bg-white rounded-lg shadow-lg border border-pastel-blue/30 p-4 z-50 animate-fade-in">
      <button 
        onClick={handleDismiss}
        className="absolute top-2 right-2 text-charcoal/40 hover:text-charcoal/70"
      >
        <X size={16} />
      </button>
      
      <div className="flex items-start gap-3">
        <div className="bg-pastel-blue/20 p-2 rounded-full">
          <Clock size={20} className="text-pastel-blue" />
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-1">Image Storage Policy</h4>
          <p className="text-xs text-charcoal/70 mb-2">
            Your generated images are automatically deleted after 7 days. 
            Be sure to download any images you want to keep permanently.
          </p>
          <button
            onClick={handleDismiss}
            className="text-xs bg-pastel-blue text-charcoal px-3 py-1 rounded-md font-medium"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpirationNotice;