import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown, Save, Trash2, SortAsc } from 'lucide-react';
import { Track, TrackCategory } from '../../types';
import { useLibrary } from '../../contexts/LibraryContext';
import { useViewPreferences, getViewContext } from '../../hooks/useViewPreferences';
import SectionRatingFilter from './SectionRatingFilter';

export interface FilterState {
  bpmRange: { min: number | null; max: number | null };
  key: string | 'all';
  dateRange: { from: Date | null; to: Date | null };
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year' | 'last30' | 'last90' | 'custom';
  tags: string[];
  rating: 'listened' | 'liked' | 'loved' | 'all';
  type: TrackCategory | 'all';
  collection: string | 'all';
  artist: string | 'all';
  primaryOnly: boolean;
  sectionFilteredTracks?: string[];
}

export interface SavedFilter {
  id: string;
  name: string;
  filter: FilterState;
}

interface FilterBarProps {
  onFilterChange: (filter: FilterState) => void;
  currentFilter: FilterState;
  compactMode?: boolean;
  category?: TrackCategory | 'all';
  selectedPlaylist?: string | null;
  selectedCollection?: string | null;
  selectedRating?: 'listened' | 'liked' | 'loved' | null;
  selectedTags?: string[];
  onManualOrderChange?: (enabled: boolean) => void;
}

const initialFilterState: FilterState = {
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
};

