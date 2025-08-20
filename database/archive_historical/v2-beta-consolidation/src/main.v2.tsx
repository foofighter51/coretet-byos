import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

// Conditionally import based on V2 flag
const isV2 = import.meta.env.VITE_ENABLE_V2 === 'true';

// Dynamic import based on environment
async function loadApp() {
  const module = isV2 
    ? await import('./App.v2.tsx')
    : await import('./App.tsx');
  
  return module.default;
}

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(_registration => {
        // ServiceWorker registration successful
        console.log('ServiceWorker registered');
      })
      .catch(_err => {
        // ServiceWorker registration failed
        console.error('ServiceWorker registration failed');
      });
  });
}

// Load and render the appropriate app
loadApp().then(App => {
  // Log which version is running
  console.log(`🚀 CoreTet ${isV2 ? 'V2' : 'V1'} Starting...`);
  
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
});