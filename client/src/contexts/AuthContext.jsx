// client/src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state when the provider mounts
  useEffect(() => {
    // Set initial user if there's an active session
    const initUser = async () => {
      try {
        setLoading(true);
        
        // Check for active session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        // Set the user if session exists
        if (session?.user) {
          setUser(session.user);
          
          // Load user profile data
          await getUserProfile(session.user.id);
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    initUser();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await getUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );
    
    // Cleanup subscription
    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);
  
  // Function to get user profile data
  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        throw error;
      }
      
      if (data) {
        setUser(prev => ({ ...prev, profile: data }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Sign up function
  const signUp = async (email, password, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: options.fullName || '',
            company_name: options.companyName || ''
          },
          ...options
        }
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign in with social providers
  const signInWithProvider = async (provider) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setUser(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) {
        throw error;
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      setLoading(true);
      setError(null);
      
      // First update auth metadata if necessary
      if (profileData.email || profileData.full_name) {
        const authUpdate = {};
        if (profileData.email) authUpdate.email = profileData.email;
        
        const userData = {};
        if (profileData.full_name) userData.full_name = profileData.full_name;
        if (Object.keys(userData).length > 0) authUpdate.data = userData;
        
        if (Object.keys(authUpdate).length > 0) {
          const { error: authError } = await supabase.auth.updateUser(authUpdate);
          if (authError) throw authError;
        }
      }
      
      // Then update profile in profiles table
      const profileUpdate = { ...profileData };
      delete profileUpdate.email; // Don't duplicate email in profiles table
      
      // Only proceed if there's data to update
      if (Object.keys(profileUpdate).length > 0) {
        const { data, error } = await supabase
          .from('profiles')
          .update(profileUpdate)
          .eq('id', user.id);
          
        if (error) throw error;
        
        // Update local user state with new profile data
        setUser(prev => ({
          ...prev,
          profile: { ...prev.profile, ...profileUpdate }
        }));
        
        return data;
      }
      
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { error: err };
    } finally {
      setLoading(false);
    }
  };

  // Value to be provided by context
  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signInWithProvider,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};