import { useState, useEffect } from 'react';

export const useConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Check connection speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const updateConnectionStatus = () => {
        // Consider connection slow if it's 2g or slower
        const slowTypes = ['slow-2g', '2g'];
        setIsSlowConnection(
          slowTypes.includes(connection.effectiveType) || 
          connection.saveData === true
        );
      };

      updateConnectionStatus();
      connection.addEventListener('change', updateConnectionStatus);

      return () => {
        window.removeEventListener('online', updateOnlineStatus);
        window.removeEventListener('offline', updateOnlineStatus);
        connection.removeEventListener('change', updateConnectionStatus);
      };
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return { isOnline, isSlowConnection };
};