const FilterBar: React.FC<FilterBarProps> = ({ 
  onFilterChange, 
  currentFilter, 
  compactMode = false,
  category = 'all',
  selectedPlaylist = null,
  selectedCollection = null,
  selectedRating = null,
  selectedTags = [],
  onManualOrderChange
}) => {
  const { tracks, getAllUsedTags } = useLibrary();
  const [showFilters, setShowFilters] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  // Get view preferences for sorting
  const viewContext = getViewContext(category, selectedPlaylist, selectedCollection, selectedRating, selectedTags);
  const { sortBy, sortDirection, updatePreferences } = useViewPreferences(viewContext);

  // Extract unique values from tracks
  const uniqueKeys = [...new Set(tracks.filter(t => t.key).map(t => t.key!))].sort();
  const uniqueCollections = [...new Set(tracks.filter(t => t.collection).map(t => t.collection!))].sort();
  const uniqueArtists = [...new Set(tracks.filter(t => t.artist).map(t => t.artist!))].sort();
  const allTags = getAllUsedTags().map(t => t.tag).sort();

  // Load saved filters from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('coretet_saved_filters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  }, []);

  // Save filters to localStorage
  const saveFilters = (filters: SavedFilter[]) => {
    setSavedFilters(filters);
    localStorage.setItem('coretet_saved_filters', JSON.stringify(filters));
  };

  // Helper function to calculate date range from filter type
  const getDateRangeFromFilter = (filterType: string): { from: Date | null; to: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterType) {
      case 'today':
        return { from: today, to: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1) };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { from: weekStart, to: new Date(now.getTime()) };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: monthStart, to: new Date(now.getTime()) };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { from: yearStart, to: new Date(now.getTime()) };
      case 'last30':
        const days30Ago = new Date(today);
        days30Ago.setDate(today.getDate() - 30);
        return { from: days30Ago, to: new Date(now.getTime()) };
      case 'last90':
        const days90Ago = new Date(today);
        days90Ago.setDate(today.getDate() - 90);
        return { from: days90Ago, to: new Date(now.getTime()) };
      default:
        return { from: null, to: null };
    }
  };

  // Check if current filter has any active filters
  const hasActiveFilters = () => {
    return (
      currentFilter.bpmRange.min !== null ||
      currentFilter.bpmRange.max !== null ||
      currentFilter.key !== 'all' ||
      currentFilter.dateFilter !== 'all' ||
      currentFilter.dateRange.from !== null ||
      currentFilter.dateRange.to !== null ||
      currentFilter.tags.length > 0 ||
      currentFilter.rating !== 'all' ||
      currentFilter.type !== 'all' ||
      currentFilter.collection !== 'all' ||
      currentFilter.artist !== 'all' ||
      currentFilter.primaryOnly
    );
  };

  const handleFilterChange = (updates: Partial<FilterState>) => {
    onFilterChange({ ...currentFilter, ...updates });
  };

  const handleDateFilterChange = (filterType: string) => {
    if (filterType === 'custom') {
      handleFilterChange({ 
        dateFilter: filterType, 
        dateRange: { from: null, to: null } 
      });
    } else {
      const dateRange = getDateRangeFromFilter(filterType);
      handleFilterChange({ 
        dateFilter: filterType, 
        dateRange 
      });
    }
  };

  const clearFilters = () => {
    onFilterChange(initialFilterState);
  };

  const saveCurrentFilter = () => {
    if (!filterName.trim()) return;
    
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName,
      filter: { ...currentFilter }
    };
    
    saveFilters([...savedFilters, newFilter]);
    setFilterName('');
    setShowSaveDialog(false);
  };

  const loadSavedFilter = (filter: SavedFilter) => {
    onFilterChange(filter.filter);
  };

  const deleteSavedFilter = (id: string) => {
    saveFilters(savedFilters.filter(f => f.id !== id));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target as Node)) {
        setShowSortDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleSort = (column: 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration' | 'manual') => {
    if (column === 'manual') {
      updatePreferences({ sortBy: 'manual', sortDirection: 'asc' });
      onManualOrderChange?.(true);
    } else {
      onManualOrderChange?.(false);
      if (sortBy === column) {
        updatePreferences({ sortDirection: sortDirection === 'asc' ? 'desc' : 'asc' });
      } else {
        const defaultDirection = column === 'added' || column === 'duration' ? 'desc' : 'asc';
        updatePreferences({ sortBy: column, sortDirection: defaultDirection });
      }
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Sort Dropdown */}
      <div className="relative" ref={sortDropdownRef}>
        <button
          onClick={() => {
            setShowSortDropdown(!showSortDropdown);
            setShowFilters(false);
          }}
          className="p-2 hover:bg-forest-light rounded-lg transition-colors"
          title="Sort options"
        >
          <SortAsc className="w-4 h-4 text-silver/60" />
        </button>
        {showSortDropdown && (
          <div className="absolute left-0 mt-2 w-48 bg-forest-main border border-forest-light rounded-lg shadow-xl z-[100]">
            <div className="py-2">
              {selectedPlaylist && (
                <>
                  <button
                    onClick={() => {
                      handleSort('manual');
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 font-quicksand text-sm hover:bg-forest-light transition-colors ${
                      sortBy === 'manual' ? 'text-accent-yellow' : 'text-silver'
                    }`}
                  >
                    Manual Order
                  </button>
                  <div className="border-t border-forest-light my-1" />
                </>
              )}
              <button
                onClick={() => {
                  handleSort('added');
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 font-quicksand text-sm hover:bg-forest-light transition-colors ${
                  sortBy === 'added' ? 'text-accent-yellow' : 'text-silver'
                }`}
              >
                Date Added
              </button>
              <button
                onClick={() => {
                  handleSort('title');
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 font-quicksand text-sm hover:bg-forest-light transition-colors ${
                  sortBy === 'title' ? 'text-accent-yellow' : 'text-silver'
                }`}
              >
                Title
              </button>
              <button
                onClick={() => {
                  handleSort('artist');
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 font-quicksand text-sm hover:bg-forest-light transition-colors ${
                  sortBy === 'artist' ? 'text-accent-yellow' : 'text-silver'
                }`}
              >
                Artist
              </button>
              <button
                onClick={() => {
                  handleSort('duration');
                  setShowSortDropdown(false);
                }}
                className={`w-full text-left px-4 py-2 font-quicksand text-sm hover:bg-forest-light transition-colors ${
                  sortBy === 'duration' ? 'text-accent-yellow' : 'text-silver'
                }`}
              >
                Duration
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Filter Toggle Button */}
      <div className="relative" ref={filterRef}>
        <button
          onClick={() => {
            setShowFilters(!showFilters);
            setShowSortDropdown(false);
          }}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-quicksand text-sm transition-colors ${
            hasActiveFilters()
              ? 'bg-accent-yellow/20 text-accent-yellow border border-accent-yellow'
              : 'bg-forest-light text-silver hover:bg-forest-light/80'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {hasActiveFilters() && (
            <span className="bg-accent-yellow text-forest-dark px-2 py-0.5 rounded-full text-xs font-medium">
              Active
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="absolute top-full mt-2 w-full max-w-4xl min-w-[600px] bg-forest-dark border border-accent-yellow/30 rounded-lg shadow-2xl z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-forest-light">
              <h3 className="font-anton text-xl text-accent-yellow">Advanced Filters</h3>
              <div className="flex items-center space-x-2">
                {hasActiveFilters() && (
                  <button
                    onClick={clearFilters}
                    className="text-silver/60 hover:text-silver text-sm font-quicksand"
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-silver/60 hover:text-silver"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Saved Filters */}
            {savedFilters.length > 0 && (
              <div className="mb-4 pb-4 border-b border-forest-light">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-quicksand text-sm text-silver/60 uppercase tracking-wider">Saved Filters</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedFilters.map(filter => (
                    <div
                      key={filter.id}
                      className="flex items-center space-x-1 bg-forest-light rounded-lg px-3 py-1.5"
                    >
                      <button
                        onClick={() => loadSavedFilter(filter)}
                        className="font-quicksand text-sm text-silver hover:text-accent-yellow transition-colors"
                      >
                        {filter.name}
                      </button>
                      <button
                        onClick={() => deleteSavedFilter(filter.id)}
                        className="text-silver/40 hover:text-accent-coral transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Grid */}
            <div className="space-y-6">
              {/* Row 1: BPM and Key */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* BPM Range */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    BPM Range
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="number"
                      placeholder="Min"
                      min="1"
                      max="999"
                      value={currentFilter.bpmRange.min || ''}
                      onChange={(e) => handleFilterChange({
                        bpmRange: { ...currentFilter.bpmRange, min: e.target.value ? parseInt(e.target.value) : null }
                      })}
                      className="w-20 bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow text-center"
                    />
                    <span className="text-silver/60 flex-shrink-0">—</span>
                    <input
                      type="number"
                      placeholder="Max"
                      min="1"
                      max="999"
                      value={currentFilter.bpmRange.max || ''}
                      onChange={(e) => handleFilterChange({
                        bpmRange: { ...currentFilter.bpmRange, max: e.target.value ? parseInt(e.target.value) : null }
                      })}
                      className="w-20 bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow text-center"
                    />
                  </div>
                </div>

                {/* Key */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Key
                  </label>
                  <select
                    value={currentFilter.key}
                    onChange={(e) => handleFilterChange({ key: e.target.value })}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">All Keys</option>
                    {uniqueKeys.map(key => (
                      <option key={key} value={key}>{key}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Date Filter and Type */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Date Filter */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Date Filter
                  </label>
                  <select
                    value={currentFilter.dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="year">This Year</option>
                    <option value="last30">Last 30 Days</option>
                    <option value="last90">Last 90 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                  
                  {/* Custom Date Range Inputs - Only show when Custom is selected */}
                  {currentFilter.dateFilter === 'custom' && (
                    <div className="mt-3 flex items-center space-x-3">
                      <input
                        type="date"
                        value={currentFilter.dateRange.from ? currentFilter.dateRange.from.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange({
                          dateRange: { ...currentFilter.dateRange, from: e.target.value ? new Date(e.target.value) : null }
                        })}
                        className="flex-1 bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                      />
                      <span className="text-silver/60 flex-shrink-0">—</span>
                      <input
                        type="date"
                        value={currentFilter.dateRange.to ? currentFilter.dateRange.to.toISOString().split('T')[0] : ''}
                        onChange={(e) => handleFilterChange({
                          dateRange: { ...currentFilter.dateRange, to: e.target.value ? new Date(e.target.value) : null }
                        })}
                        className="flex-1 bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                      />
                    </div>
                  )}
                </div>

                {/* Type */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Type
                  </label>
                  <select
                    value={currentFilter.type}
                    onChange={(e) => handleFilterChange({ type: e.target.value as TrackCategory | 'all' })}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">All Types</option>
                    <option value="songs">Songs</option>
                    <option value="final-versions">Final Versions</option>
                    <option value="live-performances">Live Performances</option>
                    <option value="demos">Demos</option>
                    <option value="ideas">Ideas</option>
                    <option value="voice-memos">Voice Memos</option>
                  </select>
                </div>
              </div>

              {/* Row 3: Rating and Collection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Rating */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Rating
                  </label>
                  <select
                    value={currentFilter.rating}
                    onChange={(e) => handleFilterChange({ rating: e.target.value as 'listened' | 'liked' | 'loved' | 'all' })}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">All Ratings</option>
                    <option value="listened">Listened</option>
                    <option value="liked">Liked</option>
                    <option value="loved">Loved</option>
                  </select>
                </div>

                {/* Collection */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Album/Collection
                  </label>
                  <select
                    value={currentFilter.collection}
                    onChange={(e) => handleFilterChange({ collection: e.target.value })}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">All Collections</option>
                    {uniqueCollections.map(collection => (
                      <option key={collection} value={collection}>{collection}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Artist and Tags */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Artist */}
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Artist
                  </label>
                  <select
                    value={currentFilter.artist}
                    onChange={(e) => handleFilterChange({ artist: e.target.value })}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">All Artists</option>
                    {uniqueArtists.map(artist => (
                      <option key={artist} value={artist}>{artist}</option>
                    ))}
                  </select>
                </div>

              {/* Tags */}
              <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                  Tags (Any Match)
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const newTags = currentFilter.tags.includes(tag)
                          ? currentFilter.tags.filter(t => t !== tag)
                          : [...currentFilter.tags, tag];
                        handleFilterChange({ tags: newTags });
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-quicksand font-medium transition-colors ${
                        currentFilter.tags.includes(tag)
                          ? 'bg-accent-yellow text-forest-dark border border-accent-yellow'
                          : 'bg-forest-dark text-silver border border-forest-light/50 hover:border-silver'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

              {/* Row 5: Primary/Variations Filter and Section Ratings */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-forest-main/50 p-4 rounded-lg border border-forest-light/30">
                  <label className="font-quicksand text-xs text-accent-yellow uppercase tracking-wider mb-2 block">
                    Primary/Variations
                  </label>
                  <select
                    value={currentFilter.primaryOnly ? 'primary' : 'all'}
                    onChange={(e) => handleFilterChange({ 
                      primaryOnly: e.target.value === 'primary'
                    })}
                    className="w-full bg-forest-dark border border-forest-light/50 rounded-lg px-3 py-2 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                  >
                    <option value="all">Include Variations</option>
                    <option value="primary">Primary Only</option>
                  </select>
                </div>
                
                {/* Section Rating Filter */}
                <SectionRatingFilter 
                  onFilterApply={(trackIds) => {
                    // Apply section-based filtering
                    handleFilterChange({ 
                      sectionFilteredTracks: trackIds 
                    });
                  }}
                  onReset={() => {
                    handleFilterChange({ 
                      sectionFilteredTracks: undefined 
                    });
                  }}
                />
              </div>
            </div>

            {/* Save Filter */}
            <div className="mt-4 pt-4 border-t border-forest-light">
              {showSaveDialog ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Filter name..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && saveCurrentFilter()}
                    className="flex-1 bg-forest-light border border-forest-light rounded-lg px-3 py-1.5 font-quicksand text-sm text-silver focus:outline-none focus:border-accent-yellow"
                    autoFocus
                  />
                  <button
                    onClick={saveCurrentFilter}
                    disabled={!filterName.trim()}
                    className="px-3 py-1.5 bg-accent-yellow text-forest-dark rounded-lg font-quicksand text-sm font-medium hover:bg-accent-yellow/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setFilterName('');
                    }}
                    className="px-3 py-1.5 bg-forest-light text-silver rounded-lg font-quicksand text-sm font-medium hover:bg-forest-light/80 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowSaveDialog(true)}
                  disabled={!hasActiveFilters()}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-forest-light text-silver rounded-lg font-quicksand text-sm font-medium hover:bg-forest-light/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Current Filter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default FilterBar;