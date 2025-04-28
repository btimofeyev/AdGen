// client/src/components/Navbar.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, LogOut, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-light-gray px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center cursor-pointer">
        <Sparkles className="h-6 w-6 text-pastel-blue mr-2" />
        <span className="text-2xl font-bold">SnapSceneAI</span>
      </Link>

      <div className="flex gap-4 items-center">
        {user ? (
          <>
            {/* User is logged in: Profile, Create, Pricing, Log Out */}
            <div className="flex items-center mr-2">
              <div className="w-8 h-8 rounded-full bg-pastel-blue/20 flex items-center justify-center mr-2">
                <User size={16} className="text-pastel-blue" />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-medium text-charcoal/70">
                  {user.user_metadata?.full_name || user.email.split("@")[0]}
                </span>
                <Link
                  to="/account"
                  className="text-xs text-pastel-blue hover:underline"
                >
                  Manage Account
                </Link>
              </div>
            </div>
            
            <Link
              to="/create"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Create
            </Link>
            
            <Link
              to="/pricing"
              className="hidden sm:inline-block text-charcoal/80 hover:text-pastel-blue transition text-sm sm:text-base px-2"
            >
              Pricing
            </Link>
            
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`bg-white border border-light-gray/40 text-charcoal/70 font-medium rounded-full px-4 sm:px-6 py-2 sm:py-3 transition hover:bg-soft-white flex items-center gap-2 text-sm sm:text-base ${
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
            {/* User is not logged in: Pricing, Login, Get Started */}
            <Link
              to="/pricing"
              className="text-charcoal/80 hover:text-pastel-blue transition text-sm sm:text-base px-2"
            >
              Pricing
            </Link>
            
            <Link
              to="/login"
              className="text-charcoal/70 hover:text-charcoal/90 font-medium rounded-full px-4 py-2 transition text-sm sm:text-base"
            >
              Log In
            </Link>
            
            <Link
              to="/signup"
              className="bg-pastel-blue hover:bg-pastel-blue/80 text-charcoal font-bold rounded-full px-4 sm:px-6 py-2 sm:py-3 shadow-lg transition text-sm sm:text-base"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;