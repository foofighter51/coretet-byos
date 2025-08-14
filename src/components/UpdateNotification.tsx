import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => {
        setRegistration(reg);

        // Check for updates every 30 seconds
        const interval = setInterval(() => {
          reg.update();
        }, 30000);

        // Listen for new service worker waiting
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is ready
                setShowUpdate(true);
              }
            });
          }
        });

        return () => clearInterval(interval);
      });

      // Listen for controller change (new SW activated)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (registration?.waiting) {
      // Tell SW to skip waiting
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
      <div className="bg-forest-main border border-accent-yellow rounded-lg p-4 shadow-lg flex items-center gap-4 max-w-sm">
        <RefreshCw className="w-5 h-5 text-accent-yellow animate-spin" />
        <div className="flex-1">
          <p className="text-silver font-quicksand text-sm font-semibold">
            Update Available
          </p>
          <p className="text-silver opacity-60 font-quicksand text-xs">
            A new version is ready to install
          </p>
        </div>
        <button
          onClick={handleUpdate}
          className="px-3 py-1 bg-accent-yellow text-forest-dark rounded hover:bg-yellow-400 transition-colors text-sm font-quicksand font-semibold"
        >
          Update
        </button>
        <button
          onClick={() => setShowUpdate(false)}
          className="p-1 text-silver opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification;