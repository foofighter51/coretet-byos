import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Plus, Trash2, Music } from 'lucide-react';
import { V2Playlist, usePlaylists } from '../../hooks/usePlaylists';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';

interface Track {
  id: string;
  name: string;
  file_name: string;
  category: string;
  created_at: string;
  duration?: number;
}

interface PlaylistViewProps {
  playlistId: string;
  onBack: () => void;
  onPlayTrack?: (trackId: string) => void;
  onPlayAll?: (trackIds: string[]) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlistId,
  onBack,
  onPlayTrack,
  onPlayAll
}) => {
  const { user } = useAuth();
  const { playlists, removeTrackFromPlaylist, addTrackToPlaylist } = usePlaylists();
  const [playlist, setPlaylist] = useState<V2Playlist | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddTracks, setShowAddTracks] = useState(false);
  const [removingTrack, setRemovingTrack] = useState<string | null>(null);

  // Get playlist from loaded playlists
  useEffect(() => {
    const foundPlaylist = playlists.find(p => p.id === playlistId);
    setPlaylist(foundPlaylist || null);
  }, [playlists, playlistId]);

  // Load playlist tracks
  useEffect(() => {
    if (playlist && playlist.trackIds.length > 0) {
      loadPlaylistTracks();
    } else {
      setTracks([]);
      setLoading(false);
    }
  }, [playlist?.id, playlist?.trackIds.length]);

  // Load available tracks for adding
  useEffect(() => {
    if (showAddTracks) {
      loadAvailableTracks();
    }
  }, [showAddTracks, playlist]);

  const loadPlaylistTracks = async () => {
    if (!playlist || playlist.trackIds.length === 0) {
      setTracks([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, name, file_name, category, created_at, duration')
        .in('id', playlist.trackIds)
        .eq('user_id', user?.id);

      if (error) throw error;

      // Maintain playlist order
      const orderedTracks = playlist.trackIds
        .map(id => data?.find(track => track.id === id))
        .filter(Boolean) as Track[];

      setTracks(orderedTracks);
    } catch (error) {
      console.error('Error loading playlist tracks:', error);
      setTracks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, name, file_name, category, created_at, duration')
        .eq('user_id', user?.id)
        .not('id', 'in', `(${playlist?.trackIds.join(',') || ''})`)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAvailableTracks(data || []);
    } catch (error) {
      console.error('Error loading available tracks:', error);
      setAvailableTracks([]);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    if (!playlist) return;
    
    setRemovingTrack(trackId);
    try {
      const success = await removeTrackFromPlaylist(playlist.id, trackId);
      if (success) {
        setTracks(prev => prev.filter(track => track.id !== trackId));
      }
    } catch (error) {
      console.error('Error removing track:', error);
    } finally {
      setRemovingTrack(null);
    }
  };

  const handleAddTrack = async (trackId: string) => {
    if (!playlist) return;
    
    try {
      const success = await addTrackToPlaylist(playlist.id, trackId);
      if (success) {
        // Don't close the modal - allow adding multiple tracks
        // Remove the added track from available tracks list
        setAvailableTracks(prev => prev.filter(track => track.id !== trackId));
        // Force refresh the playlist tracks immediately
        await loadPlaylistTracks();
      }
    } catch (error) {
      console.error('Error adding track:', error);
    }
  };

  const handlePlayAll = () => {
    if (onPlayAll && tracks.length > 0) {
      onPlayAll(tracks.map(t => t.id));
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!playlist) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">Playlist not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {playlist.description}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {playlist.trackCount} track{playlist.trackCount !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {tracks.length > 0 && (
            <button
              onClick={handlePlayAll}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Play All</span>
            </button>
          )}
          
          <button
            onClick={() => setShowAddTracks(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Tracks</span>
          </button>
        </div>
      </div>

      {/* Tracks List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12">
          <Music className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            No tracks in this playlist
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add some tracks to get started
          </p>
          <button
            onClick={() => setShowAddTracks(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Tracks</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {tracks.map((track, index) => (
              <div
                key={track.id}
                className={`p-4 flex items-center space-x-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  removingTrack === track.id ? 'opacity-50' : ''
                }`}
              >
                <div className="text-sm text-gray-500 dark:text-gray-400 w-8 text-center">
                  {index + 1}
                </div>
                
                <button
                  onClick={() => onPlayTrack?.(track.id)}
                  className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  disabled={removingTrack === track.id}
                >
                  <Play className="w-4 h-4" />
                </button>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {track.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {track.file_name}
                  </p>
                </div>
                
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDuration(track.duration)}
                </div>
                
                <button
                  onClick={() => handleRemoveTrack(track.id)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  disabled={removingTrack === track.id}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Tracks Modal */}
      {showAddTracks && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Add Tracks to "{playlist.name}"
              </h2>
              <button
                onClick={() => setShowAddTracks(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {availableTracks.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    No tracks available to add
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {availableTracks.map((track) => (
                    <div
                      key={track.id}
                      className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 dark:text-white truncate">
                          {track.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {track.file_name}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => handleAddTrack(track.id)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Footer with Done button */}
            <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowAddTracks(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};