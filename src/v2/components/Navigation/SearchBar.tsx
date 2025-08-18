import React, { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Search works, artists, tags..." }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-forest-light/50 text-silver placeholder-silver/50 border border-forest-light/30 rounded-lg px-4 py-2 pl-10 pr-12 focus:outline-none focus:border-accent-yellow/50 focus:bg-forest-light/70 transition-colors font-quicksand text-sm"
          />
          
          {/* Search Icon */}
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-silver/40" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>

          {/* Filter Toggle */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded transition-colors ${
              showFilters ? 'text-accent-yellow' : 'text-silver/40 hover:text-silver/60'
            }`}
            title="Advanced Filters"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </button>
        </div>
      </form>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-forest-main border border-forest-light/30 rounded-lg shadow-xl z-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* BPM Range */}
            <div>
              <label className="block text-silver/70 text-xs font-quicksand mb-1">BPM Range</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="Min"
                  className="w-full bg-forest-light/50 text-silver placeholder-silver/50 border border-forest-light/30 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent-yellow/50"
                />
                <input
                  type="number"
                  placeholder="Max"
                  className="w-full bg-forest-light/50 text-silver placeholder-silver/50 border border-forest-light/30 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent-yellow/50"
                />
              </div>
            </div>

            {/* Key */}
            <div>
              <label className="block text-silver/70 text-xs font-quicksand mb-1">Key</label>
              <select className="w-full bg-forest-light/50 text-silver border border-forest-light/30 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent-yellow/50">
                <option value="">Any Key</option>
                <option value="C">C</option>
                <option value="C#">C#</option>
                <option value="D">D</option>
                <option value="D#">D#</option>
                <option value="E">E</option>
                <option value="F">F</option>
                <option value="F#">F#</option>
                <option value="G">G</option>
                <option value="G#">G#</option>
                <option value="A">A</option>
                <option value="A#">A#</option>
                <option value="B">B</option>
              </select>
            </div>

            {/* Content Type */}
            <div>
              <label className="block text-silver/70 text-xs font-quicksand mb-1">Type</label>
              <select className="w-full bg-forest-light/50 text-silver border border-forest-light/30 rounded px-2 py-1 text-xs focus:outline-none focus:border-accent-yellow/50">
                <option value="">All Types</option>
                <option value="work">Works</option>
                <option value="version">Versions</option>
                <option value="iteration">Iterations</option>
              </select>
            </div>

            {/* Rating */}
            <div>
              <label className="block text-silver/70 text-xs font-quicksand mb-1">Min Rating</label>
              <div className="flex space-x-2">
                <button className="p-1 text-silver/40 hover:text-accent-yellow transition-colors" title="Listen">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  </svg>
                </button>
                <button className="p-1 text-silver/40 hover:text-accent-yellow transition-colors" title="Like">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                  </svg>
                </button>
                <button className="p-1 text-silver/40 hover:text-accent-yellow transition-colors" title="Love">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Apply/Clear Buttons */}
          <div className="flex justify-end space-x-2 mt-4 pt-3 border-t border-forest-light/30">
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="px-3 py-1 text-xs text-silver/60 hover:text-silver transition-colors font-quicksand"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="px-3 py-1 bg-accent-yellow text-forest-dark rounded text-xs font-quicksand font-semibold hover:bg-accent-yellow/90 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}