import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import AuthModal from './AuthModal';

const Login = ({ isOpen, onClose }) => {
  const { signIn, loading, error } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;
    const result = await signIn(email, password);
    if (!result?.error) {
      setSuccess(true);
      onClose?.();
      navigate('/'); // Redirect to home or dashboard
    }
  };

  return (
    <AuthModal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-2xl font-bold mb-6 text-center">Log In</h2>
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
        <button
          type="submit"
          disabled={loading}
          className="bg-pastel-blue text-charcoal font-bold rounded-lg px-4 py-2 mt-2 hover:bg-pastel-blue/80 transition"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
        {error && <div className="text-red-500 text-sm text-center">{error}</div>}
      </form>
      <div className="text-center mt-4 text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-pastel-blue hover:underline" onClick={onClose}>
          Sign up
        </Link>
      </div>
    </AuthModal>
  );
};

export default Login; 