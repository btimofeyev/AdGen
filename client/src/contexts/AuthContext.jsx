// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { API_URL } from '../config';

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
          
          // Check if user logged in and ensure they have free credits
          if (data.session?.user) {
            await ensureUserHasFreeCredits(data.session.user.id, data.session);
          }
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
        
        // If a user just signed in or was confirmed, ensure they have free credits
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newSession?.user) {
          await ensureUserHasFreeCredits(newSession.user.id, newSession);
        }
      }
    );

    // Clean up listener on unmount
    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  // Function to ensure new users get free credits
  const ensureUserHasFreeCredits = async (userId, userSession) => {
    if (!userId || !userSession) return;
    
    try {
      // Check if the user already has credits
      const response = await fetch(`${API_URL}/users/credits`, {
        headers: {
          Authorization: `Bearer ${userSession.access_token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        // If user has 0 credits, they might be new - give them free trial credits
        if (userData.available_credits === 0 && userData.total_credits_received === 0) {
          console.log('New user detected, granting free trial credits');
          
          // Call the endpoint to grant free trial credits
          const freeTrialResponse = await fetch(`${API_URL}/users/credits/free-trial`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userSession.access_token}`
            }
          });
          
          if (freeTrialResponse.ok) {
            console.log('Successfully granted free trial credits to new user');
          } else {
            console.error('Failed to grant free trial credits:', await freeTrialResponse.text());
          }
        }
      }
    } catch (err) {
      console.error('Error ensuring user has free credits:', err);
    }
  };

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