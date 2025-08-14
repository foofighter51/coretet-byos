import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertTriangle } from 'lucide-react';

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showIndicator, setShowIndicator] = useState(false);
  const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');

  useEffect(() => {
    let hideTimeout: NodeJS.Timeout;

    const handleOnline = () => {
      setIsOnline(true);
      setShowIndicator(true);
      
      // Hide indicator after 3 seconds when back online
      hideTimeout = setTimeout(() => {
        setShowIndicator(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowIndicator(true);
    };

    // Check connection speed
    const checkConnectionSpeed = async () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        const effectiveType = connection?.effectiveType;
        
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setConnectionSpeed('slow');
        } else if (effectiveType === '3g') {
          setConnectionSpeed('slow');
        } else {
          setConnectionSpeed('normal');
        }
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    if (!navigator.onLine) {
      setShowIndicator(true);
    }

    checkConnectionSpeed();
    const speedInterval = setInterval(checkConnectionSpeed, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearTimeout(hideTimeout);
      clearInterval(speedInterval);
    };
  }, []);

  if (!showIndicator && isOnline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-20 left-4 z-50 transition-all duration-300 ${
        showIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div
        className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg ${
          !isOnline
            ? 'bg-red-900/90 border border-red-700'
            : connectionSpeed === 'slow'
            ? 'bg-yellow-900/90 border border-yellow-700'
            : 'bg-green-900/90 border border-green-700'
        }`}
      >
        {!isOnline ? (
          <>
            <WifiOff className="w-5 h-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-200">You're offline</p>
              <p className="text-xs text-red-300/80">Some features may be limited</p>
            </div>
          </>
        ) : connectionSpeed === 'slow' ? (
          <>
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-200">Slow connection</p>
              <p className="text-xs text-yellow-300/80">Audio may take longer to load</p>
            </div>
          </>
        ) : (
          <>
            <Wifi className="w-5 h-5 text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-200">Back online</p>
              <p className="text-xs text-green-300/80">All features available</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}