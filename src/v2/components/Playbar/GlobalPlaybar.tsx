import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  file_name: string;
  category: string;
  created_at: string;
  file_size: number;
  provider_url?: string;
  storage_path?: string;
}

interface GlobalPlaybarProps {
  currentTrack: Track | null;
  audioUrl: string | null;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

export function GlobalPlaybar({
  currentTrack,
  audioUrl,
  onPlayPause,
  onSeek,
  onVolumeChange,
  isPlaying,
  currentTime,
  duration,
  volume
}: GlobalPlaybarProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [tempTime, setTempTime] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);

  // Don't render if no track is loaded
  if (!currentTrack || !audioUrl) {
    return null;
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = percent * duration;
    onSeek(seekTime);
  };

  const handleProgressDrag = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration || !isDragging) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const seekTime = percent * duration;
    setTempTime(seekTime);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      onSeek(tempTime);
      setIsDragging(false);
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        onSeek(tempTime);
        setIsDragging(false);
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && progressRef.current && duration) {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const seekTime = percent * duration;
        setTempTime(seekTime);
      }
    };

    if (isDragging) {
      document.addEventListener('mouseup', handleGlobalMouseUp);
      document.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, tempTime, duration, onSeek]);

  const displayTime = isDragging ? tempTime : currentTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-forest-main border-t border-forest-light z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center space-x-4">
          {/* Track Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 md:flex-none md:w-64">
            <div className="w-10 h-10 bg-forest-light rounded flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-5 h-5 text-accent-coral" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-quicksand font-medium text-white text-sm truncate">
                {currentTrack.name}
              </div>
              <div className="font-quicksand text-xs text-silver/60 truncate">
                {currentTrack.category}
              </div>
            </div>
          </div>

          {/* Play Controls */}
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={onPlayPause}
              className="w-8 h-8 bg-accent-coral hover:bg-accent-coral/90 rounded-full flex items-center justify-center transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-white" />
              ) : (
                <Play className="w-4 h-4 text-white ml-0.5" />
              )}
            </button>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <span className="text-xs font-mono text-silver/60 w-10 text-right">
                {formatTime(displayTime)}
              </span>
              <div 
                ref={progressRef}
                className="flex-1 h-1 bg-forest-light rounded-full cursor-pointer relative group"
                onClick={handleProgressClick}
                onMouseDown={handleMouseDown}
                onMouseMove={handleProgressDrag}
                onMouseUp={handleMouseUp}
              >
                <div 
                  className="h-full bg-accent-coral rounded-full transition-all duration-150"
                  style={{ width: `${progressPercent}%` }}
                />
                <div 
                  className="absolute top-1/2 w-3 h-3 bg-accent-coral rounded-full transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                  style={{ left: `${progressPercent}%`, marginLeft: '-6px' }}
                />
              </div>
              <span className="text-xs font-mono text-silver/60 w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center space-x-2 w-24">
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 1)}
              className="text-silver/60 hover:text-silver transition-colors"
            >
              {volume > 0 ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
            <div 
              className="flex-1 h-1 bg-forest-light rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                onVolumeChange(Math.max(0, Math.min(1, percent)));
              }}
            >
              <div 
                className="h-full bg-silver rounded-full transition-all duration-150"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}