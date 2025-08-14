import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, Hash } from 'lucide-react';
import { useLibrary } from '../../contexts/LibraryContext';

interface EnhancedSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClose?: () => void;
}

const EnhancedSearch: React.FC<EnhancedSearchProps> = ({ value, onChange, onClose }) => {
  const { tracks } = useLibrary();
  const [isExpanded, setIsExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('coretet_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Generate suggestions based on current input
  useEffect(() => {
    if (value.length > 0) {
      const searchLower = value.toLowerCase();
      const trackSuggestions = new Set<string>();
      
      tracks.forEach(track => {
        // Search in track name
        if (track.name && track.name.toLowerCase().includes(searchLower)) {
          trackSuggestions.add(track.name);
        }
        // Search in artist
        if (track.artist && track.artist.toLowerCase().includes(searchLower)) {
          trackSuggestions.add(track.artist);
        }
        // Search in notes
        if (track.notes && track.notes.toLowerCase().includes(searchLower)) {
          const noteWords = track.notes.split(' ').filter(word => 
            word.toLowerCase().includes(searchLower)
          );
          noteWords.forEach(word => trackSuggestions.add(word));
        }
      });
      
      setSuggestions(Array.from(trackSuggestions).slice(0, 5));
    } else {
      setSuggestions([]);
    }
  }, [value, tracks]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchTerm: string) => {
    onChange(searchTerm);
    
    // Add to recent searches
    if (searchTerm.trim()) {
      const newRecent = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(newRecent);
      localStorage.setItem('coretet_recent_searches', JSON.stringify(newRecent));
    }
    
    setIsExpanded(false);
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('coretet_recent_searches');
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-xl">
      <div className={`relative transition-all duration-300 ${isExpanded ? 'scale-105' : ''}`}>
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-silver/60" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search tracks, artists, notes, lyrics..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          className="w-full bg-forest-light border border-forest-light rounded-lg pl-10 pr-10 py-2.5 font-quicksand text-sm text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
        />
        {value && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-forest-main rounded transition-colors"
          >
            <X className="w-4 h-4 text-silver/60 hover:text-silver" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isExpanded && (value || recentSearches.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full mt-2 w-full bg-forest-main border border-forest-light rounded-lg shadow-xl z-50 overflow-hidden animate-fade-in">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3">
              <h4 className="font-quicksand text-xs text-silver/60 mb-2">Suggestions</h4>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(suggestion)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-forest-light transition-colors flex items-center space-x-2"
                >
                  <Hash className="w-3 h-3 text-silver/40" />
                  <span className="font-quicksand text-sm text-silver">{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="p-3 border-t border-forest-light">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-quicksand text-xs text-silver/60">Recent Searches</h4>
                <button
                  onClick={clearRecentSearches}
                  className="font-quicksand text-xs text-silver/40 hover:text-silver transition-colors"
                >
                  Clear
                </button>
              </div>
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleSearch(search)}
                  className="w-full text-left px-3 py-2 rounded hover:bg-forest-light transition-colors flex items-center space-x-2"
                >
                  <Clock className="w-3 h-3 text-silver/40" />
                  <span className="font-quicksand text-sm text-silver">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearch;