import React from 'react';
import { Play, Pause } from 'lucide-react';
import { Track } from '../../types';
import { useAudio } from '../../contexts/AudioContext';

interface NarrowLibraryViewProps {
  tracks: Track[];
  onTrackSelect?: (track: Track) => void;
  selectedTrackId?: string;
}

const NarrowLibraryView: React.FC<NarrowLibraryViewProps> = ({ 
  tracks, 
  onTrackSelect,
  selectedTrackId
}) => {
  const { currentTrack, isPlaying, play, pause } = useAudio();

  const handlePlayPause = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentTrack === track.id && isPlaying) {
      pause();
    } else {
      play(track.id, track.url);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-forest-light">
        <h3 className="font-anton text-sm text-silver uppercase tracking-wider">Library</h3>
        <p className="font-quicksand text-xs text-silver/60 mt-1">{tracks.length} tracks</p>
      </div>

      {/* Track List */}
      <div className="flex-1 overflow-y-auto">
        {tracks.map((track) => {
          const isCurrentTrack = currentTrack === track.id;
          const isPlayingThis = isCurrentTrack && isPlaying;
          const isSelected = selectedTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onTrackSelect?.(track)}
              className={`group flex items-center px-4 py-2 hover:bg-forest-light/30 cursor-pointer transition-colors ${
                isSelected ? 'bg-forest-light/50' : ''
              } ${isCurrentTrack ? 'text-accent-yellow' : 'text-silver'}`}
            >
              {/* Play/Pause Button */}
              <button
                onClick={(e) => handlePlayPause(track, e)}
                className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 transition-all ${
                  isCurrentTrack 
                    ? 'bg-accent-yellow text-forest-dark opacity-100' 
                    : 'bg-forest-light/50 hover:bg-accent-yellow hover:text-forest-dark opacity-0 group-hover:opacity-100'
                }`}
              >
                {isPlayingThis ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Play className="w-3 h-3 ml-0.5" />
                )}
              </button>

              {/* Track Title */}
              <span className={`font-quicksand text-sm truncate ${
                isCurrentTrack ? 'font-medium' : ''
              }`}>
                {track.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NarrowLibraryView;