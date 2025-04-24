// client/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "./ui/button";

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-4 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold flex items-center">
          <Sparkles className="h-6 w-6 text-blue-600 mr-2" />
          Ad Wizard
        </Link>

        {/* Mobile menu button */}
        <button 
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-slate-700" />
          ) : (
            <Menu className="h-6 w-6 text-slate-700" />
          )}
        </button>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex gap-6">
            <NavLink to="/create">Create Ad</NavLink>
            <NavLink to="/gallery">Gallery</NavLink>
            <NavLink to="/pricing">Pricing</NavLink>
            <NavLink to="/support">Support</NavLink>
          </div>
          <Button 
            className="px-4 py-2 rounded-lg text-sm"
          >
            Sign Up Free
          </Button>
        </div>
      </div>

      {/* Mobile navigation */}
      {isMenuOpen && (
        <div className="md:hidden pt-4 pb-4">
          <div className="flex flex-col gap-4">
            <NavLink to="/create" onClick={() => setIsMenuOpen(false)}>Create Ad</NavLink>
            <NavLink to="/gallery" onClick={() => setIsMenuOpen(false)}>Gallery</NavLink>
            <NavLink to="/pricing" onClick={() => setIsMenuOpen(false)}>Pricing</NavLink>
            <NavLink to="/support" onClick={() => setIsMenuOpen(false)}>Support</NavLink>
            <Button 
              className="px-4 py-2 rounded-lg text-sm w-full mt-2"
            >
              Sign Up Free
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

function NavLink({ to, children, ...props }) {
  return (
    <Link 
      to={to} 
      className="text-slate-700 hover:text-blue-600 transition-colors font-medium"
      {...props}
    >
      {children}
    </Link>
  );
}

export default Navbar;