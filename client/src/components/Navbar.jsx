// client/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, User } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    
    try {
      const result = await signOut();
      
      if (result && result.error) {
        console.error('Error logging out:', result.error);
        alert(`Logout failed: ${result.error.message}`);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      alert(`An unexpected error occurred during logout: ${error.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-gray px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center cursor-pointer">
        <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
        <span className="text-2xl font-bold">SnapSceneAI</span>
      </Link>
      
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <div className="flex items-center mr-2">
              <div className="w-8 h-8 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2">
                <User size={16} className="text-pastel-blue" />
              </div>
              <span className="text-sm font-medium text-charcoal/70 hidden md:inline-block">
                {user.user_metadata?.full_name || user.email}
              </span>
            </div>
            
            <Link
              to="/create"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Create
            </Link>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`bg-white border border-pastel-blue text-pastel-blue font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition hover:bg-pastel-blue/10 flex items-center gap-2 text-sm sm:text-base ${
                isLoggingOut ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <LogOut size={16} />
              {isLoggingOut ? 'Logging out...' : 'Log Out'}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/signup"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="bg-white border border-pastel-blue text-pastel-blue font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition hover:bg-pastel-blue/10 text-sm sm:text-base"
            >
              Log In
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;