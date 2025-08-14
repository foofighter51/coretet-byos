import React, { useState } from 'react';
import { X, Music, Play, Pause } from 'lucide-react';
import { Track } from '../../types';
import { useTrackVariations } from '../../hooks/useTrackVariations';
import { useAudio } from '../../contexts/AudioContext';

interface CreateVariationModalProps {
  tracks: Track[];
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateVariationModal: React.FC<CreateVariationModalProps> = ({
  tracks,
  onClose,
  onSuccess
}) => {
  const [selectedPrimaryId, setSelectedPrimaryId] = useState<string>(tracks[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const { createVariationGroup } = useTrackVariations();
  const { currentTrack, isPlaying, play, pause } = useAudio();

  const handleCreate = async () => {
    if (!selectedPrimaryId || tracks.length < 2) return;
    
    setIsCreating(true);
    const trackIds = tracks.map(t => t.id);
    
    const success = await createVariationGroup(trackIds, selectedPrimaryId);
    
    if (success) {
      onSuccess();
      onClose();
    }
    
    setIsCreating(false);
  };

  const handlePlayPause = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (currentTrack === track.id && isPlaying) {
      pause();
    } else {
      play(track.id, track.url);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-forest-main rounded-xl p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-accent-yellow">
            Create Variation Group
          </h2>
          <button
            onClick={onClose}
            className="text-silver hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Description */}
        <p className="text-silver/80 text-sm mb-6">
          Select which track should be the primary version. All other tracks will become variations of the primary track.
        </p>

        {/* Track Selection */}
        <div className="space-y-2 mb-6 overflow-y-auto flex-1">
          {tracks.map(track => (
            <label
              key={track.id}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                selectedPrimaryId === track.id
                  ? 'bg-accent-yellow/20 border-accent-yellow'
                  : 'bg-forest-dark border-neutral-800 hover:bg-forest-light hover:border-neutral-700'
              }`}
            >
              <input
                type="radio"
                name="primary"
                value={track.id}
                checked={selectedPrimaryId === track.id}
                onChange={(e) => setSelectedPrimaryId(e.target.value)}
                className="sr-only"
              />
              
              {/* Play Button */}
              <button
                onClick={(e) => handlePlayPause(track, e)}
                className="w-8 h-8 bg-accent-coral/20 border border-accent-coral rounded-full flex items-center justify-center hover:bg-accent-coral hover:text-silver transition-all mr-3"
                title={currentTrack === track.id && isPlaying ? 'Pause' : 'Play'}
              >
                {currentTrack === track.id && isPlaying ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </button>
              
              <Music className="w-4 h-4 text-silver/60 mr-3" />
              
              <div className="flex-1">
                <div className="font-medium text-silver">{track.name}</div>
                <div className="flex items-center gap-2 text-xs text-silver/60">
                  {track.artist && <span>{track.artist}</span>}
                  {track.duration && <span>{Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}</span>}
                </div>
              </div>
              
              {selectedPrimaryId === track.id && (
                <div className="bg-accent-yellow text-forest-dark px-2 py-1 rounded text-xs font-semibold">
                  Primary
                </div>
              )}
            </label>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-forest-light text-silver rounded-lg hover:bg-forest-light/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !selectedPrimaryId}
            className="px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Variations'}
          </button>
        </div>
      </div>
    </div>
  );
};