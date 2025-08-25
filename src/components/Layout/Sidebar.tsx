import React, { useState } from 'react';
import { Music2, Mic, Lightbulb, MessageSquare, Search, Tag, Folder, ChevronDown, ChevronRight, Award, Headphones, ThumbsUp, Heart, ListMusic, Plus, X, Radio, Share2, Users, ChevronLeft, Library, Sparkles } from 'lucide-react';
import { TrackCategory } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { supabase } from '../../lib/supabase';
import { getTagColor } from '../../utils/tags';
import SharePlaylistModal from '../Sharing/SharePlaylistModal';
import SidebarPopup from './SidebarPopup';
import { SmartPlaylistCreator } from '../Playlists/SmartPlaylistCreator';
import { SmartPlaylistsList } from '../Playlists/SmartPlaylistsList';

interface SidebarError {
  message?: string;
  [key: string]: unknown;
}

interface SidebarProps {
  activeCategory: TrackCategory | 'all';
  onCategoryChange: (category: TrackCategory | 'all') => void;
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  selectedCollection?: string | null;
  onCollectionSelect?: (collection: string | null) => void;
  selectedRating?: 'listened' | 'liked' | 'loved' | null;
  onRatingSelect?: (rating: 'listened' | 'liked' | 'loved' | null) => void;
  selectedPlaylist?: string | null;
  onPlaylistSelect?: (playlistId: string | null) => void;
  activeView?: 'library';
  onViewChange?: (view: 'library') => void;
}

const categories = [
  { id: 'all' as const, name: 'All Tracks', icon: Library, color: 'text-accent-yellow' },
  { id: 'songs' as const, name: 'Songs', icon: Music2, color: 'text-accent-yellow' },
  { id: 'final-versions' as const, name: 'Final Versions', icon: Award, color: 'text-accent-yellow' },
  { id: 'live-performances' as const, name: 'Live Performances', icon: Radio, color: 'text-accent-coral' },
  { id: 'demos' as const, name: 'Demos', icon: Mic, color: 'text-accent-coral' },
  { id: 'ideas' as const, name: 'Ideas', icon: Lightbulb, color: 'text-accent-yellow' },
  { id: 'voice-memos' as const, name: 'Voice Memos', icon: MessageSquare, color: 'text-accent-coral' },
];

