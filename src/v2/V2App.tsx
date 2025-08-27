import React from 'react';
import { V2Routes } from './routes/V2Routes';
import InlinePlayer from '../components/Player/InlinePlayer';

export function V2App() {
  return (
    <div className="relative min-h-screen bg-forest-dark">
      {/* Main V2 Content */}
      <div className="pb-20"> {/* Add bottom padding for fixed playbar */}
        <V2Routes />
      </div>
      
      {/* Fixed Bottom Playbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-forest-dark border-t border-forest-light/50 shadow-2xl">
        <div className="flex justify-center py-3 px-4">
          <InlinePlayer onTrackSelect={() => {}} selectedTrack={null} />
        </div>
      </div>
    </div>
  );
}