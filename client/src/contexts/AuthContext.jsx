// client/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../lib/supabase';
import { API_URL } from '../config';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          setError(error.message);
        } else {
          setSession(data.session);
          setUser(data.session?.user || null);
          
          if (data.session?.user) {
            await ensureUserHasFreeCredits(data.session.user.id, data.session);
          }
        }
      } catch (err) {
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        
        if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && newSession?.user) {
          await ensureUserHasFreeCredits(newSession.user.id, newSession);
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);
  
  const ensureUserHasFreeCredits = async (userId, userSession) => {
    if (!userId || !userSession) return;
    
    try {
      const response = await fetch(`${API_URL}/users/credits`, {
        headers: {
          Authorization: `Bearer ${userSession.access_token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        
        if (userData.available_credits === 0 && userData.total_credits_received === 0) {
          const freeTrialResponse = await fetch(`${API_URL}/users/credits/free-trial`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${userSession.access_token}`
            }
          });
          
          if (!freeTrialResponse.ok) {
            const errorData = await freeTrialResponse.json();
            throw new Error(errorData?.error || 'Failed to grant free trial credits');
          }
        }
      }
    } catch (err) {
      // Silently handle credits error - don't block authentication for this
    }
  };

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

  const signOut = async () => {
    setError(null);
    
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        return { error };
      }
      
      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'An unexpected error occurred during sign out';
      setError(errorMessage);
      return { error: { message: errorMessage } };
    }
  };

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