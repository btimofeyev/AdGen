import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const ForgotPassword = ({ isOpen, onClose }) => {
  const { resetPassword, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await resetPassword(email);
    
    if (!result?.error) {
      setSuccess(true);
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Reset Your Password</h2>
          <p className="text-charcoal/60">
            {!success
              ? "Enter your email and we'll send you a link to reset your password"
              : "Check your email for the reset link"}
          </p>
        </div>
        
        {success ? (
          <div className="text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-charcoal">Email Sent</h3>
            <p className="text-charcoal/70">
              If your email address exists in our database, you will receive a password recovery link shortly.
            </p>
            <Button
              onClick={onClose}
              className="mt-4"
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full"
              />
            </div>
            
            {error && (
              <div className="p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading || !email}
              className="w-full"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        )}
        
        <div className="text-center pt-4 border-t border-light-gray/30">
          <p className="text-sm text-charcoal/70">
            Remember your password?{' '}
            <Link 
              to="/login" 
              className="text-pastel-blue hover:underline font-medium"
              onClick={() => onClose && onClose()}
            >
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </AuthModal>
  );
};

export default ForgotPassword;