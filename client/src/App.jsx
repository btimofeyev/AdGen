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
  const background = location.state?.background;

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <>
      <Routes location={background || location}>
        <Route path="/" element={<LandingPage />} />
        
        {/* Protected route */}
        <Route element={<ProtectedRoute />}>
          <Route path="/create" element={<AdCreator />} />
        </Route>
        
        <Route path="/login" element={<LandingPage />} />
        <Route path="/signup" element={<LandingPage />} />
      </Routes>
      
      {/* Modals */}
      {location.pathname === '/login' && (
        <Login isOpen={true} onClose={handleClose} />
      )}
      {location.pathname === '/signup' && (
        <Signup isOpen={true} onClose={handleClose} />
      )}
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