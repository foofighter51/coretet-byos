import React, { useState } from 'react';
import { X, Plus, Sparkles, Music, Heart, ThumbsUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../contexts/ToastContext';
import { GENRE_OPTIONS, KEY_OPTIONS } from '../../constants/musicData';

interface SmartPlaylistCriteria {
  ratings?: {
    vibe?: { min: number };
    lyrics?: { min: number };
    melody?: { min: number };
    progression?: { min: number };
    rhythm?: { min: number };
    energy?: { min: number };
  };
  track_fields?: {
    genre?: string[];
    key?: string[];
    tempo?: { min?: number; max?: number };
  };
  general?: {
    listened?: boolean;
    liked?: boolean;
    loved?: boolean;
  };
}

interface SmartPlaylistCreatorProps {
  onClose: () => void;
  onCreated: () => void;
}

const RATING_CATEGORIES = [
  { id: 'vibe', name: 'Vibe', icon: '🎵' },
  { id: 'lyrics', name: 'Lyrics', icon: '📝' },
  { id: 'melody', name: 'Melody', icon: '🎼' },
  { id: 'progression', name: 'Progression', icon: '🎹' },
  { id: 'rhythm', name: 'Rhythm', icon: '🥁' },
  { id: 'energy', name: 'Energy', icon: '⚡' },
];

export const SmartPlaylistCreator: React.FC<SmartPlaylistCreatorProps> = ({ onClose, onCreated }) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [maxTracks, setMaxTracks] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [creating, setCreating] = useState(false);
  
  // Criteria state
  const [selectedRatings, setSelectedRatings] = useState<Record<string, number>>({});
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [tempoMin, setTempoMin] = useState<number | undefined>(undefined);
  const [tempoMax, setTempoMax] = useState<number | undefined>(undefined);
  const [generalCriteria, setGeneralCriteria] = useState({
    listened: false,
    liked: false,
    loved: false,
  });

  const handleRatingToggle = (category: string, value: number) => {
    setSelectedRatings(prev => {
      const current = prev[category];
      if (current === value) {
        const { [category]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [category]: value };
    });
  };

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleKeyToggle = (key: string) => {
    setSelectedKeys(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  const buildCriteria = (): SmartPlaylistCriteria => {
    const criteria: SmartPlaylistCriteria = {};
    
    // Add rating criteria
    if (Object.keys(selectedRatings).length > 0) {
      criteria.ratings = {};
      Object.entries(selectedRatings).forEach(([category, min]) => {
        criteria.ratings![category as keyof typeof criteria.ratings] = { min };
      });
    }
    
    // Add track field criteria
    if (selectedGenres.length > 0 || selectedKeys.length > 0 || tempoMin || tempoMax) {
      criteria.track_fields = {};
      if (selectedGenres.length > 0) criteria.track_fields.genre = selectedGenres;
      if (selectedKeys.length > 0) criteria.track_fields.key = selectedKeys;
      if (tempoMin || tempoMax) {
        criteria.track_fields.tempo = {};
        if (tempoMin) criteria.track_fields.tempo.min = tempoMin;
        if (tempoMax) criteria.track_fields.tempo.max = tempoMax;
      }
    }
    
    // Add general criteria
    if (generalCriteria.listened || generalCriteria.liked || generalCriteria.loved) {
      criteria.general = { ...generalCriteria };
    }
    
    return criteria;
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast('Please enter a playlist name', 'error');
      return;
    }
    
    const criteria = buildCriteria();
    if (Object.keys(criteria).length === 0) {
      showToast('Please select at least one criterion', 'error');
      return;
    }
    
    setCreating(true);
    try {
      const { error } = await supabase
        .from('smart_playlists')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          criteria,
          max_tracks: maxTracks || null,
          sort_by: sortBy,
          sort_order: sortOrder,
        });
      
      if (error) throw error;
      
      showToast('Smart playlist created successfully!', 'success');
      onCreated();
      onClose();
    } catch (error) {
      console.error('Error creating smart playlist:', error);
      showToast('Failed to create smart playlist', 'error');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-forest-main border-2 border-accent-yellow rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-anton text-2xl text-accent-yellow flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Create Smart Playlist
          </h2>
          <button
            onClick={onClose}
            className="text-silver hover:text-accent-coral transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Basic Info */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-quicksand text-silver mb-1">
              Playlist Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., High Energy Favorites"
              className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
            />
          </div>
          
          <div>
            <label className="block text-sm font-quicksand text-silver mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this playlist is for..."
              rows={2}
              className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow resize-none"
            />
          </div>
        </div>

        {/* Criteria Section */}
        <div className="space-y-6 mb-6">
          {/* Rating Criteria */}
          <div>
            <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">
              Rating Criteria
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {RATING_CATEGORIES.map(category => (
                <div key={category.id} className="bg-forest-light rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-quicksand text-sm text-silver flex items-center gap-1">
                      <span>{category.icon}</span>
                      {category.name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRatingToggle(category.id, 1)}
                      className={`flex-1 p-1.5 rounded transition-colors ${
                        selectedRatings[category.id] === 1
                          ? 'bg-accent-yellow text-forest-dark'
                          : 'bg-forest-main text-silver hover:bg-forest-main/80'
                      }`}
                      title="Must be liked"
                    >
                      <ThumbsUp className="w-4 h-4 mx-auto" />
                    </button>
                    <button
                      onClick={() => handleRatingToggle(category.id, 2)}
                      className={`flex-1 p-1.5 rounded transition-colors ${
                        selectedRatings[category.id] === 2
                          ? 'bg-accent-coral text-white'
                          : 'bg-forest-main text-silver hover:bg-forest-main/80'
                      }`}
                      title="Must be loved"
                    >
                      <Heart className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* General Criteria */}
          <div>
            <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">
              General Criteria
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setGeneralCriteria(prev => ({ ...prev, listened: !prev.listened }))}
                className={`px-3 py-1.5 rounded-full text-sm font-quicksand transition-colors ${
                  generalCriteria.listened
                    ? 'bg-accent-yellow text-forest-dark'
                    : 'bg-forest-light text-silver hover:bg-forest-light/80'
                }`}
              >
                Must be Listened
              </button>
              <button
                onClick={() => setGeneralCriteria(prev => ({ ...prev, liked: !prev.liked }))}
                className={`px-3 py-1.5 rounded-full text-sm font-quicksand transition-colors ${
                  generalCriteria.liked
                    ? 'bg-accent-yellow text-forest-dark'
                    : 'bg-forest-light text-silver hover:bg-forest-light/80'
                }`}
              >
                Must be Liked
              </button>
              <button
                onClick={() => setGeneralCriteria(prev => ({ ...prev, loved: !prev.loved }))}
                className={`px-3 py-1.5 rounded-full text-sm font-quicksand transition-colors ${
                  generalCriteria.loved
                    ? 'bg-accent-coral text-white'
                    : 'bg-forest-light text-silver hover:bg-forest-light/80'
                }`}
              >
                Must be Loved
              </button>
            </div>
          </div>

          {/* Genre Filter */}
          <div>
            <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">
              Genre Filter
            </h3>
            <div className="flex flex-wrap gap-2">
              {GENRE_OPTIONS.map(genre => (
                <button
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`px-3 py-1.5 rounded-full text-sm font-quicksand transition-colors ${
                    selectedGenres.includes(genre)
                      ? 'bg-accent-purple text-white'
                      : 'bg-forest-light text-silver hover:bg-forest-light/80'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* Tempo Range */}
          <div>
            <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider mb-3">
              Tempo Range (BPM)
            </h3>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                value={tempoMin || ''}
                onChange={(e) => setTempoMin(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Min"
                min="40"
                max="200"
                className="w-24 bg-forest-light border border-forest-light rounded px-3 py-2 text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              />
              <span className="text-silver">to</span>
              <input
                type="number"
                value={tempoMax || ''}
                onChange={(e) => setTempoMax(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Max"
                min="40"
                max="200"
                className="w-24 bg-forest-light border border-forest-light rounded px-3 py-2 text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              />
            </div>
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-4 mb-6 p-4 bg-forest-light/30 rounded-lg">
          <h3 className="font-anton text-sm text-accent-yellow uppercase tracking-wider">
            Advanced Options
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-quicksand text-silver mb-1">
                Max Tracks
              </label>
              <input
                type="number"
                value={maxTracks || ''}
                onChange={(e) => setMaxTracks(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="No limit"
                min="1"
                max="500"
                className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver placeholder-silver/40 focus:outline-none focus:border-accent-yellow"
              />
            </div>
            
            <div>
              <label className="block text-sm font-quicksand text-silver mb-1">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver focus:outline-none focus:border-accent-yellow"
              >
                <option value="created_at">Date Added</option>
                <option value="name">Track Name</option>
                <option value="artist">Artist</option>
                <option value="genre">Genre</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-quicksand text-silver mb-1">
                Sort Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-full bg-forest-light border border-forest-light rounded px-3 py-2 text-silver focus:outline-none focus:border-accent-yellow"
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 font-quicksand text-silver hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="px-4 py-2 bg-accent-yellow text-forest-dark rounded font-quicksand font-bold hover:bg-accent-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {creating ? (
              <>Creating...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Smart Playlist
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};