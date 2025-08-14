import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  time?: number;
}

const MobileDiagnostics: React.FC = () => {
  const { isOnline, isSlowConnection } = useConnectionStatus();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Check network connectivity
    results.push({
      name: 'Network Connection',
      status: isOnline ? 'success' : 'error',
      message: isOnline ? 'Connected to internet' : 'No internet connection'
    });

    // 2. Check connection speed
    results.push({
      name: 'Connection Speed',
      status: isSlowConnection ? 'warning' : 'success',
      message: isSlowConnection ? 'Slow connection detected' : 'Good connection speed'
    });

    // 3. Check local storage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      results.push({
        name: 'Local Storage',
        status: 'success',
        message: 'Working properly'
      });
    } catch (error) {
      results.push({
        name: 'Local Storage',
        status: 'error',
        message: 'Not available or full'
      });
    }

    // 4. Check service worker
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      results.push({
        name: 'Service Worker',
        status: registration ? 'success' : 'warning',
        message: registration ? 'Registered and active' : 'Not registered'
      });
    } else {
      results.push({
        name: 'Service Worker',
        status: 'error',
        message: 'Not supported'
      });
    }

    // 5. Check Supabase connection
    const startTime = Date.now();
    try {
      const { error } = await supabase.auth.getSession();
      const responseTime = Date.now() - startTime;
      
      results.push({
        name: 'Supabase Connection',
        status: error ? 'error' : responseTime > 3000 ? 'warning' : 'success',
        message: error ? error.message : `Connected (${responseTime}ms)`,
        time: responseTime
      });
    } catch (error) {
      results.push({
        name: 'Supabase Connection',
        status: 'error',
        message: error instanceof Error ? error.message : 'Connection failed'
      });
    }

    // 6. Check cache status
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        results.push({
          name: 'Cache Storage',
          status: 'success',
          message: `${cacheNames.length} cache(s) found`
        });
      } catch (error) {
        results.push({
          name: 'Cache Storage',
          status: 'error',
          message: 'Not accessible'
        });
      }
    }

    setDiagnostics(results);
    setIsRunning(false);
  };

  const clearAllData = async () => {
    if (!confirm('This will clear all app data and sign you out. Continue?')) return;

    try {
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      // Unregister service worker
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
      }

      // Clear storage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out
      await supabase.auth.signOut();

      // Reload
      window.location.href = '/';
    } catch (error) {
      console.error('Error clearing data:', error);
      alert('Failed to clear all data. Please try again.');
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, [isOnline, isSlowConnection]);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="font-anton text-xl text-silver mb-4">System Diagnostics</h2>
      
      <div className="space-y-3 mb-6">
        {diagnostics.map((result, index) => (
          <div key={index} className="bg-forest-light rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="font-quicksand text-sm text-silver">{result.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                result.status === 'success' ? 'bg-green-500/20 text-green-400' :
                result.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                result.status === 'error' ? 'bg-red-500/20 text-red-400' :
                'bg-silver/20 text-silver'
              }`}>
                {result.status}
              </span>
            </div>
            <p className="text-xs text-silver/60 mt-1">{result.message}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="w-full px-4 py-3 bg-accent-yellow text-forest-dark rounded-lg font-quicksand font-medium disabled:opacity-50"
        >
          {isRunning ? 'Running...' : 'Run Diagnostics Again'}
        </button>
        
        <button
          onClick={clearAllData}
          className="w-full px-4 py-3 bg-accent-coral text-white rounded-lg font-quicksand font-medium"
        >
          Clear All Data & Reset
        </button>
      </div>

      <p className="text-xs text-silver/40 mt-4 text-center">
        If issues persist, try using a different browser or device.
      </p>
    </div>
  );
};

export default MobileDiagnostics;