const Sidebar: React.FC<SidebarProps> = ({ activeCategory, onCategoryChange, selectedTags, onTagToggle, selectedCollection, onCollectionSelect, selectedRating, onRatingSelect, selectedPlaylist, onPlaylistSelect, activeView = 'library', onViewChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const { tracks, getTracksByCategory, getAllUsedTags, playlists, sharedPlaylists, createPlaylist, addTrackToPlaylist } = useLibrary();
  const [expandedSections, setExpandedSections] = useState({
    collections: true,
    playlists: true,
    sharedPlaylists: false,
    ratings: true,
    tags: true
  });
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [dragOverPlaylist, setDragOverPlaylist] = useState<string | null>(null);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [shareModalPlaylist, setShareModalPlaylist] = useState<{ id: string; name: string } | null>(null);
  const [activePopup, setActivePopup] = useState<'playlists' | 'shared' | 'collections' | 'ratings' | 'tags' | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [showSmartPlaylistCreator, setShowSmartPlaylistCreator] = useState(false);
  const [showSmartPlaylists, setShowSmartPlaylists] = useState(false);

  const getTrackCount = (category: TrackCategory | 'all') => {
    if (category === 'all') return tracks.length;
    return getTracksByCategory(category).length;
  };

  const usedTags = getAllUsedTags();
  
  // Get unique collections
  const getUniqueCollections = () => {
    const collections = new Map<string, number>();
    tracks.forEach(track => {
      if (track.collection) {
        collections.set(track.collection, (collections.get(track.collection) || 0) + 1);
      }
    });
    return Array.from(collections.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };
  
  const uniqueCollections = getUniqueCollections();
  
  // Get rating counts
  const getRatingCounts = () => {
    const counts = {
      listened: 0,
      liked: 0,
      loved: 0
    };
    tracks.forEach(track => {
      if (track.listened) counts.listened++;
      if (track.liked) counts.liked++;
      if (track.loved) counts.loved++;
    });
    return counts;
  };
  
  const ratingCounts = getRatingCounts();
  
  const toggleSection = (section: 'collections' | 'playlists' | 'sharedPlaylists' | 'ratings' | 'tags') => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };
  
  const handlePopupOpen = (type: 'playlists' | 'shared' | 'collections' | 'ratings' | 'tags', event: React.MouseEvent) => {
    if (!isCollapsed) {
      toggleSection(type as any);
      return;
    }
    
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    setPopupPosition({
      top: rect.top,
      left: rect.right + 8
    });
    setActivePopup(type);
  };

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      try {
        setPlaylistError(null);
        await createPlaylist(newPlaylistName.trim());
        setNewPlaylistName('');
        setShowNewPlaylist(false);
        // Close popup if open
        if (activePopup === 'playlists') {
          setActivePopup(null);
        }
      } catch (error: unknown) {
        const sidebarError = error as SidebarError;
        console.error('Error creating playlist:', sidebarError);
        const errorMessage = sidebarError.message || 'Failed to create playlist';
        setPlaylistError(errorMessage);
        // Don't auto-clear error messages that require user action
        if (!errorMessage.includes('migrations') && !errorMessage.includes('Authentication')) {
          setTimeout(() => setPlaylistError(null), 5000);
        }
      }
    }
  };

  return (
    <aside className={`h-full bg-forest-main border-r border-forest-light transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-full'}`} data-tutorial="sidebar">
      <div className={`${isCollapsed ? 'p-2' : 'p-4'}`}>
        {/* Collapse toggle */}
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'} mb-4`}>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-forest-light rounded-lg transition-colors"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`w-4 h-4 text-silver transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
        
        
        <nav className="space-y-2" data-tutorial="categories">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id && !selectedPlaylist && !selectedCollection;
            const count = getTrackCount(category.id);
            
            return (
              <button
                key={category.id}
                onClick={() => {
                  onCategoryChange(category.id);
                  // Clear playlist and collection selections
                  onPlaylistSelect?.(null);
                  onCollectionSelect?.(null);
                  // Switch back to library view when selecting a category
                  if (activeView === 'tasks') {
                    onViewChange?.('library');
                  }
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2 rounded-lg font-quicksand text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-forest-light text-accent-yellow'
                    : 'text-silver/70 hover:bg-forest-light/50 hover:text-silver'
                }`}
                title={isCollapsed ? category.name : undefined}
              >
                <div className={`flex items-center ${isCollapsed ? '' : 'space-x-3'}`}>
                  <Icon className={`w-4 h-4 ${isActive ? category.color : 'text-silver/60'}`} />
                  {!isCollapsed && <span>{category.name}</span>}
                </div>
                {!isCollapsed && count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    isActive ? 'bg-accent-yellow text-forest-dark' : 'bg-forest-dark text-silver/80'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>



        {/* My Playlists */}
        <div className="mt-8">
          <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
            {isCollapsed ? (
              <button
                onClick={(e) => handlePopupOpen('playlists', e)}
                className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                title="My Playlists"
              >
                <ListMusic className="w-4 h-4 text-accent-yellow" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => toggleSection('playlists')}
                  className="flex items-center space-x-2 hover:text-accent-yellow transition-colors flex-1"
                >
                  <ListMusic className="w-4 h-4 text-accent-yellow" />
                  <h3 className="font-anton text-sm text-silver">My Playlists</h3>
                </button>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSmartPlaylistCreator(true)}
                    className="hover:bg-forest-light rounded p-1 transition-colors"
                    title="Create smart playlist"
                  >
                    <Sparkles className="w-3 h-3 text-silver/60 hover:text-accent-yellow" />
                  </button>
                  <button
                    onClick={() => setShowNewPlaylist(true)}
                    className="hover:bg-forest-light rounded p-1 transition-colors"
                    title="Create new playlist"
                    data-tutorial="playlist-create"
                  >
                    <Plus className="w-3 h-3 text-silver/60 hover:text-accent-yellow" />
                  </button>
                  <button
                    onClick={() => toggleSection('playlists')}
                    className="hover:bg-forest-light rounded p-1 transition-colors"
                  >
                    {expandedSections.playlists ? (
                      <ChevronDown className="w-4 h-4 text-silver/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-silver/60" />
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
          
          {/* New Playlist Input - Show in sidebar when expanded, in popup when collapsed */}
          {showNewPlaylist && !isCollapsed && (
            <div className="px-2 mb-4">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreatePlaylist()}
                  placeholder="Playlist name..."
                  className="flex-1 bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  autoFocus
                />
                <button
                  onClick={handleCreatePlaylist}
                  className="p-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setShowNewPlaylist(false);
                    setNewPlaylistName('');
                  }}
                  className="p-2 bg-forest-light text-silver rounded-lg hover:bg-forest-light/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          
          {expandedSections.playlists && !isCollapsed && (
            <div className="space-y-2 mb-6">
              {/* Error message */}
              {playlistError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 mb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-red-400 flex-1">{playlistError}</p>
                    <button
                      onClick={() => setPlaylistError(null)}
                      className="ml-2 hover:bg-red-500/20 rounded p-1 transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                  {playlistError.includes('database migrations') && (
                    <p className="font-quicksand text-xs text-silver/60 mt-1">
                      See APPLY_MIGRATIONS.md for setup instructions
                    </p>
                  )}
                </div>
              )}
              
              {/* Playlist list */}
              {playlists.map(playlist => {
                const isSelected = selectedPlaylist === playlist.id;
                const isDraggedOver = dragOverPlaylist === playlist.id;
                return (
                  <div
                    key={playlist.id}
                    onClick={() => {
                      if (!isSelected) {
                        onPlaylistSelect?.(playlist.id);
                        // Clear collection selection
                        onCollectionSelect?.(null);
                        // Switch back to library view if in tasks view
                        if (activeView === 'tasks') {
                          onViewChange?.('library');
                        }
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      setDragOverPlaylist(playlist.id);
                    }}
                    onDragLeave={() => {
                      setDragOverPlaylist(null);
                    }}
                    onDrop={async (e) => {
                      e.preventDefault();
                      setDragOverPlaylist(null);
                      
                      const trackIdsJson = e.dataTransfer.getData('trackIds');
                      console.log('Drop event - trackIds data:', trackIdsJson);
                      if (trackIdsJson) {
                        try {
                          const trackIds = JSON.parse(trackIdsJson) as string[];
                          console.log('Dropping tracks into playlist:', playlist.name, 'Track IDs:', trackIds);
                          
                          // Check if user is authenticated first
                          const { data: { user } } = await supabase.auth.getUser();
                          if (!user) {
                            setPlaylistError('You must be logged in to add tracks to playlists');
                            return;
                          }
                          
                          let successCount = 0;
                          const errors: string[] = [];
                          
                          for (const trackId of trackIds) {
                            try {
                              await addTrackToPlaylist(playlist.id, trackId);
                              successCount++;
                            } catch (error: unknown) {
                              const trackError = error as SidebarError;
                              // Continue with other tracks even if one fails
                              console.error(`Error adding track ${trackId} to playlist:`, trackError);
                              if (trackError.message?.includes('database migrations')) {
                                errors.push('Playlists table not found');
                                break; // Stop trying if tables don't exist
                              } else if (error.message?.includes('already in playlist')) {
                                // Don't count duplicates as errors
                              } else {
                                errors.push(error.message || 'Unknown error');
                              }
                            }
                          }
                          if (successCount === 0 && errors.length > 0) {
                            const uniqueErrors = [...new Set(errors)];
                            setPlaylistError(uniqueErrors[0] || 'Failed to add tracks to playlist');
                          } else if (successCount === 0) {
                            setPlaylistError('No tracks were added. They may already be in the playlist.');
                          } else if (successCount < trackIds.length) {
                            setPlaylistError(`Added ${successCount} of ${trackIds.length} tracks. Some tracks may already be in the playlist.`);
                            // Auto-clear partial success message after 3 seconds
                            setTimeout(() => setPlaylistError(null), 3000);
                          } else {
                            // Clear any previous errors on full success
                            setPlaylistError(null);
                          }
                        } catch (error: unknown) {
                          const playlistError = error as SidebarError;
                          console.error('Error adding tracks to playlist:', playlistError);
                          setPlaylistError(playlistError.message || 'Failed to add tracks to playlist.');
                        }
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 group cursor-pointer ${
                      isDraggedOver
                        ? 'bg-accent-yellow/20 border border-accent-yellow'
                        : isSelected
                        ? 'bg-forest-light border border-accent-yellow'
                        : 'hover:bg-forest-light/50'
                    }`}
                  >
                    <span className={`font-quicksand text-sm truncate ${
                      isDraggedOver || isSelected ? 'text-accent-yellow' : 'text-silver'
                    }`}>{playlist.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareModalPlaylist({ id: playlist.id, name: playlist.name });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-forest-main rounded"
                        title="Share playlist"
                      >
                        <Share2 className="w-3 h-3 text-silver/60 hover:text-accent-yellow" />
                      </button>
                      <span className={`text-xs ${isDraggedOver || isSelected ? 'text-accent-yellow' : 'text-silver/60'}`}>
                        {playlist.trackIds.length}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              {playlists.length === 0 && !showNewPlaylist && (
                <p className="text-xs text-silver/60 text-center py-2">
                  No playlists yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Shared Playlists */}
        <div className="mt-6">
          <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
            {isCollapsed ? (
              <button
                onClick={(e) => handlePopupOpen('shared', e)}
                className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                title="Shared Playlists"
              >
                <Users className="w-4 h-4 text-accent-coral" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => toggleSection('sharedPlaylists')}
                  className="flex items-center space-x-2 hover:text-accent-yellow transition-colors flex-1"
                >
                  <Users className="w-4 h-4 text-accent-coral" />
                  <h3 className="font-anton text-sm text-silver">Shared Playlists</h3>
                </button>
                <button
                  onClick={() => toggleSection('sharedPlaylists')}
                  className="hover:bg-forest-light rounded p-1 transition-colors"
                >
                  {expandedSections.sharedPlaylists ? (
                    <ChevronDown className="w-4 h-4 text-silver/60" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-silver/60" />
                  )}
                </button>
              </>
            )}
          </div>
          
          {expandedSections.sharedPlaylists && !isCollapsed && (
            <div className="space-y-2 mb-6">
              {sharedPlaylists.length > 0 ? (
                sharedPlaylists.map(playlist => {
                  const isSelected = selectedPlaylist === playlist.id;
                  const isDraggedOver = dragOverPlaylist === playlist.id;
                  return (
                    <div
                      key={playlist.id}
                      onClick={() => {
                        if (!isSelected) {
                          onPlaylistSelect?.(playlist.id);
                          // Clear collection selection
                          onCollectionSelect?.(null);
                          // Switch back to library view if in tasks view
                          if (activeView === 'tasks') {
                            onViewChange?.('library');
                          }
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = playlist.shareInfo?.canEdit ? 'copy' : 'none';
                        if (playlist.shareInfo?.canEdit) {
                          setDragOverPlaylist(playlist.id);
                        }
                      }}
                      onDragLeave={() => {
                        setDragOverPlaylist(null);
                      }}
                      onDrop={async (e) => {
                        e.preventDefault();
                        setDragOverPlaylist(null);
                        
                        if (!playlist.shareInfo?.canEdit) {
                          setPlaylistError('You do not have permission to edit this shared playlist');
                          return;
                        }
                        
                        const trackIdsJson = e.dataTransfer.getData('trackIds');
                        if (trackIdsJson) {
                          try {
                            const trackIds = JSON.parse(trackIdsJson) as string[];
                            
                            let successCount = 0;
                            const errors: string[] = [];
                            
                            for (const trackId of trackIds) {
                              try {
                                await addTrackToPlaylist(playlist.id, trackId);
                                successCount++;
                              } catch (error: unknown) {
                                const trackError = error as SidebarError;
                                console.error(`Error adding track ${trackId} to shared playlist:`, trackError);
                                if (!trackError.message?.includes('already in playlist')) {
                                  errors.push(trackError.message || 'Unknown error');
                                }
                              }
                            }
                            
                            if (successCount === 0 && errors.length > 0) {
                              setPlaylistError(errors[0]);
                            } else if (successCount > 0) {
                              setPlaylistError(null);
                            }
                          } catch (error: unknown) {
                            const playlistError = error as SidebarError;
                            console.error('Error adding tracks to shared playlist:', playlistError);
                            setPlaylistError(playlistError.message || 'Failed to add tracks');
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 group cursor-pointer ${
                        isDraggedOver
                          ? 'bg-accent-coral/20 border border-accent-coral'
                          : isSelected
                          ? 'bg-forest-light border border-accent-coral'
                          : 'hover:bg-forest-light/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Users className="w-3 h-3 text-accent-coral flex-shrink-0" />
                        <span className={`font-quicksand text-sm truncate ${
                          isDraggedOver || isSelected ? 'text-accent-coral' : 'text-silver'
                        }`}>{playlist.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {playlist.shareInfo?.canEdit && (
                          <span className="text-xs text-silver/40" title="Can edit">✏️</span>
                        )}
                        <span className={`text-xs ${isDraggedOver || isSelected ? 'text-accent-coral' : 'text-silver/60'}`}>
                          {playlist.trackIds.length}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-silver/60 text-center py-2">
                  No shared playlists yet
                </p>
              )}
            </div>
          )}
        </div>

        {/* Collections */}
        {uniqueCollections.length > 0 && (
          <div className="mt-8">
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
              {isCollapsed ? (
                <button
                  onClick={(e) => handlePopupOpen('collections', e)}
                  className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                  title="Albums"
                >
                  <Folder className="w-4 h-4 text-accent-yellow" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection('collections')}
                    className="flex items-center space-x-2 hover:text-accent-yellow transition-colors flex-1"
                  >
                    <Folder className="w-4 h-4 text-accent-yellow" />
                    <h3 className="font-anton text-sm text-silver">Albums</h3>
                  </button>
                  <button
                    onClick={() => toggleSection('collections')}
                    className="hover:bg-forest-light rounded p-1 transition-colors"
                  >
                    {expandedSections.collections ? (
                      <ChevronDown className="w-4 h-4 text-silver/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-silver/60" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {expandedSections.collections && !isCollapsed && (
              <div className="space-y-2 mb-6">
                {uniqueCollections.slice(0, 5).map(({ name, count }) => {
                  const isSelected = selectedCollection === name;
                  return (
                    <button
                      key={name}
                      onClick={() => {
                        if (!isSelected) {
                          onCollectionSelect?.(name);
                          // Clear playlist selection
                          onPlaylistSelect?.(null);
                          // Switch back to library view if in tasks view
                          if (activeView === 'tasks') {
                            onViewChange?.('library');
                          }
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'bg-forest-light border border-accent-yellow'
                          : 'hover:bg-forest-light/50'
                      }`}
                    >
                      <span className={`font-quicksand text-sm truncate ${
                        isSelected ? 'text-accent-yellow' : 'text-silver'
                      }`}>{name}</span>
                      <span className={`text-xs ${isSelected ? 'text-accent-yellow' : 'text-silver/60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
                {uniqueCollections.length > 5 && (
                  <button className="w-full text-xs text-silver/60 hover:text-accent-yellow transition-colors py-2">
                    View all {uniqueCollections.length} albums...
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Ratings */}
        {(ratingCounts.listened > 0 || ratingCounts.liked > 0 || ratingCounts.loved > 0) && (
          <div className="mt-6">
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
              {isCollapsed ? (
                <button
                  onClick={(e) => handlePopupOpen('ratings', e)}
                  className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                  title="Ratings"
                >
                  <Heart className="w-4 h-4 text-accent-coral" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection('ratings')}
                    className="flex items-center space-x-2 hover:text-accent-yellow transition-colors flex-1"
                  >
                    <Heart className="w-4 h-4 text-accent-coral" />
                    <h3 className="font-anton text-sm text-silver">Ratings</h3>
                  </button>
                  <button
                    onClick={() => toggleSection('ratings')}
                    className="hover:bg-forest-light rounded p-1 transition-colors"
                  >
                    {expandedSections.ratings ? (
                      <ChevronDown className="w-4 h-4 text-silver/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-silver/60" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {expandedSections.ratings && !isCollapsed && (
              <div className="space-y-2 mb-6">
                {/* Listened */}
                {ratingCounts.listened > 0 && (
                  <button
                    onClick={() => {
                      onRatingSelect?.(selectedRating === 'listened' ? null : 'listened');
                      // Switch back to library view if in tasks view
                      if (activeView === 'tasks') {
                        onViewChange?.('library');
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                      selectedRating === 'listened'
                        ? 'bg-forest-light border border-accent-yellow'
                        : 'hover:bg-forest-light/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Headphones className="w-4 h-4 text-accent-yellow" />
                      <span className={`font-quicksand text-sm ${
                        selectedRating === 'listened' ? 'text-accent-yellow' : 'text-silver'
                      }`}>Listened</span>
                    </div>
                    <span className={`text-xs ${selectedRating === 'listened' ? 'text-accent-yellow' : 'text-silver/60'}`}>
                      {ratingCounts.listened}
                    </span>
                  </button>
                )}
                
                {/* Liked */}
                {ratingCounts.liked > 0 && (
                  <button
                    onClick={() => {
                      onRatingSelect?.(selectedRating === 'liked' ? null : 'liked');
                      // Switch back to library view if in tasks view
                      if (activeView === 'tasks') {
                        onViewChange?.('library');
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                      selectedRating === 'liked'
                        ? 'bg-forest-light border border-accent-yellow'
                        : 'hover:bg-forest-light/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <ThumbsUp className="w-4 h-4 text-accent-yellow" />
                      <span className={`font-quicksand text-sm ${
                        selectedRating === 'liked' ? 'text-accent-yellow' : 'text-silver'
                      }`}>Liked</span>
                    </div>
                    <span className={`text-xs ${selectedRating === 'liked' ? 'text-accent-yellow' : 'text-silver/60'}`}>
                      {ratingCounts.liked}
                    </span>
                  </button>
                )}
                
                {/* Loved */}
                {ratingCounts.loved > 0 && (
                  <button
                    onClick={() => {
                      onRatingSelect?.(selectedRating === 'loved' ? null : 'loved');
                      // Switch back to library view if in tasks view
                      if (activeView === 'tasks') {
                        onViewChange?.('library');
                      }
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                      selectedRating === 'loved'
                        ? 'bg-forest-light border border-accent-coral'
                        : 'hover:bg-forest-light/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Heart className="w-4 h-4 text-accent-coral" />
                      <span className={`font-quicksand text-sm ${
                        selectedRating === 'loved' ? 'text-accent-coral' : 'text-silver'
                      }`}>Loved</span>
                    </div>
                    <span className={`text-xs ${selectedRating === 'loved' ? 'text-accent-coral' : 'text-silver/60'}`}>
                      {ratingCounts.loved}
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tags */}
        {usedTags.length > 0 && (
          <div className="mt-6">
            <div className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
              {isCollapsed ? (
                <button
                  onClick={(e) => handlePopupOpen('tags', e)}
                  className="p-2 hover:bg-forest-light rounded-lg transition-colors"
                  title="Tags"
                >
                  <Tag className="w-4 h-4 text-accent-yellow" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => toggleSection('tags')}
                    className="flex items-center space-x-2 hover:text-accent-yellow transition-colors flex-1"
                  >
                    <Tag className="w-4 h-4 text-accent-yellow" />
                    <h3 className="font-anton text-sm text-silver">Tags</h3>
                  </button>
                  <button
                    onClick={() => toggleSection('tags')}
                    className="hover:bg-forest-light rounded p-1 transition-colors"
                  >
                    {expandedSections.tags ? (
                      <ChevronDown className="w-4 h-4 text-silver/60" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-silver/60" />
                    )}
                  </button>
                </>
              )}
            </div>
            
            {expandedSections.tags && !isCollapsed && (
              <div className="space-y-2">
                {usedTags.slice(0, 8).map(({ tag, count }) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => onTagToggle(tag)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                        isSelected
                          ? 'bg-forest-light border border-accent-yellow'
                          : 'hover:bg-forest-light/50'
                      }`}
                    >
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-silver ${getTagColor(tag)}`}>
                        {tag}
                      </span>
                      <span className={`text-xs ${isSelected ? 'text-accent-yellow' : 'text-silver/60'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
                
                {usedTags.length > 8 && (
                  <button className="w-full text-xs text-silver/60 hover:text-accent-yellow transition-colors py-2">
                    View all {usedTags.length} tags...
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Share Playlist Modal */}
      {shareModalPlaylist && (
        <SharePlaylistModal
          playlistId={shareModalPlaylist.id}
          playlistName={shareModalPlaylist.name}
          onClose={() => setShareModalPlaylist(null)}
        />
      )}
      
      {/* Smart Playlist Creator Modal */}
      {showSmartPlaylistCreator && (
        <SmartPlaylistCreator
          onClose={() => setShowSmartPlaylistCreator(false)}
          onCreated={() => {
            setShowSmartPlaylistCreator(false);
            // Optionally refresh playlists or show a success message
          }}
        />
      )}
      
      {/* Popups for collapsed sidebar */}
      {/* Playlists Popup */}
      <SidebarPopup
        isOpen={activePopup === 'playlists'}
        onClose={() => {
          setActivePopup(null);
          setShowNewPlaylist(false);
          setNewPlaylistName('');
        }}
        title="My Playlists"
        icon={<ListMusic className="w-4 h-4 text-accent-yellow" />}
        position={popupPosition}
      >
        <div className="p-4">
          {/* New playlist button or input */}
          {!showNewPlaylist ? (
            <div className="space-y-2 mb-3">
              <button
                onClick={() => setShowNewPlaylist(true)}
                className="w-full flex items-center justify-center space-x-2 p-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="font-quicksand text-sm font-medium">Create Playlist</span>
              </button>
              <button
                onClick={() => {
                  setShowSmartPlaylistCreator(true);
                  setActivePopup(null);
                }}
                className="w-full flex items-center justify-center space-x-2 p-2 bg-accent-purple text-white rounded-lg hover:bg-accent-purple/90 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span className="font-quicksand text-sm font-medium">Create Smart Playlist</span>
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <div className="flex items-center space-x-2 mb-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCreatePlaylist();
                      setActivePopup(null);
                    }
                  }}
                  placeholder="Playlist name..."
                  className="flex-1 bg-forest-light border border-forest-light rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    handleCreatePlaylist();
                    setActivePopup(null);
                  }}
                  className="flex-1 p-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-accent-yellow/90 transition-colors text-sm font-quicksand"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewPlaylist(false);
                    setNewPlaylistName('');
                  }}
                  className="flex-1 p-2 bg-forest-light text-silver rounded-lg hover:bg-forest-light/80 transition-colors text-sm font-quicksand"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          {/* Playlist list */}
          <div className="space-y-2">
            {playlists.map(playlist => {
              const isSelected = selectedPlaylist === playlist.id;
              return (
                <button
                  key={playlist.id}
                  onClick={() => {
                    onPlaylistSelect?.(playlist.id);
                    onCollectionSelect?.(null);
                    setActivePopup(null);
                    // Switch back to library view if in tasks view
                    if (activeView === 'tasks') {
                      onViewChange?.('library');
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-forest-light border border-accent-yellow'
                      : 'hover:bg-forest-light/50'
                  }`}
                >
                  <span className={`font-quicksand text-sm truncate ${
                    isSelected ? 'text-accent-yellow' : 'text-silver'
                  }`}>{playlist.name}</span>
                  <span className={`text-xs ${isSelected ? 'text-accent-yellow' : 'text-silver/60'}`}>
                    {playlist.trackIds.length}
                  </span>
                </button>
              );
            })}
            
            {playlists.length === 0 && (
              <p className="text-xs text-silver/60 text-center py-2">
                No playlists yet
              </p>
            )}
          </div>
        </div>
      </SidebarPopup>
      
      {/* Collections Popup */}
      <SidebarPopup
        isOpen={activePopup === 'collections'}
        onClose={() => setActivePopup(null)}
        title="Albums"
        icon={<Folder className="w-4 h-4 text-accent-yellow" />}
        position={popupPosition}
      >
        <div className="p-4 space-y-2">
          {uniqueCollections.map(({ name, count }) => {
            const isSelected = selectedCollection === name;
            return (
              <button
                key={name}
                onClick={() => {
                  onCollectionSelect?.(name);
                  onPlaylistSelect?.(null);
                  setActivePopup(null);
                  // Switch back to library view if in tasks view
                  if (activeView === 'tasks') {
                    onViewChange?.('library');
                  }
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-forest-light border border-accent-yellow'
                    : 'hover:bg-forest-light/50'
                }`}
              >
                <span className={`font-quicksand text-sm truncate ${
                  isSelected ? 'text-accent-yellow' : 'text-silver'
                }`}>{name}</span>
                <span className={`text-xs ${isSelected ? 'text-accent-yellow' : 'text-silver/60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </SidebarPopup>
      
      {/* Ratings Popup */}
      <SidebarPopup
        isOpen={activePopup === 'ratings'}
        onClose={() => setActivePopup(null)}
        title="Ratings"
        icon={<Heart className="w-4 h-4 text-accent-coral" />}
        position={popupPosition}
      >
        <div className="p-4 space-y-2">
          {ratingCounts.listened > 0 && (
            <button
              onClick={() => {
                onRatingSelect?.(selectedRating === 'listened' ? null : 'listened');
                setActivePopup(null);
                // Switch back to library view if in tasks view
                if (activeView === 'tasks') {
                  onViewChange?.('library');
                }
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                selectedRating === 'listened'
                  ? 'bg-forest-light border border-accent-yellow'
                  : 'hover:bg-forest-light/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Headphones className="w-4 h-4 text-accent-yellow" />
                <span className={`font-quicksand text-sm ${
                  selectedRating === 'listened' ? 'text-accent-yellow' : 'text-silver'
                }`}>Listened</span>
              </div>
              <span className={`text-xs ${selectedRating === 'listened' ? 'text-accent-yellow' : 'text-silver/60'}`}>
                {ratingCounts.listened}
              </span>
            </button>
          )}
          
          {ratingCounts.liked > 0 && (
            <button
              onClick={() => {
                onRatingSelect?.(selectedRating === 'liked' ? null : 'liked');
                setActivePopup(null);
                // Switch back to library view if in tasks view
                if (activeView === 'tasks') {
                  onViewChange?.('library');
                }
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                selectedRating === 'liked'
                  ? 'bg-forest-light border border-accent-yellow'
                  : 'hover:bg-forest-light/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ThumbsUp className="w-4 h-4 text-accent-yellow" />
                <span className={`font-quicksand text-sm ${
                  selectedRating === 'liked' ? 'text-accent-yellow' : 'text-silver'
                }`}>Liked</span>
              </div>
              <span className={`text-xs ${selectedRating === 'liked' ? 'text-accent-yellow' : 'text-silver/60'}`}>
                {ratingCounts.liked}
              </span>
            </button>
          )}
          
          {ratingCounts.loved > 0 && (
            <button
              onClick={() => {
                onRatingSelect?.(selectedRating === 'loved' ? null : 'loved');
                setActivePopup(null);
                // Switch back to library view if in tasks view
                if (activeView === 'tasks') {
                  onViewChange?.('library');
                }
              }}
              className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                selectedRating === 'loved'
                  ? 'bg-forest-light border border-accent-coral'
                  : 'hover:bg-forest-light/50'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-accent-coral" />
                <span className={`font-quicksand text-sm ${
                  selectedRating === 'loved' ? 'text-accent-coral' : 'text-silver'
                }`}>Loved</span>
              </div>
              <span className={`text-xs ${selectedRating === 'loved' ? 'text-accent-coral' : 'text-silver/60'}`}>
                {ratingCounts.loved}
              </span>
            </button>
          )}
        </div>
      </SidebarPopup>
      
      {/* Tags Popup */}
      <SidebarPopup
        isOpen={activePopup === 'tags'}
        onClose={() => setActivePopup(null)}
        title="Tags"
        icon={<Tag className="w-4 h-4 text-accent-yellow" />}
        position={popupPosition}
      >
        <div className="p-4 space-y-2">
          {usedTags.map(({ tag, count }) => {
            const isSelected = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => {
                  onTagToggle(tag);
                  setActivePopup(null);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 ${
                  isSelected
                    ? 'bg-forest-light border border-accent-yellow'
                    : 'hover:bg-forest-light/50'
                }`}
              >
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-silver ${getTagColor(tag)}`}>
                  {tag}
                </span>
                <span className={`text-xs ${isSelected ? 'text-accent-yellow' : 'text-silver/60'}`}>
                  {count}
                </span>
              </button>
            );
          })}
          
          {usedTags.length === 0 && (
            <p className="text-xs text-silver/60 text-center py-2">
              No tags yet
            </p>
          )}
        </div>
      </SidebarPopup>
      
      {/* Shared Playlists Popup */}
      <SidebarPopup
        isOpen={activePopup === 'shared'}
        onClose={() => setActivePopup(null)}
        title="Shared Playlists"
        icon={<Users className="w-4 h-4 text-accent-coral" />}
        position={popupPosition}
      >
        <div className="p-4">
          <p className="text-xs text-silver/60 text-center py-2">
            Coming soon
          </p>
        </div>
      </SidebarPopup>
    </aside>
  );
};

export default Sidebar;