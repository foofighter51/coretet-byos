import React, { useState } from 'react';
import { X, Music, Edit2, Check, XCircle, Play, Pause, Heart, ThumbsUp, Headphones } from 'lucide-react';
import { Track } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { useAuth } from '../../contexts/AuthContext';
import DetailedWaveform from '../Audio/DetailedWaveform';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../constants/musicData';
import { getExtendedValue, setExtendedValue, parseTrackNotes, stringifyTrackNotes } from '../../utils/metadataUtils';

interface PlaylistTrackDetailsProps {
  track: Track | null;
  playlistOwnerId: string;
  onClose: () => void;
}

const PlaylistTrackDetails: React.FC<PlaylistTrackDetailsProps> = ({ 
  track, 
  playlistOwnerId,
  onClose 
}) => {
  const { updateTrack } = useLibrary();
  const { user } = useAuth();
  const { 
    currentTrack: playingTrack, 
    isPlaying, 
    play, 
    pause, 
    seek 
  } = useAudio();
  
  const [isEditingLyrics, setIsEditingLyrics] = useState(false);
  const [editedLyrics, setEditedLyrics] = useState('');
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [editedTrack, setEditedTrack] = useState<Track | null>(null);

  if (!track) return null;

  const isOwner = user?.id === playlistOwnerId;
  const isTrackOwner = user?.id === track.user_id;
  const canEditMetadata = isOwner || isTrackOwner;
  const canEditLyrics = isTrackOwner; // Only track owner can edit lyrics
  const isCurrentlyPlaying = playingTrack?.id === track.id && isPlaying;

  const handleSaveLyrics = () => {
    if (!canEditLyrics || !track) return;
    
    updateTrack(track.id, { lyrics: editedLyrics });
    setIsEditingLyrics(false);
  };

  const handleSaveBasicMetadata = () => {
    if (!canEditMetadata || !editedTrack) return;
    
    updateTrack(track.id, {
      name: editedTrack.name,
      artist: editedTrack.artist,
      genre: editedTrack.genre,
      key: editedTrack.key,
      tempo: editedTrack.tempo,
      mood: editedTrack.mood,
    });
    setIsEditingBasic(false);
    setEditedTrack(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full lg:w-1/2 bg-forest-dark shadow-2xl z-[9999] overflow-y-auto">
      <div className="relative">
        {/* Header */}
        <div className="sticky top-0 bg-forest-dark/95 backdrop-blur-sm z-10 p-6 border-b border-forest-light">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Music className="w-6 h-6 text-accent-yellow" />
              <h2 className="font-anton text-xl text-silver uppercase tracking-wider">
                Track Details (Playlist View)
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-forest-light rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-silver" />
            </button>
          </div>
        </div>

        {/* Basic Metadata (Limited) */}
        <div className="p-6 border-b border-forest-light">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-anton text-sm text-silver uppercase tracking-wider">
              Track Information
            </h3>
            {canEditMetadata && !isEditingBasic && (
              <button
                onClick={() => {
                  setIsEditingBasic(true);
                  setEditedTrack({ ...track });
                }}
                className="p-1.5 hover:bg-forest-light rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-silver/60" />
              </button>
            )}
            {isEditingBasic && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveBasicMetadata}
                  className="p-1.5 hover:bg-forest-light rounded-lg text-accent-yellow"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingBasic(false);
                    setEditedTrack(null);
                  }}
                  className="p-1.5 hover:bg-forest-light rounded-lg text-accent-coral"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {isEditingBasic && editedTrack ? (
            // Edit mode - limited fields
            <div className="space-y-3">
              <div>
                <label className="text-xs text-silver/60">Title</label>
                <input
                  type="text"
                  value={editedTrack.name}
                  onChange={(e) => setEditedTrack({ ...editedTrack, name: e.target.value })}
                  className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver"
                />
              </div>
              <div>
                <label className="text-xs text-silver/60">Artist</label>
                <input
                  type="text"
                  value={editedTrack.artist || ''}
                  onChange={(e) => setEditedTrack({ ...editedTrack, artist: e.target.value })}
                  className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-silver/60">Key</label>
                  <select
                    value={editedTrack.key || ''}
                    onChange={(e) => setEditedTrack({ ...editedTrack, key: e.target.value })}
                    className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver"
                  >
                    <option value="">Select...</option>
                    {KEY_OPTIONS.map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-silver/60">Tempo</label>
                  <input
                    type="number"
                    value={editedTrack.tempo || ''}
                    onChange={(e) => setEditedTrack({ ...editedTrack, tempo: parseInt(e.target.value) || undefined })}
                    placeholder="BPM"
                    className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver"
                  />
                </div>
              </div>
            </div>
          ) : (
            // View mode
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-silver/60 text-sm">Title:</span>
                <span className="text-silver text-sm">{track.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver/60 text-sm">Artist:</span>
                <span className="text-silver text-sm">{track.artist || 'Unknown'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver/60 text-sm">Genre:</span>
                <span className="text-silver text-sm">{track.genre || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver/60 text-sm">Key:</span>
                <span className="text-silver text-sm">{track.key || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver/60 text-sm">Tempo:</span>
                <span className="text-silver text-sm">{track.tempo ? `${track.tempo} BPM` : 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-silver/60 text-sm">Tuning:</span>
                <span className="text-silver text-sm">{track.tuning || 'Standard'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Waveform */}
        <div className="p-6 border-b border-forest-light">
          <h3 className="font-anton text-sm text-silver uppercase tracking-wider mb-4">Waveform</h3>
          {track.url ? (
            <DetailedWaveform
              audioUrl={track.url}
              trackId={track.id}
              height={100}
              onSeek={seek}
              showTimeline={true}
            />
          ) : (
            <div className="flex items-center justify-center h-[100px] bg-forest-light/30 rounded-lg">
              <p className="text-silver/60 text-sm">No audio available</p>
            </div>
          )}
          
          {/* Simple playback control */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => {
                if (isCurrentlyPlaying) {
                  pause();
                } else {
                  play(track.id, track.url);
                }
              }}
              className="p-3 bg-accent-yellow text-forest-dark rounded-full hover:bg-accent-yellow/90"
            >
              {isCurrentlyPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>
          </div>
        </div>

        {/* Lyrics (Visible to all, editable only by track owner) */}
        <div className="p-6 border-b border-forest-light">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-anton text-sm text-silver uppercase tracking-wider">Lyrics</h3>
            {canEditLyrics && !isEditingLyrics && (
              <button
                onClick={() => {
                  setIsEditingLyrics(true);
                  setEditedLyrics(track.lyrics || '');
                }}
                className="p-1.5 hover:bg-forest-light rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4 text-silver/60" />
              </button>
            )}
            {isEditingLyrics && (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveLyrics}
                  className="p-1.5 hover:bg-forest-light rounded-lg text-accent-yellow"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setIsEditingLyrics(false);
                    setEditedLyrics('');
                  }}
                  className="p-1.5 hover:bg-forest-light rounded-lg text-accent-coral"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          
          {isEditingLyrics ? (
            <textarea
              value={editedLyrics}
              onChange={(e) => setEditedLyrics(e.target.value)}
              className="w-full h-64 bg-forest-light border border-forest-light rounded-lg p-3 text-silver resize-none"
              placeholder="Enter lyrics..."
            />
          ) : (
            <div className="bg-forest-light/30 rounded-lg p-4 min-h-[100px] max-h-[400px] overflow-y-auto">
              {track.lyrics ? (
                <pre className="text-silver text-sm whitespace-pre-wrap font-quicksand">
                  {track.lyrics}
                </pre>
              ) : (
                <p className="text-silver/60 text-sm">No lyrics added yet</p>
              )}
            </div>
          )}
        </div>

        {/* Playlist Rating (Simple) */}
        <div className="p-6">
          <h3 className="font-anton text-sm text-silver uppercase tracking-wider mb-4">Your Rating</h3>
          <div className="flex space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-forest-light rounded-lg hover:bg-forest-light/80">
              <Headphones className="w-5 h-5 text-green-500" />
              <span className="text-silver">Listened</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-forest-light rounded-lg hover:bg-forest-light/80">
              <ThumbsUp className="w-5 h-5 text-blue-500" />
              <span className="text-silver">Liked</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-forest-light rounded-lg hover:bg-forest-light/80">
              <Heart className="w-5 h-5 text-red-500" />
              <span className="text-silver">Loved</span>
            </button>
          </div>
        </div>

        {/* Note: No Extended Metadata, Notes, Tasks, or Detailed Ratings in playlist view */}
        <div className="p-6 text-center text-silver/60 text-sm">
          <p>For full track details and editing, view this track in your library.</p>
        </div>
      </div>
    </div>
  );
};

export default PlaylistTrackDetails;