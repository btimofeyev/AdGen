// client/src/components/Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from "lucide-react";

function Footer() {
  return (
    <footer className="py-12 px-4 md:px-8 border-t border-slate-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
        <div className="mb-8 md:mb-0">
          <h2 className="text-2xl font-bold flex items-center">
            <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
            Ad Wizard
          </h2>
          <p className="text-slate-500 mt-2">Transform images into engaging ads</p>
        </div>
        
        <div className="flex gap-6">
          <FooterLink to="/features">Features</FooterLink>
          <FooterLink to="/pricing">Pricing</FooterLink>
          <FooterLink to="/examples">Examples</FooterLink>
          <FooterLink to="/support">Support</FooterLink>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-slate-200 text-center text-slate-400 text-sm">
        © 2025 Ad Wizard. All rights reserved.
      </div>
    </footer>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link 
      to={to} 
      className="text-slate-600 hover:text-blue-600 transition-colors"
    >
      {children}
    </Link>
  );
}

export default Footer;