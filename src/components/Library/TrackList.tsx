import React, { useState, useEffect, useRef } from 'react';
import { Search, Tag, LayoutGrid, List, Share2, Music, Star, X, Trash2 } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { useAudio } from '../../contexts/AudioContext';
import { useToast } from '../../contexts/ToastContext';
import { useViewPreferences, getViewContext } from '../../hooks/useViewPreferences';
import { sortTracks } from '../../utils/trackSorting';
import TrackCard from './TrackCard';
import TrackListView from './TrackListView';
import TrackListViewVirtualized from './TrackListViewVirtualized';
import BulkEditModal from './BulkEditModal';
import SharePlaylistModal from '../Sharing/SharePlaylistModal';
import { CreateVariationModal } from '../Variations/CreateVariationModal';
import SearchFilterChips from '../Layout/SearchFilterChips';
import FilterBar, { FilterState } from './FilterBar';
import ActiveFilterChips from './ActiveFilterChips';

interface TrackListProps {
  category: TrackCategory | 'all';
  onTrackSelect?: (track: Track) => void;
  selectedTags?: string[];
  selectedCollection?: string | null;
  selectedRating?: 'listened' | 'liked' | 'loved' | null;
  selectedPlaylist?: string | null;
  selectedTrack?: Track | null;
  compactMode?: boolean;
  searchQuery?: string;
  onTagToggle?: (tag: string) => void;
  onCollectionSelect?: (collection: string | null) => void;
  onRatingSelect?: (rating: 'listened' | 'liked' | 'loved' | null) => void;
  onSearchChange?: (query: string) => void;
  onPlaylistSelect?: (playlistId: string | null) => void;
}

