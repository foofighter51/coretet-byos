import React, { useState, useRef, useCallback } from 'react';
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
  onRatingUpdate?: (trackId: string, rating: 'listened' | 'liked' | 'loved', value: boolean) => void;
  onDeleteTrack?: (trackId: string) => void;
  currentTrackId?: string;
  selectedTracks?: string[];
  onSelectionChange?: (trackIds: string[]) => void;
  showCheckboxes?: boolean;
  isInPlaylist?: boolean;
  playlistId?: string;
  enableReordering?: boolean;
  onReorder?: (tracks: Track[]) => void;
  sortBy?: 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration' | 'date';
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration') => void;
  selectedTrack?: Track | null;
  compactMode?: boolean;
}

const TrackListView: React.FC<TrackListViewProps> = ({ 
  tracks, 
  onTrackSelect, 
  onEditMetadata,
  onRatingUpdate,
  onDeleteTrack,
  currentTrackId,
  selectedTracks = [],
  onSelectionChange,
  showCheckboxes = false,
  isInPlaylist = false,
  playlistId,
  enableReordering = false,
  onReorder,
  sortBy,
  sortDirection,
  onSort,
  selectedTrack,
  compactMode = false
}) => {
  // TrackListView render
  // Ensure tracks is a valid array
  const safeTracks = tracks || [];
  
  const { currentTrack, isPlaying, play, pause } = useAudio();
  const [draggingTrackId, setDraggingTrackId] = useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const { ratings } = useTrackRatings(safeTracks.map(t => t.id), playlistId);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [variationsPopup, setVariationsPopup] = useState<{
    trackId: string;
    trackName: string;
    anchorElement: HTMLElement;
  } | null>(null);
  const varButtonRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  
  const handleSelectAll = () => {
    if (selectedTracks.length === safeTracks.length) {
      onSelectionChange?.([]);
    } else {
      onSelectionChange?.(safeTracks.map(t => t.id));
    }
  };
  
  const handleTrackClick = (trackId: string, index: number, event: React.MouseEvent) => {
    const isCmdOrCtrl = event.metaKey || event.ctrlKey;
    const isShift = event.shiftKey;
    
    if (isCmdOrCtrl) {
      // Toggle selection of clicked track
      if (selectedTracks.includes(trackId)) {
        onSelectionChange?.(selectedTracks.filter(id => id !== trackId));
      } else {
        onSelectionChange?.([...selectedTracks, trackId]);
      }
      setLastSelectedIndex(index);
    } else if (isShift && lastSelectedIndex !== null) {
      // Select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const rangeIds = safeTracks.slice(start, end + 1).map(t => t.id);
      
      // Merge with existing selection
      const newSelection = [...new Set([...selectedTracks, ...rangeIds])];
      onSelectionChange?.(newSelection);
    } else {
      // Single selection (clear others)
      onSelectionChange?.([trackId]);
      setLastSelectedIndex(index);
    }
  };
  
  const handleTrackDoubleClick = (track: Track, event: React.MouseEvent) => {
    event.stopPropagation();
    // Double-click now triggers the track details panel
    onEditMetadata?.(track);
  };

  // Drag and drop handlers for reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggingTrackId(safeTracks[index]?.id || null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDraggedOverIndex(index);
  };

  const handleDragLeave = () => {
    setDraggedOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) {
      setDraggingTrackId(null);
      setDraggedOverIndex(null);
      return;
    }

    const newTracks = [...safeTracks];
    const [draggedTrack] = newTracks.splice(dragIndex, 1);
    newTracks.splice(dropIndex, 0, draggedTrack);
    
    onReorder?.(newTracks);
    setDraggingTrackId(null);
    setDraggedOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingTrackId(null);
    setDraggedOverIndex(null);
  };
  const SortableHeader = ({ column, children, className = '' }: { column: 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration', children: React.ReactNode, className?: string }) => (
    <button
      onClick={() => onSort?.(column)}
      className={`flex items-center space-x-1 hover:text-silver transition-colors ${className}`}
    >
      <span>{children}</span>
      {sortBy === column && (
        sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
      )}
    </button>
  );

  return (
    <div className="w-full">
      {/* Header */}
      {compactMode ? (
        <div className="sticky top-0 z-10 bg-forest-main px-4 py-3 border-b border-forest-light text-silver/60 font-quicksand text-xs uppercase tracking-wider">
          <div>Tracks</div>
        </div>
      ) : (
        <div className="sticky top-0 z-10 bg-forest-main grid grid-cols-17 gap-4 px-4 py-3 border-b border-forest-light text-silver/60 font-quicksand text-xs uppercase tracking-wider">
          <div className="col-span-1"></div>
          <div className="col-span-4">
            <SortableHeader column="title">Title</SortableHeader>
          </div>
          <div className="col-span-2">
            <SortableHeader column="type">Category</SortableHeader>
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

      {/* Track Rows */}
      <div className="divide-y divide-forest-light">
        {safeTracks.map((track, index) => {
          const isCurrentTrack = currentTrack === track.id;
          const isPlayingThis = isCurrentTrack && isPlaying;
          const isEvenRow = index % 2 === 0;
          
          const handlePlayPause = (e: React.MouseEvent) => {
            e.stopPropagation();
            if (isPlayingThis) {
              pause();
            } else {
              play(track.id, track.url);
            }
          };
          
          
          return (
            <div
              key={track.id}
              draggable={!enableReordering}
              onClick={(e) => handleTrackClick(track.id, index, e)}
              onDoubleClick={(e) => handleTrackDoubleClick(track, e)}
              onDragStart={(e) => {
                if (!enableReordering) {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('trackId', track.id);
                  setDraggingTrackId(track.id);
                  // If multiple tracks are selected and this track is one of them, drag all selected tracks
                  if (selectedTracks.length > 0 && selectedTracks.includes(track.id)) {
                    e.dataTransfer.setData('trackIds', JSON.stringify(selectedTracks));
                    console.log('Dragging multiple tracks:', selectedTracks);
                  } else {
                    e.dataTransfer.setData('trackIds', JSON.stringify([track.id]));
                    console.log('Dragging single track:', track.id);
                  }
                }
              }}
              onDragEnd={() => !enableReordering && setDraggingTrackId(null)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              data-tutorial={index === 0 ? "track-row" : undefined}
              className={`track-list-item ${compactMode ? 'block' : 'grid grid-cols-17 gap-4'} px-4 py-2 transition-all group cursor-pointer select-none ${
                draggedOverIndex === index && enableReordering
                  ? 'border-t-2 border-accent-yellow'
                  : ''
              } ${
                draggingTrackId === track.id
                  ? 'opacity-50 cursor-grabbing'
                  : selectedTrack?.id === track.id
                  ? 'bg-accent-yellow text-forest-dark'
                  : isCurrentTrack 
                  ? 'bg-accent-yellow/10' 
                  : selectedTracks.includes(track.id)
                    ? 'bg-accent-yellow text-forest-dark'
                    : isEvenRow 
                      ? 'bg-forest-light/10 hover:bg-forest-light/30' 
                      : 'hover:bg-forest-light/30'
              }`}
            >
              {compactMode ? (
                // Compact mode - show only title
                <div className="min-w-0 flex-1">
                  <h3 className={`font-quicksand font-medium text-sm truncate ${
                    isCurrentTrack ? 'text-accent-yellow' : (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark' : 'text-silver'
                  }`}>
                    {track.name}
                  </h3>
                </div>
              ) : (
                // Full mode - show all columns
                <>
              {/* Drag Handle and Play Button */}
              <div className="col-span-1 flex items-center space-x-1">
                {enableReordering && (
                  <div 
                    className={`cursor-move p-1 hover:text-silver ${
                      (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                        ? 'text-forest-dark/50' 
                        : 'text-silver/40'
                    }`}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      handleDragStart(e, index);
                    }}
                    onDragEnd={(e) => {
                      e.stopPropagation();
                      handleDragEnd();
                    }}
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                )}
                <button
                  onClick={handlePlayPause}
                  className={`w-8 h-8 rounded-full transition-all flex items-center justify-center ${
                    isCurrentTrack 
                      ? 'bg-accent-yellow text-forest-dark opacity-100' 
                      : selectedTracks.includes(track.id)
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
                    isCurrentTrack ? 'text-accent-yellow' : (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark' : 'text-silver'
                  }`}>
                    {track.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-0.5">
                    {/* Inline metadata */}
                    {(track.key || track.tempo || track.updated_at) && (
                      <div className={`flex items-center gap-2 text-xs ${
                        (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                          ? 'text-forest-dark/60' 
                          : 'text-silver/50'
                      }`}>
                        {track.key && (
                          <span className="font-mono">{track.key}</span>
                        )}
                        {track.key && track.tempo && (
                          <span className={(selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark/40' : 'text-silver/30'}>•</span>
                        )}
                        {track.tempo && (
                          <span>{track.tempo} BPM</span>
                        )}
                        {(track.key || track.tempo) && track.updated_at && (
                          <span className={(selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark/40' : 'text-silver/30'}>•</span>
                        )}
                        {track.updated_at && (
                          <span className={(selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark/50' : 'text-silver/40'}>
                            {formatRelativeDate(track.updated_at)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Tags */}
                    {track.tags.length > 0 && (
                      <>
                        {(track.key || track.tempo || track.updated_at) && (
                          <span className={`text-xs ${(selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark/40' : 'text-silver/30'}`}>•</span>
                        )}
                        <div className="flex gap-1">
                          {track.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                                  ? 'bg-forest-dark/20 text-forest-dark/70' 
                                  : 'bg-forest-light text-silver/60'
                              }`}
                            >
                              {tag}
                            </span>
                          ))}
                          {track.tags.length > 2 && (
                            <span className={`text-xs ${(selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark/50' : 'text-silver/40'}`}>
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
                <span className={`font-quicksand text-sm capitalize ${
                  (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                    ? 'text-forest-dark/80' 
                    : 'text-silver/80'
                }`}>
                  {track.category.replace('-', ' ')}
                </span>
              </div>

              {/* Artist */}
              <div className="col-span-2 flex items-center">
                <span className={`font-quicksand text-sm truncate ${
                  (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                    ? 'text-forest-dark/80' 
                    : 'text-silver/80'
                }`}>
                  {track.artist || '—'}
                </span>
              </div>

              {/* Album */}
              <div className="col-span-2 flex items-center">
                <Folder className={`w-3 h-3 mr-2 flex-shrink-0 ${
                  (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                    ? 'text-forest-dark/50' 
                    : 'text-silver/40'
                }`} />
                <span className={`font-quicksand text-sm truncate ${
                  (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                    ? 'text-forest-dark/80' 
                    : 'text-silver/80'
                }`}>
                  {track.collection || '—'}
                </span>
              </div>

              {/* VAR */}
              <div className="col-span-1 flex items-center justify-center">
                {track.variation_count && track.variation_count > 0 ? (
                  <button
                    ref={(el) => { varButtonRefs.current[track.id] = el; }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const buttonElement = varButtonRefs.current[track.id];
                      if (buttonElement) {
                        setVariationsPopup({
                          trackId: track.id,
                          trackName: track.name,
                          anchorElement: buttonElement
                        });
                      }
                    }}
                    className={`var-count px-2 py-0.5 rounded-full text-xs font-mono min-w-[36px] transition-all transform hover:scale-110 ${
                      (selectedTrack?.id === track.id || selectedTracks.includes(track.id))
                        ? 'bg-forest-dark/20 text-forest-dark hover:bg-forest-dark/30'
                        : 'bg-accent-yellow/20 text-accent-yellow hover:bg-accent-yellow/30'
                    }`}
                  >
                    {track.variation_count} {track.primary_track_id ? 'V' : 'P'}
                  </button>
                ) : (
                  <span className={(selectedTrack?.id === track.id || selectedTracks.includes(track.id)) ? 'text-forest-dark/40' : 'text-silver/30'}>—</span>
                )}
              </div>

              {/* Duration */}
              <div className="col-span-1 flex items-center justify-end">
                <span className={`font-quicksand text-sm ${
                  (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                    ? 'text-forest-dark/70' 
                    : 'text-silver/60'
                }`}>
                  {formatDuration(track.duration)}
                </span>
              </div>

              {/* Ratings */}
              <div className="col-span-3 flex items-center justify-center space-x-3">
                {playlistId ? (
                  // When viewing a playlist, show only collaborative ratings
                  ratings[track.id] && (
                    <TrackRatings
                      trackId={track.id}
                      playlistId={playlistId}
                      ratings={ratings[track.id]}
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
                        // If multiple tracks are selected and this track is one of them, update all selected tracks
                        if (selectedTracks.length > 1 && selectedTracks.includes(track.id)) {
                          selectedTracks.forEach(trackId => {
                            onRatingUpdate?.(trackId, 'listened', newValue);
                          });
                        } else {
                          onRatingUpdate?.(track.id, 'listened', newValue);
                        }
                      }}
                      className={`transition-colors ${
                        track.listened 
                          ? (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                            ? 'text-forest-dark hover:text-forest-dark/80' 
                            : 'text-accent-yellow hover:text-accent-yellow/80'
                          : (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                            ? 'text-forest-dark/50 hover:text-forest-dark/70' 
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
                        // If multiple tracks are selected and this track is one of them, update all selected tracks
                        if (selectedTracks.length > 1 && selectedTracks.includes(track.id)) {
                          selectedTracks.forEach(trackId => {
                            onRatingUpdate?.(trackId, 'liked', newValue);
                          });
                        } else {
                          onRatingUpdate?.(track.id, 'liked', newValue);
                        }
                      }}
                      className={`transition-colors ${
                        track.liked 
                          ? (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                            ? 'text-forest-dark hover:text-forest-dark/80' 
                            : 'text-accent-yellow hover:text-accent-yellow/80'
                          : (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                            ? 'text-forest-dark/50 hover:text-forest-dark/70' 
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
                        // If multiple tracks are selected and this track is one of them, update all selected tracks
                        if (selectedTracks.length > 1 && selectedTracks.includes(track.id)) {
                          selectedTracks.forEach(trackId => {
                            onRatingUpdate?.(trackId, 'loved', newValue);
                          });
                        } else {
                          onRatingUpdate?.(track.id, 'loved', newValue);
                        }
                      }}
                      className={`transition-colors ${
                        track.loved 
                          ? (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                            ? 'text-forest-dark hover:text-forest-dark/80' 
                            : 'text-accent-coral hover:text-accent-coral/80'
                          : (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                            ? 'text-forest-dark/50 hover:text-forest-dark/70' 
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
                    onDeleteTrack?.(track.id);
                  }}
                  className={`w-6 h-6 transition-colors opacity-0 group-hover:opacity-100 ${
                    (selectedTrack?.id === track.id || selectedTracks.includes(track.id)) 
                      ? 'text-forest-dark/60 hover:text-forest-dark' 
                      : 'text-silver/60 hover:text-accent-coral'
                  }`}
                  title={isInPlaylist ? "Remove from playlist" : "Delete track"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Variations Popup */}
      {variationsPopup && (
        <VariationsPopup
          trackId={variationsPopup.trackId}
          trackName={variationsPopup.trackName}
          anchorElement={variationsPopup.anchorElement}
          onClose={() => setVariationsPopup(null)}
          onOpenManagement={(variations) => {
            // TODO: Open management modal
            setVariationsPopup(null);
          }}
        />
      )}
    </div>
  );
};

export default TrackListView;