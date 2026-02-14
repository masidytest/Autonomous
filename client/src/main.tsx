import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { Workspace } from './pages/Workspace';
import { Auth } from './pages/Auth';
import { Dashboard } from './pages/Dashboard';
import { Agents } from './pages/Agents';
import { Library } from './pages/Library';
import { AuthCallback } from './pages/AuthCallback';
import { Docs } from './pages/Docs';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { ToastContainer } from './components/Toast';
import { UpgradeModal } from './components/UpgradeModal';
import { InstallPrompt } from './components/InstallPrompt';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectDashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/library" element={<Library />} />
        <Route path="/docs" element={<Docs />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/project/:id" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
    <ToastContainer />
    <UpgradeModal />
    <InstallPrompt />
  </React.StrictMode>,
);
