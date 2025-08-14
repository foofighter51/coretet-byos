import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAudio } from '../../contexts/AudioContext';
import { Track } from '../../types';
import DetailedWaveform from '../Audio/DetailedWaveform';

interface ArrangementWaveformProps {
  track: Track;
  height?: number;
  onSeek?: (time: number) => void;
}

interface GridSettings {
  bpm: number;
  beatsPerBar: number;
  snapToGrid: 'beat' | 'bar' | 'phrase';
  showGrid: boolean;
}

const ArrangementWaveform: React.FC<ArrangementWaveformProps> = ({
  track,
  height = 200,
  onSeek
}) => {
  // ArrangementWaveform mounted
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { duration, currentTrack } = useAudio();
  const [localDuration, setLocalDuration] = useState<number>(0);
  
  const [gridSettings, setGridSettings] = useState<GridSettings>({
    bpm: track.tempo || 120,
    beatsPerBar: 4,
    snapToGrid: 'bar',
    showGrid: true
  });
  
  // Update local duration when audio context duration changes
  useEffect(() => {
    if (currentTrack === track.id && duration > 0) {
      setLocalDuration(duration);
    }
  }, [currentTrack, track.id, duration]);

  // Get duration from audio element if not available from context
  useEffect(() => {
    if (!localDuration && track.url) {
      const audio = new Audio(track.url);
      audio.addEventListener('loadedmetadata', () => {
        setLocalDuration(audio.duration);
      });
    }
  }, [localDuration, track.url]);
  
  // Use effective duration throughout component
  const effectiveDuration = localDuration || duration || 0;

  // Calculate grid positions
  const calculateGridPositions = useCallback(() => {
    if (!gridSettings.bpm || !effectiveDuration) return [];
    
    const secondsPerBeat = 60 / gridSettings.bpm;
    const secondsPerBar = secondsPerBeat * gridSettings.beatsPerBar;
    const positions: { time: number; type: 'beat' | 'bar' | 'phrase' }[] = [];
    
    // Generate grid positions based on snap setting
    if (gridSettings.snapToGrid === 'beat') {
      for (let time = 0; time < effectiveDuration; time += secondsPerBeat) {
        positions.push({ time, type: 'beat' });
      }
    } else if (gridSettings.snapToGrid === 'bar') {
      for (let time = 0; time < effectiveDuration; time += secondsPerBar) {
        positions.push({ time, type: 'bar' });
      }
    } else { // phrase (4 bars)
      const secondsPerPhrase = secondsPerBar * 4;
      for (let time = 0; time < effectiveDuration; time += secondsPerPhrase) {
        positions.push({ time, type: 'phrase' });
      }
    }
    
    return positions;
  }, [gridSettings, effectiveDuration]);

  // Draw grid
  const drawGrid = useCallback(() => {
    const canvas = gridCanvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !gridSettings.showGrid || !effectiveDuration) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    const positions = calculateGridPositions();
    
    positions.forEach(({ time, type }) => {
      const x = (time / effectiveDuration) * width;
      
      // Different styles for different grid types
      if (type === 'phrase') {
        ctx.strokeStyle = 'rgba(228, 218, 56, 0.3)'; // accent-yellow
        ctx.lineWidth = 2;
      } else if (type === 'bar') {
        ctx.strokeStyle = 'rgba(235, 234, 232, 0.2)'; // silver
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'rgba(235, 234, 232, 0.1)'; // silver very faint
        ctx.lineWidth = 0.5;
      }
      
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    });

    // Draw bar numbers at the top
    const secondsPerBar = (60 / gridSettings.bpm) * gridSettings.beatsPerBar;
    ctx.fillStyle = 'rgba(235, 234, 232, 0.6)';
    ctx.font = '10px Quicksand';
    
    for (let bar = 0; bar * secondsPerBar < effectiveDuration; bar++) {
      const x = (bar * secondsPerBar / effectiveDuration) * width;
      if (bar % 4 === 0 && bar > 0) {
        ctx.fillText(`${bar}`, x + 2, 12);
      }
    }
  }, [gridSettings, effectiveDuration, height, calculateGridPositions]);

  // Redraw grid when settings or size changes
  useEffect(() => {
    drawGrid();
  }, [drawGrid]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      drawGrid();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGrid]);

  // Snap time to grid
  const snapToGrid = useCallback((timeInSeconds: number): number => {
    if (!gridSettings.bpm) return timeInSeconds;
    
    const secondsPerBeat = 60 / gridSettings.bpm;
    const secondsPerBar = secondsPerBeat * gridSettings.beatsPerBar;
    
    let gridInterval: number;
    switch (gridSettings.snapToGrid) {
      case 'beat':
        gridInterval = secondsPerBeat;
        break;
      case 'bar':
        gridInterval = secondsPerBar;
        break;
      case 'phrase':
        gridInterval = secondsPerBar * 4;
        break;
    }
    
    return Math.round(timeInSeconds / gridInterval) * gridInterval;
  }, [gridSettings]);

  if (!track.tempo) {
    return (
      <div className="bg-forest-main rounded-lg p-8 text-center">
        <p className="text-silver/80 mb-4">
          BPM is required to use the Arrangements feature
        </p>
        <p className="text-silver/60 text-sm">
          Please set the BPM for this track in the track details
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid Controls */}
      <div className="flex items-center space-x-4 bg-forest-light/50 rounded-lg p-3">
        <div className="flex items-center space-x-2">
          <label className="text-sm text-silver/80">BPM:</label>
          <span className="text-silver font-medium">{gridSettings.bpm}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm text-silver/80">Snap to:</label>
          <select
            value={gridSettings.snapToGrid}
            onChange={(e) => setGridSettings(prev => ({ 
              ...prev, 
              snapToGrid: e.target.value as 'beat' | 'bar' | 'phrase' 
            }))}
            className="bg-forest-main text-silver px-2 py-1 rounded text-sm"
          >
            <option value="beat">Beat</option>
            <option value="bar">Bar</option>
            <option value="phrase">4 Bars</option>
          </select>
        </div>
        
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={gridSettings.showGrid}
            onChange={(e) => setGridSettings(prev => ({ 
              ...prev, 
              showGrid: e.target.checked 
            }))}
            className="rounded"
          />
          <span className="text-sm text-silver/80">Show Grid</span>
        </label>
      </div>

      {/* Waveform with Grid */}
      <div ref={containerRef} className="relative" style={{ height }}>
        {/* Grid Canvas - underneath */}
        {gridSettings.showGrid && (
          <canvas
            ref={gridCanvasRef}
            className="absolute inset-0 pointer-events-none"
            style={{ 
              width: '100%',
              height: height,
              zIndex: 0
            }}
          />
        )}
        
        {/* Waveform - on top */}
        <div className="relative" style={{ zIndex: 1 }}>
          <DetailedWaveform
            audioUrl={track.url}
            trackId={track.id}
            height={height}
            onSeek={onSeek}
            showTimeline={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ArrangementWaveform;