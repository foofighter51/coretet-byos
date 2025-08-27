import React, { useState } from 'react';
import { V2Layout } from '../components/Layout/V2Layout';
import { PlaylistsList } from '../components/Playlists/PlaylistsList';
import { PlaylistView } from '../components/Playlists/PlaylistView';
import { useAudio } from '../../contexts/AudioContext';

export function PlaylistsPageV2() {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const audio = useAudio();

  const handlePlaylistSelect = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
  };

  const handlePlayTrack = async (trackId: string) => {
    try {
      await audio.playTrack(trackId);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  const handlePlayPlaylist = async (playlistId: string) => {
    // For now, just select the playlist
    // In a full implementation, this would load the first track from the playlist
    setSelectedPlaylistId(playlistId);
  };

  const handlePlayAll = async (trackIds: string[]) => {
    if (trackIds.length === 0) return;
    
    try {
      // Play the first track
      await audio.playTrack(trackIds[0]);
      // TODO: Implement playlist queue functionality
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  const handleBack = () => {
    setSelectedPlaylistId(null);
  };

  return (
    <V2Layout>
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {selectedPlaylistId ? (
            <PlaylistView
              playlistId={selectedPlaylistId}
              onBack={handleBack}
              onPlayTrack={handlePlayTrack}
              onPlayAll={handlePlayAll}
            />
          ) : (
            <PlaylistsList
              onPlaylistSelect={handlePlaylistSelect}
              onPlayPlaylist={handlePlayPlaylist}
            />
          )}
        </div>
      </div>
    </V2Layout>
  );
}