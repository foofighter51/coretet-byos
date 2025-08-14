import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useAudio } from '../../contexts/AudioContext';

interface WaveformBarsProps {
  audioUrl: string;
  trackId: string;
  height?: number;
  barCount?: number;
  primaryColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  playheadColor?: string;
  onSeek?: (time: number) => void;
}

const WaveformBars: React.FC<WaveformBarsProps> = ({
  audioUrl,
  trackId,
  height = 80,
  barCount = 50,
  primaryColor = 'bg-accent-yellow',
  progressColor = 'bg-accent-yellow/30',
  backgroundColor = 'bg-forest-light',
  playheadColor = 'bg-accent-yellow',
  onSeek
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const { currentTrack, currentTime, duration, isPlaying } = useAudio();
  
  const isCurrentTrack = currentTrack === trackId;
  const progress = isCurrentTrack && duration > 0 ? currentTime / duration : 0;

  // Generate random bar heights (placeholder until we implement real waveform analysis)
  const barHeights = useMemo(() => {
    // Create a more realistic waveform pattern
    const heights: number[] = [];
    let lastHeight = 0.5;
    
    for (let i = 0; i < barCount; i++) {
      // Create smooth transitions between bars
      const variation = (Math.random() - 0.5) * 0.3;
      lastHeight = Math.max(0.2, Math.min(1, lastHeight + variation));
      
      // Add some rhythm patterns
      if (i % 4 === 0) {
        heights.push(Math.max(0.7, lastHeight)); // Beat emphasis
      } else {
        heights.push(lastHeight);
      }
    }
    
    return heights;
  }, [barCount]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [audioUrl]);

  const handleBarClick = useCallback((barIndex: number) => {
    if (!onSeek || !duration) return;
    
    const percentage = barIndex / barCount;
    const seekTime = percentage * duration;
    onSeek(seekTime);
  }, [barCount, duration, onSeek]);

  const handleSeek = useCallback((clientX: number) => {
    if (!onSeek || !duration || !waveformRef.current) return;
    
    const rect = waveformRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const seekTime = percentage * duration;
    onSeek(seekTime);
  }, [duration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleSeek(e.clientX);
  }, [handleSeek]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleSeek(e.touches[0].clientX);
  }, [handleSeek]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      handleSeek(e.clientX);
    }
  }, [isDragging, handleSeek]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (isDragging) {
      handleSeek(e.touches[0].clientX);
    }
  }, [isDragging, handleSeek]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  if (loading) {
    return (
      <div className={`${backgroundColor} rounded-lg p-4 animate-pulse`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-silver/40 text-sm font-quicksand">Loading waveform...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${backgroundColor} rounded-lg p-4`} style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-silver/40 text-sm font-quicksand">Unable to load waveform</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={waveformRef}
        className={`${backgroundColor} rounded-lg p-2 flex items-center justify-between gap-[2px] relative`}
        style={{ height }}
      >
        {barHeights.map((barHeight, index) => {
          const isPlayed = (index / barCount) <= progress;
          const isHovered = false; // Can implement hover state if needed
          
          return (
            <button
              key={index}
              onClick={() => handleBarClick(index)}
              className={`flex-1 rounded-sm transition-all duration-200 ${
                isPlayed ? primaryColor : progressColor
              } hover:opacity-80 cursor-pointer`}
              style={{
                height: `${barHeight * 100}%`,
                minHeight: '4px'
              }}
              aria-label={`Seek to ${Math.floor((index / barCount) * 100)}%`}
            />
          );
        })}
      </div>
      
      {/* Progress indicator line with draggable handle */}
      {isCurrentTrack && duration > 0 && (
        <>
          <div 
            className={`absolute top-0 bottom-0 w-0.5 ${playheadColor} pointer-events-none transition-all duration-100`}
            style={{ 
              left: `${progress * 100}%`,
              boxShadow: playheadColor === 'bg-accent-coral' ? '0 0 8px rgba(210, 117, 86, 0.5)' : '0 0 8px rgba(247, 206, 59, 0.5)'
            }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 ${playheadColor} rounded-full cursor-grab ${
              isDragging ? 'cursor-grabbing scale-125' : 'hover:scale-125'
            } transition-transform`}
            style={{ 
              left: `${progress * 100}%`,
              transform: `translateX(-50%) translateY(-50%)`,
              boxShadow: playheadColor === 'bg-accent-coral' ? '0 0 8px rgba(210, 117, 86, 0.5)' : '0 0 8px rgba(247, 206, 59, 0.5)'
            }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
        </>
      )}
      
      {/* Time labels */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-silver/60 font-quicksand font-mono">
          {isCurrentTrack ? (
            `${Math.floor(currentTime / 60)}:${(Math.floor(currentTime % 60)).toString().padStart(2, '0')}`
          ) : (
            '0:00'
          )}
        </span>
        {duration > 0 && (
          <span className="text-xs text-silver/60 font-quicksand font-mono">
            {isCurrentTrack ? (
              `-${Math.floor((duration - currentTime) / 60)}:${(Math.floor((duration - currentTime) % 60)).toString().padStart(2, '0')}`
            ) : (
              `${Math.floor(duration / 60)}:${(Math.floor(duration % 60)).toString().padStart(2, '0')}`
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default WaveformBars;