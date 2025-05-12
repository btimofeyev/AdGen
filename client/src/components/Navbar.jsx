// Updated Navbar.jsx with Social Media link
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, User, Menu, X, Plus, ImageIcon, Calendar, Zap } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      const result = await signOut();

      if (result && result.error) {
        console.error("Error logging out:", result.error);
        alert(`Logout failed: ${result.error.message}`);
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected error during logout:", error);
      alert(`An unexpected error occurred during logout: ${error.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#23262F]/80 backdrop-blur-md border-b border-light-gray px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center cursor-pointer">
        <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
        <span className="text-2xl font-bold">PostoraAI</span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex gap-4 items-center">
        <Link 
          to="/examples" 
          className="text-charcoal dark:text-white hover:text-pastel-blue transition text-sm sm:text-base px-2"
        >
          Examples
        </Link>
        
        <Link 
          to="/pricing" 
          className="text-charcoal dark:text-white hover:text-pastel-blue transition text-sm sm:text-base px-2"
        >
          Pricing
        </Link>
        
        {user ? (
          <>
            {/* User is logged in */}
            <div className="flex gap-2">
              <Link
                to="/create"
                className="flex items-center gap-2 bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
              >
                <ImageIcon size={18} />
                <span>Image Studio</span>
              </Link>
              
              <Link
                to="/social"
                className="flex items-center gap-2 bg-pastel-blue/20 hover:bg-pastel-blue/30 text-pastel-blue font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-sm transition text-sm sm:text-base border border-pastel-blue/30"
              >
                <Calendar size={18} />
                <span>Social Posts</span>
                <span className="text-xs bg-pastel-blue/30 px-2 py-0.5 rounded-full">New</span>
              </Link>
            </div>
            
            <div className="flex items-center gap-2">
              <Link
                to="/account"
                className="p-2 rounded-full bg-white/60 dark:bg-[#23262F]/60 hover:bg-pastel-blue/10 transition"
              >
                <User size={20} className="text-charcoal/70 dark:text-white/70" />
              </Link>
              
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 rounded-full bg-white/60 dark:bg-[#23262F]/60 hover:bg-pastel-pink/10 transition"
              >
                <LogOut size={20} className="text-charcoal/70 dark:text-white/70" />
              </button>
            </div>
          </>
        ) : (
          <>
            {/* User is not logged in */}
            <Link
              to="/login"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Log In
            </Link>
          </>
        )}
      </div>

      {/* Hamburger for mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          className="p-2 rounded-lg hover:bg-pastel-blue/10 focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-7 w-7 text-pastel-blue" />
        </button>
        {user ? (
          <div className="flex gap-2">
            <Link
              to="/create"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal rounded-full p-3 shadow-lg transition flex items-center justify-center"
              aria-label="Create"
            >
              <ImageIcon className="h-5 w-5" />
            </Link>
            <Link
              to="/social"
              className="bg-pastel-blue/20 border border-pastel-blue/30 text-pastel-blue rounded-full p-3 shadow-sm transition flex items-center justify-center"
              aria-label="Social"
            >
              <Calendar className="h-5 w-5" />
            </Link>
          </div>
        ) : (
          <Link
            to="/login"
            className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-extrabold rounded-full px-5 py-3 shadow-xl transition text-base ml-1 border-2 border-pastel-blue focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          >
            Log In
          </Link>
        )}
      </div>

      {/* Slide-over Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-[100] flex"
          >
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black opacity-90 z-[100]"
              onClick={() => setMobileMenuOpen(false)}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 w-4/5 max-w-xs h-full min-h-screen bg-white text-charcoal dark:bg-[#23262F] dark:text-white shadow-2xl p-8 flex flex-col gap-6 z-[110] overflow-y-auto ml-auto"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-pastel-blue/10 focus:outline-none"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6 text-pastel-blue" />
              </button>
              <Link to="/" className="flex items-center mb-8" onClick={() => setMobileMenuOpen(false)}>
                <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
                <span className="text-2xl font-bold">PostoraAI</span>
              </Link>
              <nav className="flex flex-col gap-4 mt-8">
                {/* Added Examples link to mobile menu */}
                <Link
                  to="/examples"
                  className="text-charcoal dark:text-white hover:text-pastel-blue transition text-base mb-2 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ImageIcon size={18} className="text-pastel-blue" />
                  Examples
                </Link>
                
                <Link
                  to="/pricing"
                  className="text-charcoal dark:text-white hover:text-pastel-blue transition text-base mb-2 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Zap size={18} className="text-pastel-blue" />
                  Pricing
                </Link>
                
                {user ? (
                  <>
                    {/* User is logged in - Show app navigation */}
                    <Link
                      to="/create"
                      className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-lg px-4 py-3 shadow-lg transition text-base mb-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Create"
                    >
                      <ImageIcon size={18} />
                      <span>Image Studio</span>
                    </Link>
                    
                    <Link
                      to="/social"
                      className="bg-pastel-blue/20 hover:bg-pastel-blue/30 text-pastel-blue font-bold rounded-lg px-4 py-3 shadow-sm transition text-base mb-2 flex items-center gap-2 border border-pastel-blue/30"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Social"
                    >
                      <Calendar size={18} />
                      <span>Social Posts</span>
                      <span className="text-xs bg-pastel-blue/30 px-2 py-0.5 rounded-full">New</span>
                    </Link>
                    
                    <Link
                      to="/account"
                      className="text-charcoal dark:text-white hover:text-pastel-blue transition text-base mb-2 flex items-center gap-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <User size={18} className="text-pastel-blue" />
                      <span>Account</span>
                    </Link>
                    
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className="text-charcoal/70 dark:text-gray-300 hover:text-pastel-pink transition text-base mb-2 flex items-center gap-2"
                    >
                      <LogOut size={18} className="text-pastel-pink" />
                      <span>
                        {isLoggingOut ? "Logging out..." : "Log Out"}
                      </span>
                    </button>
                  </>
                ) : (
                  <>
                    {/* Logged out - Show just Login */}
                    <Link
                      to="/login"
                      className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-extrabold rounded-lg px-6 py-4 shadow-xl transition text-lg mb-2 border-2 border-pastel-blue focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    
                    <Link
                      to="/signup"
                      className="bg-white hover:bg-soft-white text-charcoal font-bold rounded-lg px-6 py-4 shadow-sm transition text-lg mb-2 border border-pastel-blue/30"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

export default Navbar;