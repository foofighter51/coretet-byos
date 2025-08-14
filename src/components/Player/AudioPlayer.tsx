import React from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useAudio } from '../../contexts/AudioContext';
import { Track } from '../../types';
import { formatDuration } from '../../utils/trackUtils';

interface AudioPlayerProps {
  track: Track;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ track }) => {
  const { currentTrack, isPlaying, currentTime, duration, play, pause, seek, volume, setVolume } = useAudio();
  
  const isCurrentTrack = currentTrack === track.id;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handlePlayPause = () => {
    if (isCurrentTrack && isPlaying) {
      pause();
    } else {
      play(track.id, track.url);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    seek(newTime);
  };

  return (
    <div className="bg-forest-light rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePlayPause}
            className="w-10 h-10 bg-accent-yellow rounded-full flex items-center justify-center text-forest-dark hover:bg-accent-yellow/90 transition-colors"
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>
          
          <div>
            <h3 className="font-quicksand font-semibold text-silver text-sm">{track.name}</h3>
            <p className="font-quicksand text-xs text-silver/80">
              {formatDuration(isCurrentTrack ? currentTime : 0)} / {formatDuration(track.duration || 0)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-silver/80" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 bg-forest-dark rounded-lg appearance-none cursor-pointer"
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div 
        className="w-full bg-forest-dark rounded-full h-2 cursor-pointer"
        onClick={handleSeek}
      >
        <div 
          className="bg-accent-yellow h-2 rounded-full transition-all duration-150 ease-out"
          style={{ width: `${isCurrentTrack ? progress : 0}%` }}
        />
      </div>

      {/* Simple Waveform Visualization */}
      <div className="flex items-center justify-center space-x-1 h-8">
        {Array.from({ length: 40 }, (_, i) => (
          <div
            key={i}
            className={`w-1 bg-forest-dark rounded-full transition-all duration-150 ${
              isCurrentTrack && isPlaying ? 'animate-pulse-soft' : ''
            }`}
            style={{
              height: `${Math.random() * 24 + 8}px`,
              opacity: isCurrentTrack && progress > (i / 40) * 100 ? 1 : 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AudioPlayer;