// client/src/App.jsx
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdCreator from './pages/AdCreator';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import ForgotPassword from './components/auth/ForgotPassword';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// This component contains all the routes and handles modals
function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  const background = location.state?.background;
  
  // Check if we're on the create page
  const isCreatePage = location.pathname === '/create';

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <>
      {/* Only render Navbar if not on the create page */}
      {!isCreatePage && <Navbar />}
      
      <div className={`flex-grow ${!isCreatePage ? 'min-h-screen' : ''}`}>
        <Routes location={background || location}>
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create" element={<AdCreator />} />
          </Route>
          
          <Route path="/login" element={<LandingPage />} />
          <Route path="/signup" element={<LandingPage />} />
          <Route path="/forgot-password" element={<LandingPage />} />
        </Routes>
        
        {/* Modals */}
        {location.pathname === '/login' && (
          <Login isOpen={true} onClose={handleClose} />
        )}
        {location.pathname === '/signup' && (
          <Signup isOpen={true} onClose={handleClose} />
        )}
        {location.pathname === '/forgot-password' && (
          <ForgotPassword isOpen={true} onClose={handleClose} />
        )}
      </div>
    </>
  );
}

// Main App wrapper
function App() {
  return (
    <div className="min-h-screen bg-soft-white flex flex-col">
      <AppRoutes />
    </div>
  );
}

export default App;