const TrackList: React.FC<TrackListProps> = ({ category, onTrackSelect, selectedTags = [], selectedCollection, selectedRating, selectedPlaylist, selectedTrack, compactMode = false, searchQuery = '', onTagToggle, onCollectionSelect, onRatingSelect, onSearchChange, onPlaylistSelect }) => {
  const { tracks, getTracksByCategory, searchTracks, updateTrack, getAllUsedTags, getPlaylistTracks, playlists, removeTrack, removeTrackFromPlaylist, reorderPlaylistTracks, reorderCollectionTracks, getCollectionTrackOrder, refreshTracks, deletePlaylist } = useLibrary();
  const { currentTrack } = useAudio();
  const { showToast } = useToast();
  
  // Get the current view context for preference management
  const viewContext = getViewContext(category, selectedPlaylist, selectedCollection, selectedRating, selectedTags);
  // View context established
  
  const { 
    sortBy, 
    sortDirection, 
    viewMode, 
    manualPositions, 
    updatePreferences, 
    updateManualPosition,
    clearManualPositions 
  } = useViewPreferences(viewContext);
  
  // Local state for filters and UI
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingMetadata, setEditingMetadata] = useState<Track | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ trackId: string; trackName: string } | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDeletePlaylistConfirm, setShowDeletePlaylistConfirm] = useState(false);
  const [collectionTrackOrder, setCollectionTrackOrder] = useState<string[]>([]);
  const [isLoadingOrder, setIsLoadingOrder] = useState(false);
  const [showVariationModal, setShowVariationModal] = useState(false);
  
  // Advanced filter state
  const [advancedFilter, setAdvancedFilter] = useState<FilterState>({
    bpmRange: { min: null, max: null },
    key: 'all',
    dateRange: { from: null, to: null },
    dateFilter: 'all',
    tags: [],
    rating: 'all',
    type: 'all',
    collection: 'all',
    artist: 'all',
    primaryOnly: false,
  });
  
  // Dropdown states for compact mode
  const [hasUnsavedOrder, setHasUnsavedOrder] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<Track[] | null>(null);
  const [isManualOrderMode, setIsManualOrderMode] = useState(sortBy === 'manual');

  // Reset manual order mode when view changes
  useEffect(() => {
    setIsManualOrderMode(sortBy === 'manual');
    setHasUnsavedOrder(false);
    setPendingOrder(null);
  }, [selectedPlaylist, selectedCollection, category]);
  
  // Sync manual order mode with sortBy
  useEffect(() => {
    setIsManualOrderMode(sortBy === 'manual');
  }, [sortBy]);

  // Filter state changes

  // Load collection track order when collection changes
  useEffect(() => {
    if (selectedCollection) {
      setIsLoadingOrder(true);
      getCollectionTrackOrder(selectedCollection).then(order => {
        setCollectionTrackOrder(order);
        setIsLoadingOrder(false);
      });
    } else {
      setCollectionTrackOrder([]);
      setIsLoadingOrder(false);
    }
  }, [selectedCollection, getCollectionTrackOrder]);
  
  const getDisplayTracks = () => {
    let displayTracks: Track[] = [];
    
    // Get initial track set based on context
    if (selectedPlaylist) {
      // Only preserve playlist order when in manual sort mode
      const preserveOrder = sortBy === 'manual';
      displayTracks = getPlaylistTracks(selectedPlaylist, preserveOrder) || [];
      console.log('Playlist tracks before sort:', displayTracks.map(t => ({ name: t.name, duration: t.duration })));
      // Using playlist tracks
    } else if (selectedCollection) {
      displayTracks = (tracks || []).filter(track => track.collection === selectedCollection);
    } else if (category === 'all') {
      displayTracks = tracks || [];
    } else {
      displayTracks = getTracksByCategory(category) || [];
    }
    
    const initialCount = displayTracks.length;
    // Initial track filtering
    
    // Apply search filter first if active
    if (searchQuery.trim()) {
      const searchResults = searchTracks(searchQuery);
      displayTracks = displayTracks.filter(track => 
        searchResults.some(result => result.id === track.id)
      );
      // Applied search filter
    }
    
    // Apply all other filters
    
    // Filter by selected rating from sidebar
    if (selectedRating) {
      const beforeRating = displayTracks.length;
      displayTracks = displayTracks.filter(track => track[selectedRating] === true);
      // Applied rating filter
    }
    
    // Apply advanced filters
    // BPM Range
    if (advancedFilter.bpmRange.min !== null || advancedFilter.bpmRange.max !== null) {
      displayTracks = displayTracks.filter(track => {
        if (!track.tempo) return false;
        const bpm = parseInt(track.tempo);
        if (advancedFilter.bpmRange.min !== null && bpm < advancedFilter.bpmRange.min) return false;
        if (advancedFilter.bpmRange.max !== null && bpm > advancedFilter.bpmRange.max) return false;
        return true;
      });
    }
    
    // Key filter
    if (advancedFilter.key !== 'all') {
      displayTracks = displayTracks.filter(track => track.key === advancedFilter.key);
    }
    
    // Date filter
    if (advancedFilter.dateFilter !== 'all') {
      displayTracks = displayTracks.filter(track => {
        const trackDate = new Date(track.created_at);
        
        // For custom filter, use the dateRange values
        if (advancedFilter.dateFilter === 'custom') {
          if (advancedFilter.dateRange.from && trackDate < advancedFilter.dateRange.from) return false;
          if (advancedFilter.dateRange.to && trackDate > advancedFilter.dateRange.to) return false;
          return true;
        }
        
        // For preset filters, calculate the range
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (advancedFilter.dateFilter) {
          case 'today':
            const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
            return trackDate >= today && trackDate < tomorrow;
          case 'week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            return trackDate >= weekStart && trackDate <= now;
          case 'month':
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            return trackDate >= monthStart && trackDate <= now;
          case 'year':
            const yearStart = new Date(today.getFullYear(), 0, 1);
            return trackDate >= yearStart && trackDate <= now;
          case 'last30':
            const days30Ago = new Date(today);
            days30Ago.setDate(today.getDate() - 30);
            return trackDate >= days30Ago && trackDate <= now;
          case 'last90':
            const days90Ago = new Date(today);
            days90Ago.setDate(today.getDate() - 90);
            return trackDate >= days90Ago && trackDate <= now;
          default:
            return true;
        }
      });
    }
    
    // Tags filter (from advanced filter)
    if (advancedFilter.tags.length > 0) {
      displayTracks = displayTracks.filter(track =>
        advancedFilter.tags.some(tag => track.tags.includes(tag))
      );
    }
    
    // Type filter
    if (advancedFilter.type !== 'all') {
      displayTracks = displayTracks.filter(track => track.category === advancedFilter.type);
    }
    
    // Rating filter from advanced
    if (advancedFilter.rating !== 'all') {
      displayTracks = displayTracks.filter(track => track[advancedFilter.rating] === true);
    }
    
    // Collection filter
    if (advancedFilter.collection !== 'all') {
      displayTracks = displayTracks.filter(track => track.collection === advancedFilter.collection);
    }
    
    // Artist filter
    if (advancedFilter.artist !== 'all') {
      displayTracks = displayTracks.filter(track => track.artist === advancedFilter.artist);
    }
    
    // Primary only filter
    if (advancedFilter.primaryOnly) {
      displayTracks = displayTracks.filter(track => !track.primary_track_id);
    }
    
    
    // Filter by selected tags from sidebar
    if (selectedTags.length > 0) {
      const beforeTags = displayTracks.length;
      displayTracks = displayTracks.filter(track =>
        selectedTags.some(tag => track.tags.includes(tag))
      );
      // Applied tags filter
    }
    
    // Filter by selected tag from dropdown
    if (selectedTag) {
      const beforeSelectedTag = displayTracks.length;
      displayTracks = displayTracks.filter(track => track.tags.includes(selectedTag));
      // Applied selected tag filter
    }

    // Applying sort configuration

    // Apply sorting using the new system
    const sorted = sortTracks(displayTracks, {
      sortBy,
      sortDirection,
      manualPositions,
      collectionOrder: selectedCollection ? collectionTrackOrder : undefined
    });
    
    console.log('Sorting tracks:', {
      inputCount: displayTracks.length,
      outputCount: sorted.length,
      sortBy,
      sortDirection,
      firstTrack: sorted[0]?.name,
      allTracks: sorted.map(t => ({ name: t.name, duration: t.duration }))
    });
    
    return sorted;
  };

  // Use pending order if we have unsaved manual changes, otherwise use sorted tracks
  const sortedTracks = getDisplayTracks() || [];
  const displayTracks = (pendingOrder && hasUnsavedOrder) ? pendingOrder : sortedTracks;
  const usedTags = getAllUsedTags();
  
  // Debug logging to help diagnose the issue
  // Track list render complete
  
  // Display tracks updated
  
  const handleOpenTrackDetails = (track: Track) => {
    // Now just select the track to open the panel
    if (onTrackSelect) {
      onTrackSelect(track);
    }
  };
  
  const handleBulkUpdate = (updates: Record<string, unknown>) => {
    const selectedTrackObjects = tracks.filter(t => selectedTracks.includes(t.id));
    
    selectedTrackObjects.forEach(track => {
      const trackUpdates: Partial<Track> = {};
      
      // Copy basic fields if provided
      if (updates.category) trackUpdates.category = updates.category;
      if (updates.artist) trackUpdates.artist = updates.artist;
      if (updates.collection) trackUpdates.collection = updates.collection;
      if (updates.genre) trackUpdates.genre = updates.genre;
      if (updates.mood) trackUpdates.mood = updates.mood;
      if (updates.key) trackUpdates.key = updates.key;
      if (updates.tempo) trackUpdates.tempo = updates.tempo;
      if (updates.timeSignature) trackUpdates.timeSignature = updates.timeSignature;
      if (updates.notes) trackUpdates.notes = updates.notes;
      
      // Handle tags based on mode
      if (updates.tagsToAdd) {
        // Add tags to existing
        const newTags = [...new Set([...track.tags, ...updates.tagsToAdd])];
        trackUpdates.tags = newTags;
      } else if (updates.tagsToRemove) {
        // Remove specified tags
        trackUpdates.tags = track.tags.filter(tag => !updates.tagsToRemove.includes(tag));
      } else if (updates.tags) {
        // Replace all tags
        trackUpdates.tags = updates.tags;
      }
      
      updateTrack(track.id, trackUpdates);
    });
    
    setShowBulkEdit(false);
    setSelectedTracks([]);
  };
  
  const getCategoryTitle = () => {
    if (selectedPlaylist) {
      const playlist = playlists.find(p => p.id === selectedPlaylist);
      return playlist ? playlist.name : 'Playlist';
    }
    
    if (selectedCollection) {
      return selectedCollection;
    }
    
    switch (category) {
      case 'all': return 'All Tracks';
      case 'songs': return 'Songs';
      case 'final-versions': return 'Final Versions';
      case 'live-performances': return 'Live Performances';
      case 'demos': return 'Recordings';
      case 'ideas': return 'Ideas';
      case 'voice-memos': return 'Voice Memos';
      default: return 'Tracks';
    }
  };
  
  const handleDeleteTrack = async (trackId: string, trackName: string) => {
    if (selectedPlaylist) {
      // If in playlist view, just remove from playlist
      try {
        await removeTrackFromPlaylist(selectedPlaylist, trackId);
      } catch (error) {
        console.error('Error removing from playlist:', error);
      }
    } else {
      // In library view, show confirmation dialog
      setDeleteConfirm({ trackId, trackName });
    }
  };
  
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    try {
      await removeTrack(deleteConfirm.trackId);
      // Always close the dialog after attempting deletion
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting track:', error);
      // Close dialog even on error and show a message
      setDeleteConfirm(null);
      showToast('Failed to delete track. Please try again.', 'error');
    }
  };
  
  const handleReorderTracks = async (reorderedTracks: Track[]) => {
    // In manual order mode, save to both pending order and manual positions
    if ((selectedPlaylist || selectedCollection) && isManualOrderMode) {
      setPendingOrder(reorderedTracks);
      setHasUnsavedOrder(true);
      
      // Also update manual positions in view preferences for persistence
      const newManualPositions: Record<string, number> = {};
      reorderedTracks.forEach((track, index) => {
        newManualPositions[track.id] = index;
      });
      updatePreferences({ manualPositions: newManualPositions });
      return;
    }
    
    // For library view with active sort, update manual positions immediately
    if (sortBy !== 'added') {
      // Calculate new manual positions for dragged tracks
      const newManualPositions: Record<string, number> = {};
      reorderedTracks.forEach((track, index) => {
        // Only set manual position if the track was moved from its sorted position
        const sortedTracks = sortTracks(displayTracks, {
          sortBy,
          sortDirection,
          manualPositions: {},
          collectionOrder: selectedCollection ? collectionTrackOrder : undefined
        });
        const originalIndex = sortedTracks.findIndex(t => t.id === track.id);
        if (originalIndex !== index) {
          newManualPositions[track.id] = index;
        }
      });
      
      // Update manual positions in preferences
      updatePreferences({ manualPositions: newManualPositions });
    }
  };
  
  const handleColumnSort = (column: 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration') => {
    // Clear any pending manual order changes when switching to column sort
    setHasUnsavedOrder(false);
    setPendingOrder(null);
    
    // If clicking the same column, toggle direction
    if (sortBy === column) {
      updatePreferences({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
    } else {
      // New column, set default direction based on column type
      const defaultDirection = column === 'added' || column === 'duration' ? 'desc' : 'asc';
      updatePreferences({ sortBy: column, sortDirection: defaultDirection });
      // Exit manual mode when selecting a different sort
      setIsManualOrderMode(false);
    }
  };

  const saveManualOrder = async () => {
    if (!pendingOrder || !hasUnsavedOrder) return;
    
    try {
      if (selectedPlaylist && reorderPlaylistTracks) {
        await reorderPlaylistTracks(selectedPlaylist, pendingOrder.map(t => t.id));
        setHasUnsavedOrder(false);
        setPendingOrder(null);
        showToast('Playlist order saved!', 'success');
      } else if (selectedCollection && reorderCollectionTracks) {
        const newOrder = pendingOrder.map(t => t.id);
        await reorderCollectionTracks(selectedCollection, newOrder);
        setCollectionTrackOrder(newOrder);
        setHasUnsavedOrder(false);
        setPendingOrder(null);
        showToast('Album order saved!', 'success');
      }
    } catch (error) {
      console.error('Error saving order:', error);
      showToast('Failed to save order. Please try again.', 'error');
    }
  };
  
  const handleBulkDelete = async () => {
    if (selectedTracks.length === 0) return;
    
    if (selectedPlaylist) {
      // Remove from playlist
      for (const trackId of selectedTracks) {
        try {
          await removeTrackFromPlaylist(selectedPlaylist, trackId);
        } catch (error) {
          console.error('Error removing from playlist:', error);
        }
      }
      setSelectedTracks([]);
      setBulkDeleteConfirm(false);
    } else {
      // Show bulk delete confirmation
      setBulkDeleteConfirm(true);
    }
  };
  
  const confirmBulkDelete = async () => {
    for (const trackId of selectedTracks) {
      try {
        await removeTrack(trackId);
      } catch (error) {
        console.error('Error deleting track:', error);
      }
    }
    setSelectedTracks([]);
    setBulkDeleteConfirm(false);
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Select All (Cmd/Ctrl + A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && viewMode === 'list') {
        e.preventDefault();
        if (displayTracks.length > 0) {
          setSelectedTracks(displayTracks.map(t => t.id));
        }
      }
      
      // Escape to clear selection
      if (e.key === 'Escape' && selectedTracks.length > 0) {
        setSelectedTracks([]);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, displayTracks, selectedTracks.length]);
  


  return (
    <div className="flex flex-col h-full relative" data-tutorial="track-list">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-20 bg-forest-main py-4 px-4" data-tutorial="sort-filter">
        {/* Header Controls - Responsive grid layout */}
        <div className="flex flex-col gap-3">
          {/* Top Row: Filter Bar, Bulk Actions, and Playlist Controls */}
          <div className="flex items-center justify-between">
            {/* Left side: Filter Bar */}
            <div className="flex items-center gap-4">
              <FilterBar 
                onFilterChange={setAdvancedFilter}
                currentFilter={advancedFilter}
                compactMode={compactMode}
                category={category}
                selectedPlaylist={selectedPlaylist}
                selectedCollection={selectedCollection}
                selectedRating={selectedRating}
                selectedTags={selectedTags}
                onManualOrderChange={setIsManualOrderMode}
              />
              
              {/* Manual Order Save/Cancel (when in manual order mode) */}
              {(selectedPlaylist || selectedCollection) && isManualOrderMode && hasUnsavedOrder && (
                <div className="flex items-center gap-2 px-3 py-1 bg-forest-light/50 rounded-lg">
                  <button
                    onClick={saveManualOrder}
                    className="px-4 py-1.5 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors"
                  >
                    Save Order
                  </button>
                  <button
                    onClick={() => {
                      setHasUnsavedOrder(false);
                      setPendingOrder(null);
                    }}
                    className="px-4 py-1.5 bg-forest-light text-silver rounded-lg font-quicksand text-sm hover:bg-forest-light/70 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {/* Right side: Bulk Actions or Playlist Controls */}
            {selectedTracks.length > 0 ? (
              // Bulk Actions (when tracks are selected)
              <div className="flex items-center gap-3">
                <span className="font-quicksand text-sm text-accent-yellow mr-2">
                  {selectedTracks.length} selected
                </span>
                <div className="flex items-center gap-2">
                  {selectedTracks.length > 1 && (
                    <>
                      <button
                        onClick={() => setShowBulkEdit(true)}
                        className="px-3 py-1.5 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowVariationModal(true)}
                        className="px-3 py-1.5 bg-accent-yellow/20 text-accent-yellow border border-accent-yellow rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/30 transition-colors"
                      >
                        Variations
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleBulkDelete}
                    className="px-3 py-1.5 bg-accent-coral text-silver rounded-lg font-quicksand text-sm font-medium hover:bg-accent-coral/90 transition-colors"
                  >
                    {selectedPlaylist ? 'Remove' : 'Delete'}
                  </button>
                  <button
                    onClick={() => setSelectedTracks([])}
                    className="px-3 py-1.5 bg-forest-light text-silver rounded-lg font-quicksand text-sm font-medium hover:bg-forest-light/80 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              // Playlist Controls (when no tracks are selected and in playlist view)
              selectedPlaylist && !isManualOrderMode && !hasUnsavedOrder && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-forest-light text-silver rounded-lg font-quicksand text-sm hover:bg-forest-light/80 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Playlist</span>
                  </button>
                  <button
                    onClick={() => setShowDeletePlaylistConfirm(true)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500/10 text-red-400 rounded-lg font-quicksand text-sm hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Playlist</span>
                  </button>
                </div>
              )
            )}
          </div>

          {/* Second Row: View Mode and Player */}
          <div className="flex items-center justify-between">
            {/* Left side: View Mode Switcher */}
            {!compactMode && (
              <div className="flex space-x-1 bg-forest-light rounded-lg p-1" data-tutorial="view-toggle">
                <button
                  onClick={() => {
                    updatePreferences({ viewMode: 'list' });
                    setSelectedTracks([]);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-colors ${
                    viewMode === 'list'
                      ? 'bg-forest-main text-accent-yellow'
                      : 'text-silver/60 hover:text-silver'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span className="font-quicksand text-sm">List</span>
                </button>
                <button
                  onClick={() => {
                    updatePreferences({ viewMode: 'grid' });
                    setSelectedTracks([]);
                  }}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-forest-main text-accent-yellow'
                      : 'text-silver/60 hover:text-silver'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="font-quicksand text-sm">Grid</span>
                </button>
              </div>
            )}
            
            {/* Center: Track count or other info could go here */}
            <div className="flex-1" />
            
            {/* Right side: Spacer for balance */}
            <div className="w-32" />
          </div>
        </div>
      </div>
      
      {/* Active Filter Chips */}
      <ActiveFilterChips
        filter={advancedFilter}
        onRemoveFilter={(key) => {
          const newFilter = { ...advancedFilter };
          switch(key) {
            case 'bpmRange':
              newFilter.bpmRange = { min: null, max: null };
              break;
            case 'dateFilter':
              newFilter.dateFilter = 'all';
              newFilter.dateRange = { from: null, to: null };
              break;
            case 'dateRange':
              newFilter.dateRange = { from: null, to: null };
              break;
            case 'tags':
              newFilter.tags = [];
              break;
            default:
              (newFilter as any)[key] = key === 'primaryOnly' ? false : 'all';
          }
          setAdvancedFilter(newFilter);
        }}
        onClearAll={() => setAdvancedFilter({
          bpmRange: { min: null, max: null },
          key: 'all',
          dateRange: { from: null, to: null },
          dateFilter: 'all',
          tags: [],
          rating: 'all',
          type: 'all',
          collection: 'all',
          artist: 'all',
          primaryOnly: false,
        })}
      />
      
      {/* Search Filter Chips */}
      <SearchFilterChips
        searchQuery={searchQuery}
        onSearchChange={onSearchChange}
        selectedTags={selectedTags}
        onTagToggle={onTagToggle}
        selectedCollection={selectedCollection}
        onCollectionSelect={onCollectionSelect}
        selectedRating={selectedRating}
        onRatingSelect={onRatingSelect}
      />

      {/* Scrollable Track Display */}
      <div className="flex-1 overflow-y-auto">
      {isLoadingOrder ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-silver/60 font-quicksand">Loading tracks...</div>
        </div>
      ) : tracks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-forest-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-silver/60" />
          </div>
          <h3 className="font-quicksand text-lg text-silver mb-2">Loading library...</h3>
          <p className="font-quicksand text-sm text-silver/80">
            If this persists, try refreshing the page
          </p>
        </div>
      ) : displayTracks.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onSelect={onTrackSelect}
                onEditMetadata={handleOpenTrackDetails}
                isSelected={selectedTrack?.id === track.id}
                onDeleteTrack={(id) => {
                  const track = tracks.find(t => t.id === id);
                  if (track) handleDeleteTrack(id, track.name);
                }}
                isInPlaylist={!!selectedPlaylist}
              />
            ))}
          </div>
        ) : (
          // Use virtualized view for large track lists
          displayTracks.length > 100 ? (
            <TrackListViewVirtualized
              tracks={displayTracks}
              onTrackSelect={onTrackSelect}
              onEditMetadata={handleOpenTrackDetails}
              selectedTrack={selectedTrack}
              compactMode={compactMode}
              onRatingUpdate={(trackId, rating, value) => {
                // Create exclusive rating update
                const ratingUpdate: Partial<Track> = {
                  listened: rating === 'listened' ? value : false,
                  liked: rating === 'liked' ? value : false,
                  loved: rating === 'loved' ? value : false,
                };
                updateTrack(trackId, ratingUpdate);
              }}
              currentTrackId={currentTrack}
              selectedTracks={selectedTracks}
              onSelectionChange={setSelectedTracks}
              onDeleteTrack={(id) => {
                const track = tracks.find(t => t.id === id);
                if (track) handleDeleteTrack(id, track.name);
              }}
              isInPlaylist={!!selectedPlaylist}
              playlistId={selectedPlaylist || undefined}
              enableReordering={(!!selectedPlaylist || !!selectedCollection) && isManualOrderMode}
              onReorder={handleReorderTracks}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleColumnSort}
            />
          ) : (
            <TrackListView
              tracks={displayTracks}
              onTrackSelect={onTrackSelect}
              onEditMetadata={handleOpenTrackDetails}
              selectedTrack={selectedTrack}
              compactMode={compactMode}
              onRatingUpdate={(trackId, rating, value) => {
                // Create exclusive rating update
                const ratingUpdate: Partial<Track> = {
                  listened: rating === 'listened' ? value : false,
                  liked: rating === 'liked' ? value : false,
                  loved: rating === 'loved' ? value : false,
                };
                updateTrack(trackId, ratingUpdate);
              }}
              currentTrackId={currentTrack}
              selectedTracks={selectedTracks}
              onSelectionChange={setSelectedTracks}
              onDeleteTrack={(id) => {
                const track = tracks.find(t => t.id === id);
                if (track) handleDeleteTrack(id, track.name);
              }}
              isInPlaylist={!!selectedPlaylist}
              playlistId={selectedPlaylist || undefined}
              enableReordering={(!!selectedPlaylist || !!selectedCollection) && isManualOrderMode}
              onReorder={handleReorderTracks}
              sortBy={sortBy}
              sortDirection={sortDirection}
              onSort={handleColumnSort}
            />
          )
        )
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-forest-light rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-silver/60" />
          </div>
          <h3 className="font-quicksand text-lg text-silver mb-2">
            {searchQuery ? 'No tracks found' : 'No tracks yet'}
          </h3>
          <p className="font-quicksand text-sm text-silver/80">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Upload some audio files to get started'
            }
          </p>
        </div>
      )}

      
      {/* Bulk Edit Modal */}
      {showBulkEdit && selectedTracks.length > 0 && (
        <BulkEditModal
          tracks={tracks.filter(t => selectedTracks.includes(t.id))}
          onSave={handleBulkUpdate}
          onClose={() => setShowBulkEdit(false)}
        />
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-forest-main rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
            <h3 className="font-anton text-xl text-silver mb-4">Delete Track</h3>
            <p className="font-quicksand text-silver/80 mb-6">
              Are you sure you want to delete <span className="text-accent-yellow font-medium">"{deleteConfirm.trackName}"</span>?
              <br />
              <span className="text-silver/60 text-sm mt-2">Deleted tracks can be recovered for 30 days. To recover, go to Account → Deleted Tracks.</span>
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-accent-coral text-silver rounded-lg font-quicksand font-medium hover:bg-accent-coral/90 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Share Playlist Modal */}
      {showShareModal && selectedPlaylist && (() => {
        const playlist = playlists.find(p => p.id === selectedPlaylist);
        if (!playlist) return null;
        return (
          <SharePlaylistModal
            playlistId={selectedPlaylist}
            playlistName={playlist.name}
            onClose={() => setShowShareModal(false)}
          />
        );
      })()}

      {/* Delete Playlist Confirmation */}
      {showDeletePlaylistConfirm && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-forest-medium border border-forest-light rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-orbitron text-white mb-4">Delete Playlist</h3>
            <p className="text-silver mb-6">
              Are you sure you want to delete "{playlists.find(p => p.id === selectedPlaylist)?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeletePlaylistConfirm(false)}
                className="px-4 py-2 bg-forest-light text-silver rounded-lg hover:bg-forest-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await deletePlaylist(selectedPlaylist);
                    showToast('Playlist deleted successfully', 'success');
                    setShowDeletePlaylistConfirm(false);
                    // Clear the selected playlist to return to All Tracks view
                    if (onPlaylistSelect) {
                      onPlaylistSelect(null);
                    }
                  } catch (error) {
                    console.error('Error deleting playlist:', error);
                    showToast('Failed to delete playlist', 'error');
                  }
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-forest-main rounded-xl p-6 max-w-md w-full mx-4 animate-slide-up">
            <h3 className="font-anton text-xl text-silver mb-4">Delete {selectedTracks.length} Tracks</h3>
            <p className="font-quicksand text-silver/80 mb-6">
              Are you sure you want to delete {selectedTracks.length} selected tracks?
              <br />
              <span className="text-silver/60 text-sm mt-2">Deleted tracks can be recovered for 30 days. To recover, go to Account → Deleted Tracks.</span>
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setBulkDeleteConfirm(false)}
                className="px-4 py-2 bg-forest-light text-silver rounded-lg font-quicksand font-medium hover:bg-forest-light/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkDelete}
                className="px-4 py-2 bg-accent-coral text-silver rounded-lg font-quicksand font-medium hover:bg-accent-coral/90 transition-colors"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
      
      </div>
      
      {/* Create Variation Modal */}
      {showVariationModal && selectedTracks.length > 1 && (
        <CreateVariationModal
          tracks={displayTracks.filter(t => selectedTracks.includes(t.id))}
          onClose={() => setShowVariationModal(false)}
          onSuccess={() => {
            setSelectedTracks([]);
            refreshTracks();
          }}
        />
      )}
    </div>
  );
};

export default TrackList;