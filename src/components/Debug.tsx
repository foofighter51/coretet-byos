import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Debug: React.FC = () => {
  const { user, loading, session } = useAuth();
  
  return (
    <div style={{ position: 'fixed', top: 0, right: 0, background: 'black', color: 'white', padding: '10px', zIndex: 9999 }}>
      <div>Loading: {loading ? 'true' : 'false'}</div>
      <div>User: {user ? user.email : 'null'}</div>
      <div>Session: {session ? 'exists' : 'null'}</div>
    </div>
  );
};

export default Debug;