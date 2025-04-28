// client/src/components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut } from "lucide-react";
import { useAuth } from '../contexts/AuthContext';

function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth(); // Get user and signOut from context
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    console.log('[Navbar] handleLogout called - Using Context');

    // Check if signOut is actually a function from the context
    console.log('[Navbar] Checking context signOut type:', typeof signOut);
    if (typeof signOut !== 'function') {
        console.error('[Navbar] signOut from context is NOT a function!');
        alert('Logout function is unavailable. Please refresh.');
        setIsLoggingOut(false);
        return;
    }

    setIsLoggingOut(true);
    try {
      // Log environment variables just before the call (as a final sanity check)
      console.log('[Navbar] ENV Check - URL:', process.env.REACT_APP_SUPABASE_URL);
      console.log('[Navbar] ENV Check - Key:', process.env.REACT_APP_SUPABASE_ANON_KEY);

      console.log('[Navbar] Calling context signOut function...');
      const result = await signOut(); // Call the signOut function from context
      console.log('[Navbar] Context signOut function returned:', result);

      if (result && result.error) {
         console.error('[Navbar] Error reported by context signOut:', result.error);
         alert(`Logout failed: ${result.error.message}`);
      } else {
         // Assuming success if no error object is returned
         console.log('[Navbar] Context signOut successful or completed, navigating to /');
         navigate('/');
      }
    } catch (error) {
      // Catch unexpected errors during the await or result handling
      console.error('[Navbar] Unexpected error caught in handleLogout:', error);
      alert(`An unexpected error occurred during logout: ${error.message}`);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Render the Navbar UI
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-gray px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center cursor-pointer">
        <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
        <span className="text-2xl font-bold">SnapSceneAI</span>
      </Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link
              to="/create"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Create Ad
            </Link>
            <button
              onClick={handleLogout} // Uses the context-based handler
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