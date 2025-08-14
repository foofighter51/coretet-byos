import React, { useState } from 'react';
import { Play, Pause, Tag, Music, Trash2 } from 'lucide-react';
import { Track } from '../../types';
import { useAudio } from '../../contexts/AudioContext';
import { formatDuration } from '../../utils/trackUtils';
import { getTagColor } from '../../utils/tags';

interface TrackCardProps {
  track: Track;
  onSelect?: (track: Track) => void;
  onEditMetadata?: (track: Track) => void;
  onDeleteTrack?: (trackId: string) => void;
  isInPlaylist?: boolean;
  isSelected?: boolean;
}

const TrackCard: React.FC<TrackCardProps> = ({ 
  track, 
  onSelect, 
  onEditMetadata,
  onDeleteTrack,
  isInPlaylist = false,
  isSelected = false
}) => {
  const { currentTrack, isPlaying, play, pause } = useAudio();
  const isCurrentTrack = currentTrack === track.id;
  const [isDragging, setIsDragging] = useState(false);

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      play(track.id, track.url);
    }
  };

  const handleCardClick = () => {
    onSelect?.(track);
  };
  
  const handleCardDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEditMetadata?.(track);
  };


  return (
    <div 
      className={`bg-forest-light rounded-lg p-4 hover:bg-forest-light/80 transition-all duration-200 cursor-move group animate-slide-up ${isDragging ? 'opacity-50' : ''} ${isSelected ? 'ring-2 ring-accent-yellow' : ''}`}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('trackId', track.id);
        e.dataTransfer.setData('trackIds', JSON.stringify([track.id]));
        setIsDragging(true);
      }}
      onDragEnd={() => {
        setIsDragging(false);
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-quicksand font-semibold text-silver text-sm truncate">
            {track.name}
          </h3>
          <p className="font-quicksand text-xs text-silver/80 mt-1">
            {formatDuration(track.duration || 0)}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePlayPause}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${
              isCurrentTrack && isPlaying
                ? 'bg-accent-coral text-silver'
                : 'bg-accent-yellow text-forest-dark hover:bg-accent-yellow/90'
            }`}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDeleteTrack?.(track.id);
            }}
            className="w-6 h-6 text-silver/60 hover:text-accent-coral transition-colors"
            title={isInPlaylist ? "Remove from playlist" : "Delete track"}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tags */}
      {track.tags.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {track.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-silver ${getTagColor(tag)}`}
              >
                {tag}
              </span>
            ))}
            {track.tags.length > 3 && (
              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium text-silver/60 bg-forest-dark">
                +{track.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* User Metadata */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-4">
            {track.key && (
              <span className="text-accent-yellow font-medium">{track.key}</span>
            )}
            {track.tempo && (
              <span className="text-silver/80">{track.tempo} BPM</span>
            )}
            {track.timeSignature && (
              <span className="text-silver/80">{track.timeSignature}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {track.mood && (
              <>
                <div className="w-2 h-2 rounded-full bg-accent-yellow" />
                <span className="font-quicksand text-xs text-silver/80">{track.mood}</span>
              </>
            )}
            {track.genre && (
              <span className="font-quicksand text-xs text-silver/60">• {track.genre}</span>
            )}
          </div>
        </div>

        {/* Notes preview */}
        {track.notes && (
          <div className="mt-2 p-2 bg-forest-dark rounded text-xs text-silver/80 font-quicksand">
            {track.notes.length > 50 ? `${track.notes.substring(0, 50)}...` : track.notes}
          </div>
        )}

        {/* Add metadata prompt if empty */}
        {!track.key && !track.tempo && !track.mood && !track.genre && (
          <div className="flex items-center space-x-2 text-xs text-silver/60 opacity-0 group-hover:opacity-100 transition-opacity">
            <Music className="w-3 h-3" />
            <span className="font-quicksand">Click edit to add metadata</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackCard;