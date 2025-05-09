// client/src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, User, Menu, X, Plus, ImageIcon } from "lucide-react";
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
            {/* User is logged in: Just show Create button and optional logout */}
            <Link
              to="/create"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Create
            </Link>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`bg-white border border-light-gray/40 text-charcoal/70 font-medium rounded-full px-4 sm:px-6 py-2 sm:py-3 transition hover:bg-soft-white flex items-center gap-2 text-sm sm:text-base dark:bg-pastel-blue dark:text-[#181A20] dark:border-pastel-blue dark:hover:bg-pastel-blue/80 ${
                isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">
                {isLoggingOut ? "Logging out..." : "Log Out"}
              </span>
            </button>
          </>
        ) : (
          <>
            {/* User is not logged in: Just Pricing and Login */}
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
          <Link
            to="/create"
            className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal rounded-full p-3 shadow-lg transition flex items-center justify-center ml-1"
            aria-label="Create"
          >
            <Plus className="h-6 w-6" />
          </Link>
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
                  <span>Pricing</span>
                </Link>
                
                {user ? (
                  <>
                    {/* User is logged in - Show Create button */}
                    <Link
                      to="/create"
                      className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 py-3 shadow-lg transition text-base mb-2 flex items-center justify-center"
                      onClick={() => setMobileMenuOpen(false)}
                      aria-label="Create"
                    >
                      <Plus className="h-6 w-6 mr-2" />
                      <span>Create</span>
                    </Link>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      disabled={isLoggingOut}
                      className={`bg-white border border-light-gray/40 text-charcoal/70 font-medium rounded-full px-4 py-3 transition hover:bg-soft-white flex items-center gap-2 text-base dark:bg-pastel-blue dark:text-[#181A20] dark:border-pastel-blue dark:hover:bg-pastel-blue/80 ${
                        isLoggingOut ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <LogOut size={16} />
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
                      className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-extrabold rounded-full px-6 py-4 shadow-xl transition text-lg mb-2 border-2 border-pastel-blue focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
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