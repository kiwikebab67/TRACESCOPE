import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Investigations from './pages/Investigations';
import CaseDetails from './pages/CaseDetails';
import AIAssistant from './pages/AIAssistant';
import Evidence from './pages/Evidence';
import Malware from './pages/Malware';
import Connect from './pages/Connect';
import PlaceholderPage from './pages/PlaceholderPage';
import Login from './pages/Login';
import Timeline from './pages/Timeline';
import Network from './pages/Network';
import Memory from './pages/Memory';
import IOCScanner from './pages/IOCScanner';
import LogAnalysis from './pages/LogAnalysis';
import RegistryAnalysis from './pages/RegistryAnalysis';
import UsbAnalysis from './pages/UsbAnalysis';
import EmailInvestigation from './pages/EmailInvestigation';

import ChainOfCustody from './pages/ChainOfCustody';
import ThreatIntelligence from './pages/ThreatIntelligence';
import HashDatabase from './pages/HashDatabase';
import Reports from './pages/Reports';
import BrowserArtifacts from './pages/BrowserArtifacts';
import axios from 'axios';

// Configure Axios Interceptor for JWT Auth globally
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tracescope_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

function App() {
  // Simple auth state for MVP
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem('tracescope_token');
  });

  // Helper to wrap routes with AppLayout and Auth check
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? <AppLayout>{children}</AppLayout> : <Navigate to="/login" />;
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login onLogin={setIsAuthenticated} /> : <Navigate to="/" />} />
        
        {/* Core Routes */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/investigations" element={<ProtectedRoute><Investigations /></ProtectedRoute>} />
        <Route path="/investigations/:caseId" element={<ProtectedRoute><CaseDetails /></ProtectedRoute>} />
        <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
        
        {/* Modules to build next */}
        <Route path="/evidence" element={<ProtectedRoute><Evidence /></ProtectedRoute>} />
        <Route path="/malware" element={<ProtectedRoute><Malware /></ProtectedRoute>} />
        <Route path="/connect" element={<ProtectedRoute><Connect /></ProtectedRoute>} />
        
        {/* Quad-Core Analytics Modules */}
        <Route path="/timeline" element={<ProtectedRoute><Timeline /></ProtectedRoute>} />
        <Route path="/network" element={<ProtectedRoute><Network /></ProtectedRoute>} />
        <Route path="/memory" element={<ProtectedRoute><Memory /></ProtectedRoute>} />
        <Route path="/ioc-scanner" element={<ProtectedRoute><IOCScanner /></ProtectedRoute>} />
        
        {/* Scaffolded Routes (Under Construction) */}
        <Route path="/chain-of-custody" element={<ProtectedRoute><ChainOfCustody /></ProtectedRoute>} />
        <Route path="/registry" element={<ProtectedRoute><RegistryAnalysis /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><LogAnalysis /></ProtectedRoute>} />
        <Route path="/usb" element={<ProtectedRoute><UsbAnalysis /></ProtectedRoute>} />
        <Route path="/email" element={<ProtectedRoute><EmailInvestigation /></ProtectedRoute>} />
        <Route path="/browser" element={<ProtectedRoute><BrowserArtifacts /></ProtectedRoute>} />
        <Route path="/threat-intel" element={<ProtectedRoute><ThreatIntelligence /></ProtectedRoute>} />
        <Route path="/hashes" element={<ProtectedRoute><HashDatabase /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
