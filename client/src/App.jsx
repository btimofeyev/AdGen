// client/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AdCreator from './pages/AdCreator';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/create" element={<AdCreator />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;