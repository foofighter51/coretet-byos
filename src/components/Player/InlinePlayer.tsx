import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { formatDuration } from '../../utils/trackUtils';
import { Track } from '../../types';

interface InlinePlayerProps {
  onTrackSelect?: (track: Track) => void;
  selectedTrack?: Track | null;
}

const InlinePlayer: React.FC<InlinePlayerProps> = ({ onTrackSelect, selectedTrack }) => {
  const { 
    isPlaying, 
    play, 
    pause, 
    volume, 
    setVolume,
    currentTrack,
    currentTime,
    duration,
    seek
  } = useAudio();
  
  const { tracks } = useLibrary();
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Get the current track details
  const currentTrackDetails = currentTrack ? tracks.find(t => t.id === currentTrack) : null;
  const progress = duration > 0 ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (currentTrack) {
      if (isPlaying) {
        pause();
      } else {
        play(currentTrack, ''); // URL will be fetched by audio context
      }
    }
  };

  const handleSeekMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    updateSeek(e, true);
    setIsDragging(true);
  };

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDragging) {
      updateSeek(e, true);
    }
  };

  const updateSeek = (e: MouseEvent | React.MouseEvent<HTMLDivElement>, immediate = false) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    if (immediate) {
      seek(newTime);
    } else if (isDragging) {
      setDragTime(newTime);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        updateSeek(e);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        seek(dragTime);
        setIsDragging(false);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragTime, seek]);

  // Don't show the player if no track is loaded or if we're viewing track details
  if (!currentTrack || selectedTrack) {
    return null;
  }

  const handleDoubleClick = () => {
    if (currentTrackDetails && onTrackSelect) {
      onTrackSelect(currentTrackDetails);
    }
  };

  return (
    <div 
      className="bg-accent-yellow/20 border border-accent-yellow rounded-lg px-3 py-2 flex items-center space-x-3 w-full max-w-md lg:max-w-lg"
    >
      {/* Now Playing Label */}
      {currentTrackDetails && (
        <div 
          className="flex items-center space-x-2 text-sm cursor-pointer hover:text-silver/80 transition-colors min-w-0"
          onDoubleClick={handleDoubleClick}
          title="Double-click to view track details"
        >
          <span className="font-quicksand text-silver/60 flex-shrink-0 hidden sm:inline">Now playing:</span>
          <span className="font-quicksand text-silver font-medium truncate max-w-[120px] sm:max-w-[200px]">
            {currentTrackDetails.name}
          </span>
        </div>
      )}
      
      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        className="p-1 rounded transition-colors bg-accent-yellow text-forest-dark hover:bg-accent-yellow/90"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5" />
        )}
      </button>

      {/* Progress Bar with Time */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <span className="font-quicksand text-xs text-silver/60 tabular-nums w-12 text-right hidden sm:inline-block">
          {formatDuration(currentTime)}
        </span>
        
        <div 
          ref={progressRef}
          className="flex-1 h-4 bg-forest-light rounded-full cursor-pointer relative group flex items-center"
          onMouseDown={handleSeekMouseDown}
          onClick={handleSeekClick}
        >
          <div 
            className="absolute top-1/2 left-0 h-1 bg-accent-yellow rounded-full pointer-events-none transition-all duration-100 -translate-y-1/2"
            style={{ width: `${progress}%` }}
          />
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-accent-yellow rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
            style={{ left: `${progress}%`, marginLeft: '-6px' }}
          />
        </div>
        
        <span className="font-quicksand text-xs text-silver/60 tabular-nums w-12 hidden sm:inline-block">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Volume Control */}
      <div className="hidden md:flex items-center space-x-2">
        <Volume2 className="w-3.5 h-3.5 text-silver/60" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume * 100}
          onChange={(e) => setVolume(parseInt(e.target.value) / 100)}
          className="w-20 h-1 bg-forest-light rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, #e4da38 0%, #e4da38 ${volume * 100}%, #243830 ${volume * 100}%, #243830 100%)`
          }}
        />
      </div>
    </div>
  );
};

export default InlinePlayer;