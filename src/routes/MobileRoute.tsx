import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { AudioProvider } from '../contexts/AudioContext';
import AuthGuard from '../components/Auth/AuthGuard';
import MobileLayout from '../components/Mobile/MobileLayout';
import MobileNowPlaying from '../components/Mobile/MobileNowPlaying';
import MobileMyLists from '../components/Mobile/MobileMyLists';
import MobileSharedLists from '../components/Mobile/MobileSharedLists';
import MobileErrorBoundary from '../components/Mobile/MobileErrorBoundary';

const MobileRoute: React.FC = () => {
  return (
    <MobileErrorBoundary>
      <AuthProvider>
        <AuthGuard>
          <AudioProvider>
            <Routes>
              <Route path="/" element={<MobileLayout />}>
                <Route index element={<Navigate to="/mobile/now" replace />} />
                <Route path="now" element={<MobileNowPlaying />} />
                <Route path="my-lists" element={<MobileMyLists />} />
                <Route path="shared" element={<MobileSharedLists />} />
              </Route>
            </Routes>
          </AudioProvider>
        </AuthGuard>
      </AuthProvider>
    </MobileErrorBoundary>
  );
};

export default MobileRoute;