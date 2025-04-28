import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';

const Signup = ({ isOpen, onClose }) => {
  const { signUp, loading, error, resetAuthState } = useAuth();
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    companyName: '',
    terms: false,
  });
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) resetAuthState();
    if (!isOpen) setForm({ email: '', password: '', fullName: '', companyName: '', terms: false });
  }, [isOpen, resetAuthState]);

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
    const result = await signUp(email, password, { fullName });
    if (!result?.error) {
      setSuccess(true);
      // Optionally close modal or redirect
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-6 text-center">Sign Up</h2>
      {success ? (
        <div className="text-center text-green-600 font-medium">Check your email to confirm your account.</div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            required
            className="rounded-lg border border-light-gray px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="rounded-lg border border-light-gray px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
          <input
            type="text"
            name="fullName"
            placeholder="Full Name"
            value={form.fullName}
            onChange={handleChange}
            className="rounded-lg border border-light-gray px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
          <input
            type="text"
            name="companyName"
            placeholder="Company Name (optional)"
            value={form.companyName}
            onChange={handleChange}
            className="rounded-lg border border-light-gray px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pastel-blue"
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
              required
              className="accent-pastel-blue"
            />
            I accept the Terms of Service
          </label>
          <button
            type="submit"
            disabled={loading || !form.terms}
            className="bg-pastel-blue text-charcoal font-bold rounded-lg px-4 py-2 mt-2 hover:bg-pastel-blue/80 transition"
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </button>
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
        </form>
      )}
      <div className="text-center mt-4 text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-pastel-blue hover:underline" onClick={onClose}>
          Log in
        </Link>
      </div>
    </AuthModal>
  );
};

export default Signup; 