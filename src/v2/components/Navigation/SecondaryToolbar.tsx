import React, { useState } from 'react';

export function SecondaryToolbar() {
  const [viewMode, setViewMode] = useState<'works' | 'tracks'>('works');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [showSort, setShowSort] = useState(false);

  const sortOptions = [
    { value: 'dateAdded', label: 'Date Added' },
    { value: 'title', label: 'Title' },
    { value: 'artist', label: 'Artist' },
    { value: 'duration', label: 'Duration' },
    { value: 'rating', label: 'Rating' },
  ];

  return (
    <div className="bg-forest-main/50 border-b border-forest-light/30">
      <div className="max-w-7xl mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Left Side - View Toggle */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-forest-light/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('works')}
                className={`px-3 py-1 rounded-md text-xs font-quicksand transition-colors ${
                  viewMode === 'works'
                    ? 'bg-accent-yellow text-forest-dark'
                    : 'text-silver/60 hover:text-silver'
                }`}
              >
                Works View
              </button>
              <button
                onClick={() => setViewMode('tracks')}
                className={`px-3 py-1 rounded-md text-xs font-quicksand transition-colors ${
                  viewMode === 'tracks'
                    ? 'bg-accent-yellow text-forest-dark'
                    : 'text-silver/60 hover:text-silver'
                }`}
              >
                Tracks View
              </button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 px-2 py-1 bg-forest-light/30 hover:bg-forest-light/50 rounded text-xs text-silver/60 hover:text-silver transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
                <span>Listen</span>
              </button>
              <button className="flex items-center space-x-1 px-2 py-1 bg-forest-light/30 hover:bg-forest-light/50 rounded text-xs text-silver/60 hover:text-silver transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
                <span>Like</span>
              </button>
              <button className="flex items-center space-x-1 px-2 py-1 bg-forest-light/30 hover:bg-forest-light/50 rounded text-xs text-silver/60 hover:text-silver transition-colors">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>Love</span>
              </button>
            </div>
          </div>

          {/* Right Side - Sort and Options */}
          <div className="flex items-center space-x-3">
            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center space-x-2 px-3 py-1 bg-forest-light/30 hover:bg-forest-light/50 rounded text-xs text-silver/60 hover:text-silver transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                </svg>
                <span>Sort: {sortOptions.find(opt => opt.value === sortBy)?.label}</span>
                <svg className={`w-3 h-3 transition-transform ${showSort ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSort && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-forest-main border border-forest-light/30 rounded-lg shadow-xl z-50 py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSortBy(option.value);
                        setShowSort(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-quicksand transition-colors ${
                        sortBy === option.value
                          ? 'text-accent-yellow bg-forest-light/30'
                          : 'text-silver/60 hover:text-silver hover:bg-forest-light/20'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View Options */}
            <button className="flex items-center space-x-1 px-2 py-1 bg-forest-light/30 hover:bg-forest-light/50 rounded text-xs text-silver/60 hover:text-silver transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>Grid</span>
            </button>

            <button className="flex items-center space-x-1 px-2 py-1 bg-forest-light/30 hover:bg-forest-light/50 rounded text-xs text-silver/60 hover:text-silver transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span>List</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}