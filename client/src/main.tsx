import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProjectDashboard } from './pages/ProjectDashboard';
import { Workspace } from './pages/Workspace';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ProjectDashboard />} />
        <Route path="/project/:id" element={<Workspace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
