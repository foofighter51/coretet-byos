import React from 'react';
import { Routes, Route, useSearchParams } from 'react-router-dom';
import { CollaboratorProvider } from '../contexts/CollaboratorContext';
import CollaboratorAuth from '../components/Collaborator/CollaboratorAuth';
import CollaboratorDashboard from '../components/Collaborator/CollaboratorDashboard';
import CollaboratorPlaylistView from '../components/Collaborator/CollaboratorPlaylistView';

const CollaboratorRoute: React.FC = () => {
  return (
    <CollaboratorProvider>
      <Routes>
        <Route path="invite" element={<CollaboratorInvite />} />
        <Route path="playlist/:playlistId" element={<CollaboratorPlaylistView />} />
        <Route path="/" element={<CollaboratorDashboard />} />
      </Routes>
    </CollaboratorProvider>
  );
};

const CollaboratorInvite: React.FC = () => {
  const [searchParams] = useSearchParams();
  const shareToken = searchParams.get('token');
  
  return <CollaboratorAuth shareToken={shareToken || undefined} />;
};

export default CollaboratorRoute;