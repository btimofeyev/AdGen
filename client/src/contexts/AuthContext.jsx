import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state when component mounts
  useEffect(() => {
    console.log('Auth context initializing...');
    
    // Get the current session
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error fetching session:', error.message);
          setError(error.message);
        } else {
          setSession(data.session);
          setUser(data.session?.user || null);
          console.log('Session initialized:', !!data.session);
        }
      } catch (err) {
        console.error('Unexpected error during auth initialization:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);
        setSession(newSession);
        setUser(newSession?.user || null);
      }
    );

    // Clean up listener on unmount
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Sign up function
  const signUp = async (email, password, metaData = {}) => {
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metaData,
        },
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { data };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during sign up';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { data };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during sign in';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Sign out function
  const signOut = async () => {
    setError(null);
    
    try {
      console.log('Signing out user...');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during sign out:', error);
        setError(error.message);
        return { error };
      }
      
      console.log('User signed out successfully');
      return { success: true };
    } catch (err) {
      console.error('Unexpected error during sign out:', err);
      const errorMessage = err.message || 'An unexpected error occurred during sign out';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { data };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during password reset';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    setError(null);
    
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { data };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during profile update';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

  // Context value
  const value = {
    user,
    session,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};