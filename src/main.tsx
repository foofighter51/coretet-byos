import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Import the correct App based on V2 flag
// @ts-ignore - Dynamic import based on env
import App from './App.tsx';
// Check if we should use V2
const isV2Enabled = import.meta.env.VITE_ENABLE_V2 === 'true' || 
                    window.location.hostname === 'beta.coretet.app';

if (isV2Enabled) {
  console.log('🚀 CoreTet V2 Mode Active');
}

// Register service worker for PWA - only in production
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(_registration => {
        // ServiceWorker registration successful
      })
      .catch(_err => {
        // ServiceWorker registration failed - could add proper error handling here if needed
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
