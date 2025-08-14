import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { useLibrary } from '../../contexts/LibraryContext';
import { formatDuration } from '../../utils/trackUtils';
import { Track } from '../../types';

const PlayerBar: React.FC = () => {
  const { tracks } = useLibrary();
  const { 
    currentTrack, 
    isPlaying, 
    currentTime, 
    duration, 
    volume,
    play, 
    pause, 
    seek, 
    setVolume 
  } = useAudio();
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  
  // Find current track data
  const trackData = tracks.find(t => t.id === currentTrack);
  const currentIndex = tracks.findIndex(t => t.id === currentTrack);
  
  const progress = duration > 0 ? ((isDragging ? dragTime : currentTime) / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else if (trackData) {
      play(trackData.id, trackData.url);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      play(prevTrack.id, prevTrack.url);
    }
  };

  const handleNext = () => {
    if (currentIndex < tracks.length - 1) {
      const nextTrack = tracks[currentIndex + 1];
      play(nextTrack.id, nextTrack.url);
    }
  };

  const handleSeekMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const wasClick = true;
    updateSeek(e, wasClick);
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

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!volumeRef.current) return;
    
    const rect = volumeRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    setVolume(percentage);
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

  if (!trackData) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-forest-main border-t border-forest-light z-50 h-[60px]" data-tutorial="player-bar">
      <div className="px-4 h-full flex items-center">
        <div className="grid grid-cols-3 gap-6 items-center w-full">
          {/* Track Info */}
          <div className="min-w-0">
            <h4 className="font-quicksand font-semibold text-sm text-silver truncate">
              {trackData.name}
            </h4>
            {trackData.artist && (
              <p className="font-quicksand text-xs text-silver/60 truncate">
                {trackData.artist}
              </p>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center space-y-2">
            {/* Control Buttons */}
            <div className="flex items-center space-x-4">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="text-silver/60 hover:text-silver disabled:text-silver/30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={handlePlayPause}
                className="w-10 h-10 bg-accent-yellow rounded-full flex items-center justify-center text-forest-dark hover:bg-accent-yellow/90 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              <button
                onClick={handleNext}
                disabled={currentIndex === tracks.length - 1}
                className="text-silver/60 hover:text-silver disabled:text-silver/30 disabled:cursor-not-allowed transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-3 w-full">
              <span className="font-quicksand text-xs text-silver/60 tabular-nums">
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
              
              <span className="font-quicksand text-xs text-silver/60 tabular-nums">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setVolume(volume === 0 ? 0.8 : 0)}
              className="text-silver/60 hover:text-silver transition-colors"
            >
              {volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            
            <div 
              ref={volumeRef}
              className="w-24 h-4 bg-forest-light rounded-full cursor-pointer relative group flex items-center"
              onClick={handleVolumeChange}
            >
              <div 
                className="absolute top-1/2 left-0 h-1 bg-silver rounded-full pointer-events-none -translate-y-1/2"
                style={{ width: `${volume * 100}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-silver rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${volume * 100}%`, marginLeft: '-6px' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerBar;