import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthModal from './AuthModal';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

const Login = ({ isOpen, onClose }) => {
  const { signIn, loading, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const result = await signIn(form.email, form.password);
      
      if (!result?.error) {
        if (onClose) onClose();
        setTimeout(() => navigate('/create', { replace: true }), 100);
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
          <p className="text-charcoal/60 dark:text-gray-300">Log in to your account</p>
        </div>
        
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
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs text-pastel-blue hover:underline">
                Forgot password?
              </Link>
            </div>
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
          </div>
          
          {error && (
            <div className="p-3 bg-pastel-pink/10 border border-pastel-pink/30 rounded-lg text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
          
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>
        </form>
        
        <div className="text-center pt-4 border-t border-light-gray/30">
          <p className="text-sm text-charcoal/70 dark:text-gray-400">
            Don't have an account?{' '}
            <Link 
              to="/signup" 
              className="text-pastel-blue hover:underline font-medium"
              onClick={() => onClose && onClose()}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthModal>
  );
};

export default Login;