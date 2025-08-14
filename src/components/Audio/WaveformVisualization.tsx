import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAudio } from '../../contexts/AudioContext';

interface WaveformVisualizationProps {
  audioUrl: string;
  trackId: string;
  height?: number;
  primaryColor?: string;
  progressColor?: string;
  backgroundColor?: string;
  onSeek?: (time: number) => void;
  showTimestamps?: boolean;
}

interface Peak {
  min: number;
  max: number;
}

const WaveformVisualization: React.FC<WaveformVisualizationProps> = ({
  audioUrl,
  trackId,
  height = 128,
  primaryColor = '#F7CE3B', // accent-yellow
  progressColor = '#F7CE3B33',
  backgroundColor = '#1E3429', // forest-light
  onSeek,
  showTimestamps = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [peaks, setPeaks] = useState<Peak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const { currentTrack, currentTime, duration, isPlaying } = useAudio();

  const isCurrentTrack = currentTrack === trackId;

  // Generate waveform peaks from audio data
  const generatePeaks = useCallback(async (url: string) => {
    try {
      setLoading(true);
      setError(null);

      // Create audio context for analysis
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fetch and decode audio data
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch audio');
      
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Calculate peaks
      const channelData = audioBuffer.getChannelData(0); // Use first channel
      const samplesPerPeak = Math.floor(channelData.length / 200); // Generate ~200 peaks
      const peaksData: Peak[] = [];
      
      for (let i = 0; i < channelData.length; i += samplesPerPeak) {
        let min = 1.0;
        let max = -1.0;
        
        for (let j = 0; j < samplesPerPeak; j++) {
          const value = channelData[i + j];
          if (value !== undefined) {
            if (value > max) max = value;
            if (value < min) min = value;
          }
        }
        
        peaksData.push({ min, max });
      }
      
      setPeaks(peaksData);
      audioContext.close();
    } catch (err) {
      console.error('Error generating waveform:', err);
      setError('Failed to load waveform');
      // Generate placeholder peaks on error
      const placeholderPeaks: Peak[] = [];
      for (let i = 0; i < 200; i++) {
        placeholderPeaks.push({
          min: -0.5 + Math.random() * 0.3,
          max: 0.5 - Math.random() * 0.3
        });
      }
      setPeaks(placeholderPeaks);
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate peaks when audio URL changes
  useEffect(() => {
    if (audioUrl) {
      generatePeaks(audioUrl);
    }
  }, [audioUrl, generatePeaks]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || peaks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, height);

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, rect.width, height);

    const barWidth = rect.width / peaks.length;
    const centerY = height / 2;

    // Draw waveform bars
    peaks.forEach((peak, i) => {
      const x = i * barWidth;
      const topHeight = Math.abs(peak.max) * centerY * 0.9;
      const bottomHeight = Math.abs(peak.min) * centerY * 0.9;

      // Determine if this bar is in the played region
      const barProgress = i / peaks.length;
      const playProgress = isCurrentTrack && duration > 0 ? currentTime / duration : 0;
      const isPlayed = barProgress <= playProgress;

      // Set color based on play state
      ctx.fillStyle = isPlayed ? primaryColor : `${primaryColor}66`;

      // Draw top bar
      ctx.fillRect(x, centerY - topHeight, barWidth - 1, topHeight);
      
      // Draw bottom bar
      ctx.fillRect(x, centerY, barWidth - 1, bottomHeight);
    });

    // Draw progress line if playing
    if (isCurrentTrack && duration > 0) {
      const progressX = (currentTime / duration) * rect.width;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }

    // Draw hover indicator
    if (hoveredTime !== null && duration > 0) {
      const hoverX = (hoveredTime / duration) * rect.width;
      ctx.strokeStyle = `${primaryColor}88`;
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [peaks, height, primaryColor, backgroundColor, isCurrentTrack, currentTime, duration, hoveredTime]);

  // Handle click to seek
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration || !onSeek) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seekTime = percentage * duration;
    
    onSeek(Math.max(0, Math.min(seekTime, duration)));
  }, [duration, onSeek]);

  // Handle mouse move for hover effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!duration) return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const hoverTime = percentage * duration;
    
    setHoveredTime(hoverTime);
  }, [duration]);

  const handleMouseLeave = useCallback(() => {
    setHoveredTime(null);
  }, []);

  // Format time for display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-forest-light rounded-lg">
          <div className="text-silver/60 font-quicksand text-sm">Loading waveform...</div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className={`w-full cursor-pointer ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* Timestamps */}
      {showTimestamps && !loading && duration > 0 && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-silver/60 font-quicksand">0:00</span>
          <span className="text-xs text-silver/60 font-quicksand">{formatTime(duration)}</span>
        </div>
      )}
      
      {/* Hover timestamp */}
      {hoveredTime !== null && duration > 0 && (
        <div 
          className="absolute -top-8 transform -translate-x-1/2 bg-forest-dark text-silver text-xs px-2 py-1 rounded pointer-events-none"
          style={{ left: `${(hoveredTime / duration) * 100}%` }}
        >
          {formatTime(hoveredTime)}
        </div>
      )}
      
      {/* Current time indicator for playing track */}
      {isCurrentTrack && isPlaying && duration > 0 && (
        <div 
          className="absolute -bottom-8 transform -translate-x-1/2 bg-accent-yellow text-forest-dark text-xs px-2 py-1 rounded font-medium pointer-events-none"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        >
          {formatTime(currentTime)}
        </div>
      )}
    </div>
  );
};

export default WaveformVisualization;