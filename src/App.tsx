import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorProvider } from './contexts/ErrorContext';
import { StorageProvider as StorageContextProvider } from './contexts/StorageContext';
import { GlobalErrorBoundary } from './components/ErrorHandling/GlobalErrorBoundary';
import { NetworkStatusIndicator } from './components/ErrorHandling/NetworkStatusIndicator';
import { ErrorDebugPanel } from './components/ErrorHandling/ErrorDebugPanel';
import AuthGuard from './components/Auth/AuthGuard';
import MainApp from './components/MainApp';
import CollaboratorRoute from './routes/CollaboratorRoute';
import MobileRoute from './routes/MobileRoute';
import ResetPassword from './pages/ResetPassword';
import { GoogleOAuthCallback } from './pages/GoogleOAuthCallback';
import UpdateNotification from './components/UpdateNotification';
import { checkMobileRedirect } from './utils/mobileDetection';
import './styles/theme-variables.css';
import './styles/v2-layout-fix.css';

// V2 imports
import { V2Routes } from './v2/routes/V2Routes';
import { FEATURES } from './config/features';
import DebugV2 from './v2/components/DebugV2';
import { ToastProvider } from './contexts/ToastContext';
import { ProjectProvider } from './v2/contexts/ProjectContext';

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

function App() {

  return (
    <GlobalErrorBoundary>
      <ErrorProvider>
        <BrowserRouter>
          <UpdateNotification />
          <NetworkStatusIndicator />
          <ErrorDebugPanel />
          <MobileRedirect>
            <Routes>
              {/* Mobile routes */}
              <Route path="/mobile/*" element={<MobileRoute />} />
              
              {/* Main app routes - V2 if enabled, V1 otherwise */}
              <Route path="/*" element={
                <AuthProvider>
                  <AuthGuard>
                    <StorageContextProvider>
                      {FEATURES.PROJECT_HIERARCHY ? (
                        <ToastProvider>
                          <ProjectProvider>
                            <V2Routes />
                          </ProjectProvider>
                        </ToastProvider>
                      ) : <MainApp />}
                    </StorageContextProvider>
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
              
              {/* OAuth callback routes */}
              <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
              
              {/* Redirect any unknown routes */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </MobileRedirect>
        </BrowserRouter>
      </ErrorProvider>
    </GlobalErrorBoundary>
  );
}

export default App;