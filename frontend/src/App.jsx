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

function App() {
  // Simple auth state for MVP
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
        <Route path="/chain-of-custody" element={<ProtectedRoute><PlaceholderPage moduleName="Chain of Custody" /></ProtectedRoute>} />
        <Route path="/registry" element={<ProtectedRoute><PlaceholderPage moduleName="Registry Analysis" /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><PlaceholderPage moduleName="Log Analysis" /></ProtectedRoute>} />
        <Route path="/usb" element={<ProtectedRoute><PlaceholderPage moduleName="USB Analysis" /></ProtectedRoute>} />
        <Route path="/email" element={<ProtectedRoute><PlaceholderPage moduleName="Email Investigation" /></ProtectedRoute>} />
        <Route path="/browser" element={<ProtectedRoute><PlaceholderPage moduleName="Browser Artifacts" /></ProtectedRoute>} />
        <Route path="/threat-intel" element={<ProtectedRoute><PlaceholderPage moduleName="Threat Intelligence" /></ProtectedRoute>} />
        <Route path="/hashes" element={<ProtectedRoute><PlaceholderPage moduleName="Hash Database" /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PlaceholderPage moduleName="Forensic Reports" /></ProtectedRoute>} />
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
