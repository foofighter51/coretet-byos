import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { supabase } from '../../lib/supabase';

interface WaveformCanvasProps {
  audioUrl: string;
  trackId: string;
  height?: number;
  primaryColor?: string;
  progressColor?: string;
  playheadColor?: string;
  backgroundColor?: string;
  onSeek?: (time: number) => void;
}

const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  audioUrl,
  trackId,
  height = 80,
  primaryColor = '#e4da38', // accent-yellow
  progressColor = 'rgba(228, 218, 56, 0.3)', // accent-yellow/30
  playheadColor = '#d27556', // accent-coral
  backgroundColor = '#243830', // forest-light
  onSeek
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { currentTrack, currentTime, duration, isPlaying } = useAudio();
  const isCurrentTrack = currentTrack === trackId;
  const progress = isCurrentTrack && duration > 0 ? currentTime / duration : 0;

  // Analyze audio and extract waveform data
  useEffect(() => {
    let audioContext: AudioContext | null = null;
    let isCancelled = false;

    const analyzeAudio = async () => {
      try {
        setLoading(true);
        setError(null);

        // Skip analysis if no URL
        if (!audioUrl) {
          setError('No audio URL provided');
          setLoading(false);
          return;
        }

        // Create audio context
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Fetch audio data
        const response = await fetch(audioUrl);
        if (!response.ok) throw new Error('Failed to load audio');
        
        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        // Get raw PCM data from the first channel
        const rawData = audioBuffer.getChannelData(0);
        const samples = 500; // Number of samples for visualization
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData = new Float32Array(samples);

        // Calculate RMS (Root Mean Square) for each block
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            const index = i * blockSize + j;
            if (index < rawData.length) {
              sum += rawData[index] * rawData[index];
            }
          }
          filteredData[i] = Math.sqrt(sum / blockSize);
        }

        // Normalize the data
        const maxValue = Math.max(...filteredData);
        if (maxValue > 0) {
          for (let i = 0; i < filteredData.length; i++) {
            filteredData[i] = filteredData[i] / maxValue;
          }
        }

        setWaveformData(filteredData);
        setLoading(false);
      } catch (err) {
        console.error('Error analyzing audio:', err);
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Failed to analyze audio');
          setLoading(false);
        }
      } finally {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      }
    };

    analyzeAudio();

    return () => {
      isCancelled = true;
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [audioUrl, trackId]);

  // Draw waveform
  useEffect(() => {
    if (!canvasRef.current || !waveformData || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = containerRef.current.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, height);

    // Draw waveform
    const barWidth = rect.width / waveformData.length;
    const centerY = height / 2;

    for (let i = 0; i < waveformData.length; i++) {
      const x = i * barWidth;
      const barHeight = waveformData[i] * (height * 0.8); // 80% of container height
      const progressPercentage = i / waveformData.length;

      // Create gradient for each bar
      const gradient = ctx.createLinearGradient(x, centerY - barHeight / 2, x, centerY + barHeight / 2);
      
      if (progressPercentage <= progress) {
        // Played portion - full color with gradient
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(0.5, primaryColor);
        gradient.addColorStop(1, `${primaryColor}88`); // Semi-transparent at edges
      } else {
        // Unplayed portion - muted with gradient
        gradient.addColorStop(0, `${primaryColor}66`);
        gradient.addColorStop(0.5, progressColor);
        gradient.addColorStop(1, `${progressColor}66`);
      }

      ctx.fillStyle = gradient;
      
      // Draw mirrored waveform (top and bottom)
      ctx.fillRect(x, centerY - barHeight / 2, barWidth - 1, barHeight / 2);
      ctx.fillRect(x, centerY, barWidth - 1, barHeight / 2);
    }

    // Draw progress line
    if (isCurrentTrack && duration > 0) {
      const progressX = progress * rect.width;
      
      // Draw playhead line
      ctx.strokeStyle = playheadColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();

      // Draw playhead handle
      ctx.fillStyle = playheadColor;
      ctx.beginPath();
      ctx.arc(progressX, centerY, 6, 0, Math.PI * 2);
      ctx.fill();
      
      // Add glow effect
      ctx.shadowColor = playheadColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }, [waveformData, progress, isCurrentTrack, duration, height, primaryColor, progressColor, playheadColor, backgroundColor]);

  // Handle seeking
  const handleSeek = useCallback((clientX: number) => {
    if (!onSeek || !duration || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
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
      <div className="bg-forest-light rounded-lg p-4 animate-pulse" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-silver/40 text-sm font-quicksand">Analyzing audio...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-forest-light rounded-lg p-4" style={{ height }}>
        <div className="flex items-center justify-center h-full">
          <span className="text-silver/40 text-sm font-quicksand">Unable to load waveform</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div 
        ref={containerRef}
        className="bg-forest-light rounded-lg overflow-hidden cursor-pointer"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <canvas 
          ref={canvasRef}
          className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        />
      </div>
      
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

export default WaveformCanvas;