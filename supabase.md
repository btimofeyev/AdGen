# Supabase Auth Implementation Plan for Ad Wizard

## Overview
This document outlines the implementation plan for integrating Supabase Authentication into the Ad Wizard application. The plan includes necessary tasks, code changes, and security considerations to ensure a robust authentication system.

## Table of Contents
1. [Project Setup](#1-project-setup)
2. [Authentication Components](#2-authentication-components)
3. [User Context & State Management](#3-user-context--state-management)
4. [Protected Routes](#4-protected-routes)
5. [Authentication API Integration](#5-authentication-api-integration)
6. [User Profile Management](#6-user-profile-management)
7. [Database Schema Updates](#7-database-schema-updates)
8. [Security Considerations](#8-security-considerations)
9. [Testing Plan](#9-testing-plan)

## 1. Project Setup

### 1.1 Install Required Dependencies
```bash
# Install Supabase packages
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
```

### 1.2 Configure Supabase Client
Create a Supabase project:
- Sign up or log in to [Supabase](https://supabase.com)
- Create a new project
- Go to Project Settings > API to get your Project URL and anon key

Create a configuration file for Supabase:
- Create `client/src/lib/supabase.js`
- Initialize the Supabase client with your project URL and anon key

### 1.3 Environment Setup
- Create `.env` files for development and production environments
- Add Supabase configuration variables to the environment files
- Update `.gitignore` to exclude sensitive information

## 2. Authentication Components

### 2.1 Login Component
- Create `client/src/components/auth/Login.jsx`
- Implement email/password login form
- Add "Reset Password" functionality
- Style the component to match application design

### 2.2 Signup Component
- Create `client/src/components/auth/Signup.jsx` 
- Implement user registration form
- Add Terms of Service acceptance checkbox
- Implement validation for email, password strength, etc.

### 2.3 Password Reset Component
- Create `client/src/components/auth/PasswordReset.jsx`
- Implement password reset request form
- Create password update form for after reset confirmation

### 2.4 Social Login Integration (Optional)
- Set up OAuth providers in Supabase dashboard (Google, GitHub, etc.)
- Implement social login buttons in the Login component

## 3. User Context & State Management

### 3.1 Auth Context Provider
- Create `client/src/contexts/AuthContext.jsx` 
- Implement context provider to manage auth state
- Create hooks for accessing auth functionality

### 3.2 Session Management
- Implement session persistence
- Set up listeners for auth state changes
- Handle token refresh and session expiration

### 3.3 User Profile State
- Define user profile data structure
- Create methods to fetch and update user profile

## 4. Protected Routes

### 4.1 Route Guard Component
- Create `client/src/components/auth/ProtectedRoute.jsx`
- Implement logic to check authentication status
- Redirect unauthenticated users to login page

### 4.2 Update Routing
- Modify `client/src/App.jsx` to include auth-related routes
- Protect sensitive routes using the ProtectedRoute component
- Create a public route wrapper component if needed

### 4.3 Navigation Updates
- Update `client/src/components/Navbar.jsx` to show auth-specific links
- Add conditional rendering based on auth state
- Implement logout functionality in navigation

## 5. Authentication API Integration

### 5.1 Auth Service
- Create `client/src/services/authService.js`
- Implement methods for all auth operations (login, signup, logout, etc.)
- Add error handling and response parsing

### 5.2 JWT Management
- Configure JWT token storage
- Implement functions to attach JWT to API requests
- Handle token refresh logic

### 5.3 Server Integration
- Update `server/routes/imageRoutes.js` to validate JWT tokens
- Add middleware to check authentication for protected endpoints
- Implement user ID validation in controllers

## 6. User Profile Management

### 6.1 Profile Page
- Create `client/src/pages/Profile.jsx`
- Implement form for updating user information
- Add functionality to change password

### 6.2 Avatar Upload
- Implement profile picture upload using Supabase Storage
- Create image preview and cropping functionality
- Add validation for image size and type

### 6.3 Account Settings
- Create settings page for account management
- Implement email change functionality
- Add account deletion option

## 7. Database Schema Updates

### 7.1 User Profiles Table
```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE,
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  company_name TEXT,
  PRIMARY KEY (id)
);

-- Create secure RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
```

### 7.2 Asset Ownership
```sql
-- Update existing tables to include user_id
ALTER TABLE generated_images 
  ADD COLUMN user_id UUID REFERENCES auth.users;

-- Set RLS policies
ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own images" 
  ON generated_images FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" 
  ON generated_images FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
  ON generated_images FOR DELETE 
  USING (auth.uid() = user_id);
```

### 7.3 Database Triggers
```sql
-- Auto-create profile after user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

## 8. Security Considerations

### 8.1 JWT Security
- Configure appropriate JWT expiration times (recommend 1 hour)
- Implement secure token storage on client
- Set up refresh token rotation

### 8.2 Row Level Security (RLS)
- Enable RLS on all tables containing user data
- Create policies to restrict data access based on user ID
- Test policies to ensure proper isolation of user data

### 8.3 HTTPS Configuration
- Ensure all communication uses HTTPS
- Set secure and httpOnly flags on cookies
- Implement proper CORS configuration

### 8.4 Password Policies
- Implement password strength requirements
- Add rate limiting for authentication attempts
- Configure account lockout policies

## 9. Testing Plan

### 9.1 Unit Tests
- Test authentication hooks and context
- Test protected route component
- Test user profile operations

### 9.2 Integration Tests
- Test authentication flow end-to-end
- Test protected API endpoints
- Test user session persistence

### 9.3 Security Testing
- Test for JWT vulnerabilities
- Verify RLS policies are working correctly
- Test CORS and cookie security

## Next Steps
1. Complete Project Setup (Section 1)
2. Implement Authentication Components (Section 2)
3. Set up User Context (Section 3)
4. Implement Protected Routes (Section 4)
5. Continue with remaining tasks in order

## Resources
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [React Router Documentation](https://reactrouter.com/en/main)
- [JWT Best Practices](https://supabase.com/docs/guides/auth/jwts)