// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdCreator from './pages/AdCreator';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ProtectedRoute from './components/auth/ProtectedRoute';

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  // This allows modals to overlay the current page
  const state = location.state;
  const background = state && state.background;

  // Modal open if path is /login or /signup
  const isLoginOpen = location.pathname === '/login';
  const isSignupOpen = location.pathname === '/signup';

  const handleClose = () => {
    if (background) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      <Routes location={background || location}>
        <Route path="/" element={<LandingPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/create" element={<AdCreator />} />
        </Route>
      </Routes>
      {/* Modals */}
      <Login isOpen={isLoginOpen} onClose={handleClose} />
      <Signup isOpen={isSignupOpen} onClose={handleClose} />
    </>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <AppRoutes />
      </div>
    </Router>
  );
}

export default App;