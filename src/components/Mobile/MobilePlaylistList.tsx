import React from 'react';
import MobilePlaylistCard from './MobilePlaylistCard';
import { Loader } from 'lucide-react';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  track_count?: number;
  duration?: string;
  updated_at: string;
  user?: {
    email: string;
  };
  isShared?: boolean;
}

interface PlaylistSection {
  title: string;
  playlists: Playlist[];
}

interface MobilePlaylistListProps {
  sections?: PlaylistSection[];
  playlists?: Playlist[];
  loading?: boolean;
  emptyMessage?: string;
  onPlaylistClick: (playlist: Playlist) => void;
  onPlaylistOptions?: (playlist: Playlist, e: React.MouseEvent) => void;
}

const MobilePlaylistList: React.FC<MobilePlaylistListProps> = ({
  sections,
  playlists,
  loading = false,
  emptyMessage = 'No playlists found',
  onPlaylistClick,
  onPlaylistOptions
}) => {
  const formatLastUpdated = (date: string) => {
    const now = new Date();
    const updated = new Date(date);
    const diffMs = now.getTime() - updated.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-silver opacity-60 animate-spin" />
      </div>
    );
  }

  // If sections are provided, render sectioned view
  if (sections) {
    return (
      <div className="overflow-y-auto custom-scrollbar">
        {sections.map((section, index) => (
          <div key={section.title} className={index > 0 ? 'mt-8' : ''}>
            <h2 className="text-silver opacity-40 uppercase text-xs font-semibold mb-3 px-4">
              {section.title}
            </h2>
            <div className="space-y-3 px-4">
              {section.playlists.length === 0 ? (
                <p className="text-silver opacity-40 text-sm">{emptyMessage}</p>
              ) : (
                section.playlists.map((playlist) => (
                  <MobilePlaylistCard
                    key={playlist.id}
                    name={playlist.name}
                    trackCount={playlist.track_count || 0}
                    duration={playlist.duration}
                    lastUpdated={formatLastUpdated(playlist.updated_at)}
                    owner={playlist.user?.email}
                    isShared={playlist.isShared}
                    onClick={() => onPlaylistClick(playlist)}
                    onOptionsClick={onPlaylistOptions ? (e) => onPlaylistOptions(playlist, e) : undefined}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Otherwise render flat list
  if (!playlists || playlists.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-silver opacity-60">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto custom-scrollbar space-y-3 px-4">
      {playlists.map((playlist) => (
        <MobilePlaylistCard
          key={playlist.id}
          name={playlist.name}
          trackCount={playlist.track_count || 0}
          duration={playlist.duration}
          lastUpdated={formatLastUpdated(playlist.updated_at)}
          owner={playlist.user?.email}
          isShared={playlist.isShared}
          onClick={() => onPlaylistClick(playlist)}
          onOptionsClick={onPlaylistOptions ? (e) => onPlaylistOptions(playlist, e) : undefined}
        />
      ))}
    </div>
  );
};

export default MobilePlaylistList;