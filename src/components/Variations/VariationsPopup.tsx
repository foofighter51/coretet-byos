import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Star } from 'lucide-react';
import { Track } from '../../types/database.types';
import { useTrackVariations } from '../../hooks/useTrackVariations';
import { useAudio } from '../../contexts/AudioContext';
import { formatDuration } from '../../utils/trackUtils';

interface VariationsPopupProps {
  trackId: string;
  trackName: string;
  anchorElement: HTMLElement;
  onClose: () => void;
  onOpenManagement?: (variations: Track[]) => void;
}

export const VariationsPopup: React.FC<VariationsPopupProps> = ({
  trackId,
  trackName,
  anchorElement,
  onClose,
  onOpenManagement
}) => {
  const [variations, setVariations] = useState<Track[]>([]);
  const [primaryTrackId, setPrimaryTrackId] = useState<string | null>(null);
  const { getVariations, unlinkVariation, unlinkAllVariations } = useTrackVariations();
  const { currentTrack, isPlaying, play, pause } = useAudio();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadVariations();
  }, [trackId]);

  useEffect(() => {
    // Position popup relative to anchor element
    if (popupRef.current && anchorElement) {
      const rect = anchorElement.getBoundingClientRect();
      const popup = popupRef.current;
      
      // Position below the anchor, centered
      popup.style.top = `${rect.bottom + 8}px`;
      popup.style.left = `${rect.left + rect.width / 2}px`;
      popup.style.transform = 'translateX(-50%)';
      
      // Adjust if popup goes off screen
      const popupRect = popup.getBoundingClientRect();
      if (popupRect.right > window.innerWidth - 20) {
        popup.style.left = 'auto';
        popup.style.right = '20px';
        popup.style.transform = 'none';
      }
      if (popupRect.left < 20) {
        popup.style.left = '20px';
        popup.style.transform = 'none';
      }
    }
  }, [anchorElement, variations]);

  const loadVariations = async () => {
    const tracks = await getVariations(trackId);
    setVariations(tracks);
    
    // Find the primary track
    const primary = tracks.find(t => !t.primary_track_id);
    setPrimaryTrackId(primary?.id || null);
  };

  const handlePlayTrack = (track: Track) => {
    if (!track.url) return;
    
    if (currentTrack === track.id && isPlaying) {
      pause();
    } else {
      play(track.id, track.url);
    }
  };

  const handleUnlink = async (variantId: string) => {
    if (await unlinkVariation(variantId)) {
      await loadVariations();
      if (variations.length <= 2) {
        onClose(); // Close if only one track remains
      }
    }
  };

  const handleUnlinkAll = async () => {
    if (!primaryTrackId) return;
    
    if (await unlinkAllVariations(primaryTrackId)) {
      onClose();
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node) && 
          !anchorElement.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, anchorElement]);

  return (
    <div
      ref={popupRef}
      className="variations-popup fixed bg-forest-main backdrop-blur-lg border border-silver/20 rounded-xl p-4 shadow-xl z-50 min-w-[350px] max-w-[450px]"
    >
      {/* Header */}
      <div className="popup-header flex justify-between items-center mb-3 pb-3 border-b border-neutral-800">
        <h3 className="popup-title text-accent-yellow font-semibold">
          Variations of "{trackName}"
        </h3>
        <button
          onClick={onClose}
          className="close-btn text-silver hover:text-white transition-opacity"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Variations List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto">
        {variations.map(track => {
          const isPrimary = track.id === primaryTrackId;
          const isCurrent = track.id === trackId;
          const isPlayingThis = currentTrack === track.id && isPlaying;

          return (
            <div
              key={track.id}
              className={`variation-item bg-forest-dark border rounded-lg p-3 flex items-center gap-3 cursor-pointer transition-all ${
                isCurrent ? 'border-accent-yellow bg-accent-yellow/10' : 'border-neutral-800 hover:bg-forest-light hover:border-neutral-700'
              }`}
              onClick={() => handlePlayTrack(track)}
            >
              {/* Play Button */}
              <button
                className="play-btn w-8 h-8 bg-accent-coral/20 border border-accent-coral rounded-full flex items-center justify-center hover:bg-accent-coral hover:text-silver transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayTrack(track);
                }}
              >
                {isPlayingThis ? (
                  <span className="text-xs">||</span>
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </button>

              {/* Track Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-silver truncate">
                  {track.name}
                </div>
                <div className="text-xs text-silver/60">
                  {formatDuration(track.duration || 0)}
                  {track.artist && ` • ${track.artist}`}
                </div>
              </div>

              {/* Primary Badge */}
              {isPrimary && (
                <div className="primary-badge bg-accent-yellow text-forest-dark px-2 py-1 rounded-full text-xs font-semibold">
                  Primary
                </div>
              )}

              {/* Unlink Button */}
              {!isPrimary && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnlink(track.id);
                  }}
                  className="text-silver/40 hover:text-accent-coral transition-colors text-xs"
                >
                  Unlink
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-4 pt-3 border-t border-neutral-800 flex gap-2">
        <button
          onClick={() => onOpenManagement?.(variations)}
          className="action-btn primary flex-1 px-3 py-2 bg-accent-yellow/20 border border-accent-yellow text-accent-yellow rounded-lg text-sm hover:bg-accent-yellow/30 transition-all"
        >
          Manage Variations
        </button>
        <button
          onClick={handleUnlinkAll}
          className="action-btn px-3 py-2 bg-forest-dark border border-neutral-800 text-silver rounded-lg text-sm hover:bg-forest-light hover:border-neutral-700 transition-all"
        >
          Unlink All
        </button>
      </div>
    </div>
  );
};