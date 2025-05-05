// Updated Footer Component with Consistent Links
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from "lucide-react";

function Footer() {
  return (
    <footer className="py-12 px-4 md:px-8 border-t border-light-gray/40 dark:border-border bg-background text-charcoal dark:text-white">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-8 md:mb-0">
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
            PostoraAI
          </h2>
          <p className="text-charcoal/60 dark:text-gray-400 mt-2">Transform images into engaging visuals</p>
        </div>

        <div className="flex flex-wrap gap-6 justify-center">
          <Link to="/examples" className="text-charcoal/70 dark:text-gray-300 hover:text-pastel-blue transition-colors">
            Examples
          </Link>
          <Link to="/pricing" className="text-charcoal/70 dark:text-gray-300 hover:text-pastel-blue transition-colors">
            Pricing
          </Link>
          <Link to="/create" className="text-charcoal/70 dark:text-gray-300 hover:text-pastel-blue transition-colors">
            Create
          </Link>
          <Link to="/support" className="text-charcoal/70 dark:text-gray-300 hover:text-pastel-blue transition-colors">
            Support
          </Link>
        </div>
      </div>
      
      {/* Legal Links */}
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-light-gray/40 dark:border-border flex flex-col md:flex-row justify-between items-center">
        <div className="text-charcoal/50 dark:text-gray-500 text-sm mb-4 md:mb-0">
          © 2025 PostoraAI. All rights reserved.
        </div>
        
        <div className="flex gap-6">
          <Link to="/terms" className="text-charcoal/50 dark:text-gray-500 text-sm hover:text-pastel-blue transition-colors">
            Terms of Service
          </Link>
          <Link to="/privacy" className="text-charcoal/50 dark:text-gray-500 text-sm hover:text-pastel-blue transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default Footer;