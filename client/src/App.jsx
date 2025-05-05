// client/src/App.jsx
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdCreator from './pages/AdCreator';
import PricingPage from './pages/PricingPage';
import AccountPage from './pages/AccountPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import ExamplesPage from './pages/ExamplesPage'; // Import the new Examples page

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
  
  // Check if we're on the create page or account page
  const isAppPage = location.pathname === '/create' || location.pathname === '/account';

  // Check if we're on a legal page
  const isLegalPage = location.pathname === '/terms' || location.pathname === '/privacy';

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <>
      {/* Only render Navbar if not on the create or account page */}
      {!isAppPage && <Navbar />}
      
      <div className={`flex-grow ${!isAppPage ? 'min-h-screen' : ''}`}>
        <Routes location={background || location}>
          <Route path="/" element={<LandingPage />} />
          
          {/* Protected route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create" element={<AdCreator />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>
        
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/examples" element={<ExamplesPage />} /> {/* Add new Examples route */}
          <Route path="/login" element={<LandingPage />} />
          <Route path="/signup" element={<LandingPage />} />
          <Route path="/forgot-password" element={<LandingPage />} />
          
          {/* Legal Pages */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
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
      
      {/* Only render Footer if not on the app pages or legal pages */}
      {!isAppPage && !isLegalPage && <Footer />}
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