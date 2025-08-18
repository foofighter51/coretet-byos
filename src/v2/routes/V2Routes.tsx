import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProjectProvider } from '../contexts/ProjectContext';
import { ToastProvider } from '../../contexts/ToastContext';

// V2 Component imports
import SongwriterDashboard from '../components/Dashboard/SongwriterDashboard';
import WorkDetailEnhanced from '../components/Works/WorkDetailEnhanced';
import ProjectList from '../components/Projects/ProjectList';

// Import V2 pages
import { StorageSettingsV2 } from '../pages/StorageSettingsV2';
import { WorksListV2 } from '../pages/WorksListV2';
import { WorkDetailV2 } from '../pages/WorkDetailV2';
import { AdminDashboard } from '../pages/AdminDashboard';

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
          <Route path="/works" element={<WorksListV2 />} />
          <Route path="/work/:workId" element={<WorkDetailV2 />} />
          <Route path="/library" element={<AudioLibraryPlaceholder />} />
          <Route path="/recent" element={<RecentActivityPlaceholder />} />
          <Route path="/collaborations" element={<CollaborationsPlaceholder />} />
          <Route path="/storage" element={<StorageSettingsV2 />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Keep V1 routes accessible */}
          <Route path="/v1/*" element={<MainApp />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProjectProvider>
    </ToastProvider>
  );
}

// Import V2 Layout
import { V2Layout } from '../components/Layout/V2Layout';

// Temporary placeholder components

function WorksListPlaceholder() {
  return (
    <V2Layout 
      title="My Works" 
      subtitle="Your songs and compositions will appear here"
    >
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <p className="font-quicksand text-silver/60 text-lg">
          No works created yet. Start by creating your first work from the dashboard.
        </p>
      </div>
    </V2Layout>
  );
}

function AudioLibraryPlaceholder() {
  return (
    <V2Layout 
      title="Audio Library" 
      subtitle="All your uploaded audio files"
    >
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎧</div>
        <p className="font-quicksand text-silver/60 text-lg">
          Your audio library will appear here once you upload files.
        </p>
      </div>
    </V2Layout>
  );
}

function RecentActivityPlaceholder() {
  return (
    <V2Layout 
      title="Recent Activity" 
      subtitle="Your recent uploads and edits"
    >
      <div className="text-center py-12">
        <div className="text-6xl mb-4">⏱️</div>
        <p className="font-quicksand text-silver/60 text-lg">
          Recent activity will be tracked here as you use CoreTet.
        </p>
      </div>
    </V2Layout>
  );
}

function CollaborationsPlaceholder() {
  return (
    <V2Layout 
      title="Collaborations" 
      subtitle="Works you're collaborating on"
    >
      <div className="text-center py-12">
        <div className="text-6xl mb-4">👥</div>
        <p className="font-quicksand text-silver/60 text-lg">
          Collaborative works will appear here when you start working with others.
        </p>
      </div>
    </V2Layout>
  );
}