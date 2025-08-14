import React, { useState, useRef, useCallback, CSSProperties, useEffect } from 'react';
import { Play, Pause, MoreVertical, Folder, Tag, CheckSquare, Square, Headphones, ThumbsUp, Heart, Trash2, Users, GripVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { FixedSizeList as List } from 'react-window';
import { Track } from '../../types';
import { formatDuration, formatRelativeDate } from '../../utils/trackUtils';
import { useAudio } from '../../contexts/AudioContext';
import { useTrackRatings } from '../../hooks/useTrackRatings';
import TrackRatings from './TrackRatings';
import { VariationsPopup } from '../Variations/VariationsPopup';

interface TrackListViewProps {
  tracks: Track[];
  onTrackSelect?: (track: Track) => void;
  onEditMetadata?: (track: Track) => void;
  selectedTrack?: Track | null;
  compactMode?: boolean;
  onRatingUpdate?: (trackId: string, rating: 'listened' | 'liked' | 'loved', value: boolean) => void;
  currentTrackId?: string;
  selectedTracks: string[];
  onSelectionChange: (tracks: string[]) => void;
  onDeleteTrack?: (trackId: string) => void;
  isInPlaylist?: boolean;
  playlistId?: string;
  enableReordering?: boolean;
  onReorder?: (tracks: Track[]) => void;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration' | 'manual') => void;
}

interface RowData {
  tracks: Track[];
  selectedTracks: string[];
  currentTrack?: string;
  selectedTrack?: Track | null;
  compactMode?: boolean;
  isInPlaylist?: boolean;
  playlistId?: string;
  enableReordering?: boolean;
  onTrackSelect?: (track: Track) => void;
  onEditMetadata?: (track: Track) => void;
  onRatingUpdate?: (trackId: string, rating: 'listened' | 'liked' | 'loved', value: boolean) => void;
  onDeleteTrack?: (trackId: string) => void;
  onSelectionChange: (tracks: string[]) => void;
  handleTrackClick: (trackId: string, index: number, e: React.MouseEvent) => void;
  handleTrackDoubleClick: (track: Track, e: React.MouseEvent) => void;
  play: (trackId: string, url: string) => void;
  pause: () => void;
  isPlaying: boolean;
  ratings: Record<string, any>;
  varButtonRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  setVariationsPopup: (popup: { trackId: string; rect: DOMRect } | null) => void;
}

const TrackListViewVirtualized: React.FC<TrackListViewProps> = ({
  tracks,
  onTrackSelect,
  onEditMetadata,
  selectedTrack,
  compactMode = false,
  onRatingUpdate,
  currentTrackId,
  selectedTracks,
  onSelectionChange,
  onDeleteTrack,
  isInPlaylist,
  playlistId,
  enableReordering,
  onReorder,
  sortBy,
  sortDirection,
  onSort,
}) => {
  const { play, pause, isPlaying, currentTrack } = useAudio();
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState<number | null>(null);
  const [variationsPopup, setVariationsPopup] = useState<{
    trackId: string;
    trackName: string;
    anchorElement: HTMLElement;
  } | null>(null);
  
  const varButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const listRef = useRef<List>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);
  const { ratings } = useTrackRatings(playlistId || '');

  // Calculate container height
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const handleTrackClick = (trackId: string, index: number, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    
    if (e.ctrlKey || e.metaKey) {
      if (selectedTracks.includes(trackId)) {
        onSelectionChange(selectedTracks.filter(id => id !== trackId));
      } else {
        onSelectionChange([...selectedTracks, trackId]);
      }
    } else if (e.shiftKey && selectedTracks.length > 0) {
      const lastSelectedIndex = tracks.findIndex(t => t.id === selectedTracks[selectedTracks.length - 1]);
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeSelection = tracks.slice(start, end + 1).map(t => t.id);
      const newSelection = Array.from(new Set([...selectedTracks, ...rangeSelection]));
      onSelectionChange(newSelection);
    } else {
      const track = tracks[index];
      if (track && onTrackSelect) {
        onTrackSelect(track);
      }
    }
  };

  const handleTrackDoubleClick = (track: Track, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    if (onEditMetadata) {
      onEditMetadata(track);
    }
  };

  const itemData: RowData = {
    tracks,
    selectedTracks,
    currentTrack: currentTrackId,
    selectedTrack,
    compactMode,
    isInPlaylist,
    playlistId,
    enableReordering,
    onTrackSelect,
    onEditMetadata,
    onRatingUpdate,
    onDeleteTrack,
    onSelectionChange,
    handleTrackClick,
    handleTrackDoubleClick,
    play,
    pause,
    isPlaying,
    ratings,
    varButtonRefs,
    setVariationsPopup,
  };

  const Row = ({ index, style, data }: { index: number; style: CSSProperties; data: RowData }) => {
    const track = data.tracks[index];
    const isCurrentTrack = data.currentTrack === track.id;
    const isPlayingThis = isCurrentTrack && data.isPlaying;
    const isEvenRow = index % 2 === 0;
    
    const handlePlayPause = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isPlayingThis) {
        data.pause();
      } else {
        data.play(track.id, track.url);
      }
    };

    return (
      <div
        style={style}
        onClick={(e) => data.handleTrackClick(track.id, index, e)}
        onDoubleClick={(e) => data.handleTrackDoubleClick(track, e)}
        data-tutorial={index === 0 ? "track-row" : undefined}
        className={`track-list-item ${data.compactMode ? 'block' : 'grid grid-cols-17 gap-4'} px-4 py-2 transition-all group cursor-pointer select-none border-b border-forest-light ${
          data.selectedTrack?.id === track.id
            ? 'bg-accent-yellow/20 border-l-4 border-accent-yellow'
            : isCurrentTrack 
            ? 'bg-accent-yellow/10' 
            : data.selectedTracks.includes(track.id)
              ? 'bg-accent-yellow/5 hover:bg-accent-yellow/10'
              : isEvenRow 
                ? 'bg-forest-light/10 hover:bg-forest-light/30' 
                : 'hover:bg-forest-light/30'
        }`}
      >
        {data.compactMode ? (
          // Compact mode - show only title
          <div className="min-w-0 flex-1">
            <h3 className={`font-quicksand font-medium text-sm truncate ${
              isCurrentTrack ? 'text-accent-yellow' : 'text-silver'
            }`}>
              {track.name}
            </h3>
          </div>
        ) : (
          // Full mode - show all columns
          <>
            {/* Play Button */}
            <div className="col-span-1 flex items-center space-x-1">
              <button
                onClick={handlePlayPause}
                className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                  isCurrentTrack 
                    ? 'bg-accent-yellow text-forest-dark opacity-100' 
                    : data.selectedTracks.includes(track.id)
                      ? 'bg-forest-light/50 hover:bg-accent-yellow hover:text-forest-dark opacity-100'
                      : 'bg-forest-light/50 hover:bg-accent-yellow hover:text-forest-dark opacity-0 group-hover:opacity-100'
                }`}
              >
                {isPlayingThis ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>
            </div>

            {/* Title */}
            <div className="col-span-4 flex items-center">
              <div className="min-w-0 flex-1">
                <h3 className={`font-quicksand font-medium text-sm truncate ${
                  isCurrentTrack ? 'text-accent-yellow' : 'text-silver'
                }`}>
                  {track.name}
                </h3>
                <div className="flex items-center gap-3 mt-0.5">
                  {/* Inline metadata */}
                  {(track.key || track.tempo || track.updated_at) && (
                    <div className="flex items-center gap-2 text-xs text-silver/50">
                      {track.key && (
                        <span className="font-mono">{track.key}</span>
                      )}
                      {track.key && track.tempo && (
                        <span className="text-silver/30">•</span>
                      )}
                      {track.tempo && (
                        <span>{track.tempo} BPM</span>
                      )}
                      {(track.key || track.tempo) && track.updated_at && (
                        <span className="text-silver/30">•</span>
                      )}
                      {track.updated_at && (
                        <span className="text-silver/40">
                          {formatRelativeDate(track.updated_at)}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Tags */}
                  {track.tags.length > 0 && (
                    <>
                      {(track.key || track.tempo || track.updated_at) && (
                        <span className="text-silver/30 text-xs">•</span>
                      )}
                      <div className="flex gap-1">
                        {track.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="text-xs bg-forest-light px-2 py-0.5 rounded-full text-silver/60"
                          >
                            {tag}
                          </span>
                        ))}
                        {track.tags.length > 2 && (
                          <span className="text-xs text-silver/40">
                            +{track.tags.length - 2}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Type */}
            <div className="col-span-2 flex items-center">
              <span className="font-quicksand text-sm text-silver/80 capitalize">
                {track.category.replace('-', ' ')}
              </span>
            </div>

            {/* Artist */}
            <div className="col-span-2 flex items-center">
              <span className="font-quicksand text-sm text-silver/80 truncate">
                {track.artist || '—'}
              </span>
            </div>

            {/* Album */}
            <div className="col-span-2 flex items-center">
              <Folder className="w-3 h-3 text-silver/40 mr-2 flex-shrink-0" />
              <span className="font-quicksand text-sm text-silver/80 truncate">
                {track.collection || '—'}
              </span>
            </div>

            {/* VAR */}
            <div className="col-span-1 flex items-center justify-center">
              {track.variation_count && track.variation_count > 0 ? (
                <button
                  ref={(el) => { data.varButtonRefs.current[track.id] = el; }}
                  onClick={(e) => {
                    e.stopPropagation();
                    const buttonElement = data.varButtonRefs.current[track.id];
                    if (buttonElement) {
                      data.setVariationsPopup({
                        trackId: track.id,
                        trackName: track.name,
                        anchorElement: buttonElement
                      });
                    }
                  }}
                  className="var-count bg-accent-yellow/20 text-accent-yellow px-2 py-0.5 rounded-full text-xs font-mono min-w-[24px] hover:bg-accent-yellow/30 transition-all transform hover:scale-110"
                >
                  {track.variation_count}
                </button>
              ) : (
                <span className="text-silver/30">—</span>
              )}
            </div>

            {/* Duration */}
            <div className="col-span-1 flex items-center justify-end">
              <span className="font-quicksand text-sm text-silver/60">
                {formatDuration(track.duration)}
              </span>
            </div>

            {/* Ratings */}
            <div className="col-span-3 flex items-center justify-center space-x-3">
              {data.playlistId ? (
                // When viewing a playlist, show only collaborative ratings
                data.ratings[track.id] && (
                  <TrackRatings
                    trackId={track.id}
                    playlistId={data.playlistId}
                    ratings={data.ratings[track.id]}
                    compact={true}
                  />
                )
              ) : (
                // When viewing library, show personal ratings
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newValue = !track.listened;
                      if (data.selectedTracks.length > 1 && data.selectedTracks.includes(track.id)) {
                        data.selectedTracks.forEach(trackId => {
                          data.onRatingUpdate?.(trackId, 'listened', newValue);
                        });
                      } else {
                        data.onRatingUpdate?.(track.id, 'listened', newValue);
                      }
                    }}
                    className={`transition-colors ${
                      track.listened 
                        ? 'text-accent-yellow hover:text-accent-yellow/80' 
                        : 'text-silver/40 hover:text-silver/60'
                    }`}
                    title="Mark as listened"
                  >
                    <Headphones className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newValue = !track.liked;
                      if (data.selectedTracks.length > 1 && data.selectedTracks.includes(track.id)) {
                        data.selectedTracks.forEach(trackId => {
                          data.onRatingUpdate?.(trackId, 'liked', newValue);
                        });
                      } else {
                        data.onRatingUpdate?.(track.id, 'liked', newValue);
                      }
                    }}
                    className={`transition-colors ${
                      track.liked 
                        ? 'text-accent-yellow hover:text-accent-yellow/80' 
                        : 'text-silver/40 hover:text-silver/60'
                    }`}
                    title="Like"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newValue = !track.loved;
                      if (data.selectedTracks.length > 1 && data.selectedTracks.includes(track.id)) {
                        data.selectedTracks.forEach(trackId => {
                          data.onRatingUpdate?.(trackId, 'loved', newValue);
                        });
                      } else {
                        data.onRatingUpdate?.(track.id, 'loved', newValue);
                      }
                    }}
                    className={`transition-colors ${
                      track.loved 
                        ? 'text-accent-coral hover:text-accent-coral/80' 
                        : 'text-silver/40 hover:text-silver/60'
                    }`}
                    title="Love"
                  >
                    <Heart className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  data.onDeleteTrack?.(track.id);
                }}
                className="w-6 h-6 text-silver/60 hover:text-accent-coral transition-colors opacity-0 group-hover:opacity-100"
                title={data.isInPlaylist ? "Remove from playlist" : "Delete track"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  const SortableHeader = ({ column, children, className = "" }: { 
    column: 'title' | 'type' | 'artist' | 'album' | 'duration', 
    children: React.ReactNode,
    className?: string 
  }) => {
    const isActive = sortBy === column;
    return (
      <button
        onClick={() => onSort(column as any)}
        className={`flex items-center space-x-1 hover:text-accent-yellow transition-colors ${isActive ? 'text-accent-yellow' : ''} ${className}`}
      >
        <span>{children}</span>
        {isActive && (
          sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </button>
    );
  };

  const itemSize = compactMode ? 40 : 80; // Adjust based on your row height

  return (
    <div className="flex flex-col h-full">
      {/* Headers */}
      {!compactMode && (
        <div className="grid grid-cols-17 gap-4 px-4 py-2 border-b border-forest-light bg-forest-main/50 text-xs font-quicksand font-semibold text-silver/60 uppercase tracking-wider sticky top-0 z-10">
          <div className="col-span-1"></div>
          <div className="col-span-4">
            <SortableHeader column="title">Title</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader column="type">Type</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader column="artist">Artist</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader column="album">Album</SortableHeader>
          </div>
          <div className="col-span-1 text-center">VAR</div>
          <div className="col-span-1 text-right">
            <SortableHeader column="duration" className="justify-end">Duration</SortableHeader>
          </div>
          <div className="col-span-3 text-center">Rating</div>
          <div className="col-span-1"></div>
        </div>
      )}

      {/* Virtual List */}
      <div className="flex-1" ref={containerRef}>
        <List
          ref={listRef}
          height={containerHeight}
          itemCount={tracks.length}
          itemSize={itemSize}
          itemData={itemData}
          width="100%"
        >
          {Row}
        </List>
      </div>

      {/* Variations Popup */}
      {variationsPopup && (
        <VariationsPopup
          trackId={variationsPopup.trackId}
          trackName={variationsPopup.trackName}
          anchorElement={variationsPopup.anchorElement}
          onClose={() => setVariationsPopup(null)}
          onOpenManagement={(variations) => {
            setVariationsPopup(null);
          }}
        />
      )}
    </div>
  );
};

export default TrackListViewVirtualized;