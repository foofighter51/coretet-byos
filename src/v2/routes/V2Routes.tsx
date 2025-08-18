import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ToastProvider } from '../../contexts/ToastContext';

// V2 Component imports
import SongwriterDashboard from '../components/Dashboard/SongwriterDashboard';
import WorkDetailEnhanced from '../components/Works/WorkDetailEnhanced';
import ProjectList from '../components/Projects/ProjectList';

// Import existing storage settings
import { StorageSettings } from '../../pages/StorageSettings';

// For now, import V1 components as placeholders for other routes
import MainApp from '../../components/MainApp';

export function V2Routes() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <ToastProvider>
      <ProjectProvider>
        <Routes>
          {/* V2 Routes - Songwriter focus */}
          <Route path="/" element={<SongwriterDashboard />} />
          <Route path="/works" element={<WorksListPlaceholder />} />
          <Route path="/work/:workId" element={<WorkDetailEnhanced />} />
          <Route path="/library" element={<AudioLibraryPlaceholder />} />
          <Route path="/recent" element={<RecentActivityPlaceholder />} />
          <Route path="/collaborations" element={<CollaborationsPlaceholder />} />
          <Route path="/storage" element={<StorageSettings />} />
          
          {/* Keep V1 routes accessible */}
          <Route path="/v1/*" element={<MainApp />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectProvider>
    </ToastProvider>
  );
}

// Temporary placeholder components

function WorksListPlaceholder() {
  return (
    <div className="min-h-screen bg-forest-dark p-8">
      <h2 className="font-anton text-2xl text-silver mb-4">My Works</h2>
      <p className="font-quicksand text-silver/60">Your songs and compositions will appear here</p>
    </div>
  );
}


function AudioLibraryPlaceholder() {
  return (
    <div className="min-h-screen bg-forest-dark p-8">
      <h2 className="font-anton text-2xl text-silver mb-4">Audio Library</h2>
      <p className="font-quicksand text-silver/60">All your uploaded audio files</p>
    </div>
  );
}

function RecentActivityPlaceholder() {
  return (
    <div className="min-h-screen bg-forest-dark p-8">
      <h2 className="font-anton text-2xl text-silver mb-4">Recent Activity</h2>
      <p className="font-quicksand text-silver/60">Your recent uploads and edits</p>
    </div>
  );
}

function CollaborationsPlaceholder() {
  return (
    <div className="min-h-screen bg-forest-dark p-8">
      <h2 className="font-anton text-2xl text-silver mb-4">Collaborations</h2>
      <p className="font-quicksand text-silver/60">Works you're collaborating on</p>
    </div>
  );
}