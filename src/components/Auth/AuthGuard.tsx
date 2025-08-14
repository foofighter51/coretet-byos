import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import AuthPage from './AuthPage';
import { useConnectionStatus } from '../../hooks/useConnectionStatus';
import MobileDiagnostics from '../Mobile/MobileDiagnostics';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const AuthGuard: React.FC<AuthGuardProps> = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const { isOnline } = useConnectionStatus();
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  useEffect(() => {
    // Show slow warning after 3 seconds of loading
    const timer = setTimeout(() => {
      if (loading) {
        setShowSlowWarning(true);
      }
    }, 3000);

    // Show diagnostics after 8 seconds
    const diagnosticsTimer = setTimeout(() => {
      if (loading) {
        setShowDiagnostics(true);
      }
    }, 8000);

    return () => {
      clearTimeout(timer);
      clearTimeout(diagnosticsTimer);
    };
  }, [loading]);

  if (loading) {
    if (showDiagnostics) {
      return (
        <div className="min-h-screen bg-forest-dark overflow-y-auto">
          <div className="pt-8">
            <h1 className="font-anton text-2xl text-accent-yellow text-center mb-4">
              Loading Issues Detected
            </h1>
            <MobileDiagnostics />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 border-3 border-accent-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-anton text-xl text-silver mb-2">Loading CoreTet</h2>
          <p className="font-quicksand text-silver/60 text-sm">
            {!isOnline ? 'You appear to be offline. Please check your connection.' : 
             showSlowWarning ? 'This is taking longer than usual. Please wait...' : 
             'Initializing...'}
          </p>
          {showSlowWarning && (
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand text-sm"
            >
              Reload App
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (requireAdmin && !isAdmin) {
    return (
      <div className="min-h-screen bg-forest-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-anton text-2xl text-silver mb-4">Access Denied</h1>
          <p className="font-quicksand text-silver/80">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;