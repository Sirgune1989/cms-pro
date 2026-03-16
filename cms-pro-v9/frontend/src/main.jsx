import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { CmsProvider } from './context/CmsContext';
import './styles/variables.css';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <CmsProvider>
        <App />
        <Toaster position="bottom-right" toastOptions={{
          style: { background: '#1a2233', color: '#f0f4f8', border: '1px solid rgba(255,255,255,.07)' }
        }} />
      </CmsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
