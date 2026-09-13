import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import '@fontsource/inter/latin-600.css';
import '@fontsource/eb-garamond/latin-400.css';
import '@fontsource/eb-garamond/latin-500.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import './style.css';
import { WorkspaceProvider } from './state.jsx';
import { App } from './App.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <WorkspaceProvider>
      <App />
    </WorkspaceProvider>
  </BrowserRouter>,
);
