import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { supabase } from '../../lib/supabase';

interface DetailedWaveformProps {
  audioUrl: string;
  trackId: string;
  height?: number;
  onSeek?: (time: number) => void;
  showTimeline?: boolean;
}

const DetailedWaveform: React.FC<DetailedWaveformProps> = ({
  audioUrl,
  trackId,
  height = 120,
  onSeek,
  showTimeline = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformData, setWaveformData] = useState<Float32Array | null>(null);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  
  const { currentTrack, currentTime, isPlaying } = useAudio();
  const isCurrentTrack = currentTrack === trackId;

  // Generate waveform data from audio
  useEffect(() => {
    let isCancelled = false;
    let audioContext: AudioContext | null = null;

    const loadAudio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Create AudioContext only when needed
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

        // Try to get a signed URL from the edge function
        let url = audioUrl;
        
        // Try to get a better URL if we have a trackId
        if (trackId) {
          try {
            const { data: track, error: trackError } = await supabase
              .from('tracks')
              .select('storage_path, provider_url')
              .eq('id', trackId)
              .single();

            if (!trackError && track?.storage_path) {
              const { data: signedData, error: signedError } = await supabase.storage
                .from('audio-files')
                .createSignedUrl(track.storage_path, 3600);
              
              if (signedData && !signedError) {
                url = signedData.signedUrl;
              }
            }
          } catch (err) {
            // Fallback to original URL if database lookup fails
            console.log('Failed to get signed URL, using original:', err);
          }
        }

        // Fetch the audio file
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        if (isCancelled) return;

        // Decode audio data
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        if (isCancelled) return;

        setDuration(audioBuffer.duration);

        // Get the raw audio data from the first channel
        const channelData = audioBuffer.getChannelData(0);
        
        // Calculate how many samples to show per pixel
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        
        // Ensure canvas is properly sized before generating waveform
        const rect = container.getBoundingClientRect();
        const canvasWidth = Math.max(rect.width || 800, 100); // Use container width or fallback
        const samplesPerPixel = Math.floor(channelData.length / canvasWidth);
        
        // Create detailed waveform data by finding min/max values for each pixel
        const waveform = new Float32Array(canvasWidth * 2); // Store both min and max for each pixel
        
        for (let i = 0; i < canvasWidth; i++) {
          const start = i * samplesPerPixel;
          const end = Math.min(start + samplesPerPixel, channelData.length);
          
          let min = 1;
          let max = -1;
          
          // Find the min and max values in this pixel's sample range
          for (let j = start; j < end; j++) {
            const sample = channelData[j];
            if (sample < min) min = sample;
            if (sample > max) max = sample;
          }
          
          waveform[i * 2] = min;
          waveform[i * 2 + 1] = max;
        }

        if (!isCancelled) {
          setWaveformData(waveform);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          // Error loading waveform
          const errorMessage = err instanceof Error ? err.message : 'Failed to load waveform';
          setError(errorMessage);
          setIsLoading(false);
        }
      } finally {
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, [audioUrl, trackId]);

  // Draw the waveform
  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const middleY = height / 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background (forest-main)
    ctx.fillStyle = '#1a2e26';
    ctx.fillRect(0, 0, width, height);

    // Draw center line (forest-light)
    ctx.strokeStyle = '#243830';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, middleY);
    ctx.lineTo(width, middleY);
    ctx.stroke();

    // Draw the waveform (silver with lower opacity)
    ctx.fillStyle = '#ebeae8';
    ctx.globalAlpha = 0.6;

    const waveformSamples = waveformData.length / 2;
    const scale = waveformSamples / width;

    for (let i = 0; i < width; i++) {
      const waveformIndex = Math.floor(i * scale);
      const min = waveformData[waveformIndex * 2] * middleY;
      const max = waveformData[waveformIndex * 2 + 1] * middleY;
      
      // Draw a vertical line from min to max
      const x = i;
      const yMin = middleY - max;
      const yMax = middleY - min;
      const barHeight = yMax - yMin;
      
      ctx.fillRect(x, yMin, 1, Math.max(1, barHeight));
    }

    // Draw playhead if this is the current track
    if (isCurrentTrack && duration > 0) {
      const playheadX = (currentTime / duration) * width;
      
      // Draw played portion in accent-yellow
      ctx.fillStyle = '#e4da38';
      ctx.globalAlpha = 0.8;
      
      for (let i = 0; i < playheadX; i++) {
        const waveformIndex = Math.floor(i * scale);
        const min = waveformData[waveformIndex * 2] * middleY;
        const max = waveformData[waveformIndex * 2 + 1] * middleY;
        
        const x = i;
        const yMin = middleY - max;
        const yMax = middleY - min;
        const barHeight = yMax - yMin;
        
        ctx.fillRect(x, yMin, 1, Math.max(1, barHeight));
      }
      
      // Draw playhead line (accent-coral for better visibility)
      ctx.strokeStyle = '#d27556';
      ctx.lineWidth = 2;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
    }

    // Draw hover position (silver with dashed line)
    if (hoveredTime !== null && duration > 0) {
      const hoverX = (hoveredTime / duration) * width;
      
      ctx.strokeStyle = '#ebeae8';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(hoverX, 0);
      ctx.lineTo(hoverX, height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [waveformData, isCurrentTrack, currentTime, duration, hoveredTime]);

  // Redraw when data or playback changes
  useEffect(() => {
    drawWaveform();
  }, [drawWaveform]);

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      const newWidth = rect.width * window.devicePixelRatio;
      const newHeight = height * window.devicePixelRatio;
      
      // Only update if size actually changed
      if (canvas.width !== newWidth || canvas.height !== newHeight) {
        canvas.width = newWidth;
        canvas.height = newHeight;
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${height}px`;

        drawWaveform();
      }
    };

    // Initial resize
    handleResize();
    
    // Add a small delay to ensure container is properly sized
    const timeoutId = setTimeout(handleResize, 100);
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [height, drawWaveform]);

  // Handle mouse interactions
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    setHoveredTime(percentage * duration);
  };

  const handleMouseLeave = () => {
    setHoveredTime(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !duration || !onSeek) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const seekTime = percentage * duration;
    onSeek(seekTime);
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-forest-main rounded-lg p-4">
        <p className="text-silver/60 font-quicksand text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative" ref={containerRef}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-forest-main rounded-lg">
          <div className="text-silver/60 font-quicksand text-sm animate-pulse">Loading waveform...</div>
        </div>
      )}
      
      <canvas
        ref={canvasRef}
        className={`w-full cursor-pointer ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        style={{ height: `${height}px` }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      
      {/* Timeline */}
      {showTimeline && duration > 0 && (
        <div className="flex justify-between mt-1 text-xs text-silver/40 font-mono">
          <span>0:00</span>
          <span>{formatTime(duration / 2)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
      
      {/* Hover time tooltip */}
      {hoveredTime !== null && (
        <div 
          className="absolute -top-8 bg-forest-main border border-forest-light rounded px-2 py-1 text-xs text-silver font-mono pointer-events-none"
          style={{
            left: `${(hoveredTime / duration) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        >
          {formatTime(hoveredTime)}
        </div>
      )}
    </div>
  );
};

export default DetailedWaveform;