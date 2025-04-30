import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';

const Signup = ({ isOpen, onClose }) => {
  const { signUp, loading, error } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    terms: false,
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.terms) return;
    
    const { email, password, fullName, companyName } = form;
    
    const result = await signUp(email, password, { 
      full_name: fullName,
      company_name: companyName 
    });
    
    if (!result?.error) {
      setSuccess(true);
      // Don't navigate yet - they need to confirm email
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Create Your Account</h2>
          <p className="text-charcoal/60 dark:text-gray-300">Join SnapSceneAI and start creating</p>
        </div>
        
        {success ? (
          <div className="text-center p-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-charcoal dark:text-white">Check Your Email</h3>
            <p className="text-charcoal/70 dark:text-gray-300">
              We've sent a confirmation link to your email address.
              Please click the link to activate your account.
            </p>
            <Button
              onClick={() => {
                onClose && onClose();
                navigate('/');
              }}
              className="mt-4"
            >
              Back to Home
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full"
              />
              <p className="text-xs text-charcoal/60">
                Must be at least 8 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={form.fullName}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name (Optional)</Label>
              <Input
                id="companyName"
                type="text"
                name="companyName"
                placeholder="Acme Inc."
                value={form.companyName}
                onChange={handleChange}
                className="w-full"
              />
            </div>
            
            <div className="flex items-start space-x-3 pt-2">
              <Checkbox
                id="terms"
                name="terms"
                checked={form.terms}
                onCheckedChange={(checked) => 
                  setForm(prev => ({ ...prev, terms: checked }))
                }
                required
              />
              <Label htmlFor="terms" className="text-sm leading-tight cursor-pointer">
                I agree to the <Link to="/terms" className="text-pastel-blue hover:underline" target="_blank">Terms of Service</Link> and <Link to="/privacy" className="text-pastel-blue hover:underline" target="_blank">Privacy Policy</Link>
              </Label>
            </div>
            
            {error && (
              <div className="p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <Button
              type="submit"
              disabled={loading || !form.terms}
              className="w-full"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        )}
        
        <div className="text-center pt-4 border-t border-light-gray/30">
          <p className="text-sm text-charcoal/70 dark:text-gray-400">
            Already have an account?{' '}
            <Link 
              to="/login" 
              className="text-pastel-blue hover:underline font-medium"
              onClick={() => onClose && onClose()}
            >
              Log in
            </Link>
          </p>
        </div>
      </div>
    </AuthModal>
  );
};

export default Signup;