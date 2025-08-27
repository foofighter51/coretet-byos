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

  // Don't show the player if we're viewing track details
  if (selectedTrack) {
    return null;
  }

  const handleDoubleClick = () => {
    if (currentTrackDetails && onTrackSelect) {
      onTrackSelect(currentTrackDetails);
    }
  };

  return (
    <div 
      className="bg-forest-main border border-forest-light/30 rounded-lg px-4 py-3 flex items-center space-x-4 w-full max-w-4xl"
    >
      {/* Now Playing Label */}
      <div 
        className="flex items-center space-x-2 text-sm cursor-pointer hover:text-silver/80 transition-colors min-w-0"
        onDoubleClick={handleDoubleClick}
        title={currentTrackDetails ? "Double-click to view track details" : "No track selected"}
      >
        <span className="font-quicksand text-silver/60 flex-shrink-0 hidden sm:inline">
          {currentTrackDetails ? "Now playing:" : "No track"}
        </span>
        <span className="font-quicksand text-silver font-medium truncate max-w-[120px] sm:max-w-[200px]">
          {currentTrackDetails ? currentTrackDetails.name : "Select a track to play"}
        </span>
      </div>
      
      {/* Play/Pause */}
      <button
        onClick={handlePlayPause}
        disabled={!currentTrack}
        className={`p-2 rounded-full transition-colors border ${
          currentTrack 
            ? "bg-silver/10 hover:bg-silver/20 border-silver/20" 
            : "bg-silver/5 border-silver/10 cursor-not-allowed"
        }`}
        title={currentTrack ? (isPlaying ? "Pause" : "Play") : "No track selected"}
      >
        {isPlaying ? (
          <Pause className={`w-4 h-4 ${currentTrack ? "text-silver" : "text-silver/30"}`} />
        ) : (
          <Play className={`w-4 h-4 ml-0.5 ${currentTrack ? "text-silver" : "text-silver/30"}`} />
        )}
      </button>

      {/* Progress Bar with Time */}
      <div className="flex items-center space-x-2 flex-1 min-w-0">
        <span className="font-quicksand text-xs text-silver/60 tabular-nums w-12 text-right hidden sm:inline-block">
          {currentTrack ? formatDuration(currentTime) : "-:--"}
        </span>
        
        <div 
          ref={progressRef}
          className={`flex-1 h-8 relative group flex items-center ${currentTrack ? 'cursor-pointer' : 'cursor-not-allowed'}`}
          onMouseDown={currentTrack ? handleSeekMouseDown : undefined}
          onClick={currentTrack ? handleSeekClick : undefined}
        >
          <div className="w-full h-2 bg-silver/20 rounded-full">
            <div 
              className={`h-full rounded-full transition-all duration-100 relative ${currentTrack ? 'bg-silver' : 'bg-silver/30'}`}
              style={{ width: `${currentTrack ? progress : 0}%` }}
            >
              {currentTrack && (
                <div 
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-silver rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border-2 border-forest-dark"
                  style={{ transform: 'translateY(-50%) translateX(50%)' }}
                />
              )}
            </div>
          </div>
        </div>
        
        <span className="font-quicksand text-xs text-silver/60 tabular-nums w-12 hidden sm:inline-block">
          {currentTrack ? formatDuration(duration) : "-:--"}
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