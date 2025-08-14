import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { GlobalErrorBoundary } from './components/ErrorHandling/GlobalErrorBoundary';
import { NetworkStatusIndicator } from './components/ErrorHandling/NetworkStatusIndicator';
import { ErrorDebugPanel } from './components/ErrorHandling/ErrorDebugPanel';
import AuthGuard from './components/Auth/AuthGuard';
import MainApp from './components/MainApp';
import CollaboratorRoute from './routes/CollaboratorRoute';
import MobileRoute from './routes/MobileRoute';
import ResetPassword from './pages/ResetPassword';
import UpdateNotification from './components/UpdateNotification';
import { checkMobileRedirect } from './utils/mobileDetection';
import { useV2 } from './hooks/useFeatureFlag';
import { V2Routes } from './v2/routes/V2Routes';
import './styles/theme-variables.css';

// Component to handle mobile detection and redirection
function MobileRedirect({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const redirectPath = checkMobileRedirect(location.pathname);
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
}

function AppContent() {
  const { isV2 } = useV2();
  
  // Show V2 banner in development
  useEffect(() => {
    if (isV2 && import.meta.env.DEV) {
      console.log('🚀 CoreTet V2 Mode Active');
    }
  }, [isV2]);

  return (
    <Routes>
      {/* Mobile routes - work for both V1 and V2 */}
      <Route path="/mobile/*" element={<MobileRoute />} />
      
      {/* V2 Routes when enabled */}
      {isV2 && (
        <Route path="/v2/*" element={
          <AuthProvider>
            <AuthGuard>
              <V2Routes />
            </AuthGuard>
          </AuthProvider>
        } />
      )}
      
      {/* Main app routes - V1 or V2 based on feature flag */}
      <Route path="/" element={
        <AuthProvider>
          <AuthGuard>
            {isV2 ? <V2Routes /> : <MainApp />}
          </AuthGuard>
        </AuthProvider>
      } />
      
      {/* V1 explicit routes (always available for fallback) */}
      <Route path="/v1/*" element={
        <AuthProvider>
          <AuthGuard>
            <MainApp />
          </AuthGuard>
        </AuthProvider>
      } />
      
      {/* Collaborator routes */}
      <Route path="/collaborate/*" element={<CollaboratorRoute />} />
      
      {/* Password reset route */}
      <Route path="/reset-password" element={
        <AuthProvider>
          <ResetPassword />
        </AuthProvider>
      } />
      
      {/* Redirect any unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <ErrorProvider>
        <BrowserRouter>
          <UpdateNotification />
          <NetworkStatusIndicator />
          <ErrorDebugPanel />
          <MobileRedirect>
            <AppContent />
          </MobileRedirect>
        </BrowserRouter>
      </ErrorProvider>
    </GlobalErrorBoundary>
  );
}

export default App;