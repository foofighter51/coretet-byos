import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Shuffle, Repeat, Music, Filter, Headphones, Star, Heart, ArrowUpDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Track } from '../../types/database.types';
import type { Database } from '../../lib/supabase';
import { useLocation } from 'react-router-dom';
import { useAudio } from '../../contexts/AudioContext';
import MobileRatingSection from './MobileRatingSection';
import { RatingType } from '../../hooks/useTrackRating';
import { fetchTrackUrls } from '../../hooks/useSecureTrackUrl';

type FilterType = 'all' | 'listened' | 'liked' | 'loved' | 'primary';
type SortType = 'original' | 'title-asc' | 'title-desc' | 'duration-asc' | 'duration-desc' | 'artist-asc' | 'artist-desc' | 'album-asc' | 'album-desc';

interface TrackWithRating extends Track {
  userRating?: RatingType | null;
  ratings?: {
    listened: number;
    liked: number;
    loved: number;
  };
}

type PlaylistTrack = {
  track_id: string;
  position: number;
  tracks: Track;
};

type PlaylistWithTracks = Database['public']['Tables']['playlists']['Row'] & {
  playlist_tracks?: PlaylistTrack[];
};

const MobileNowPlaying: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const playlistId = location.state?.playlistId;
  const { currentTrack: audioCurrentTrack, isPlaying: audioIsPlaying, play, pause, currentTime, duration, seek } = useAudio();
  
  const [currentTrack, setCurrentTrack] = useState<TrackWithRating | null>(null);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [recentPlaylist, setRecentPlaylist] = useState<PlaylistWithTracks | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<TrackWithRating[]>([]);
  const [filteredTracks, setFilteredTracks] = useState<TrackWithRating[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortType, setSortType] = useState<SortType>('original');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [lastTapTime, setLastTapTime] = useState(0);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);

  // Sync with audio context
  const isPlaying = audioCurrentTrack === currentTrack?.id && audioIsPlaying;

  useEffect(() => {
    // Load specific playlist if provided, otherwise load most recent
    if (playlistId) {
      loadPlaylist(playlistId);
    } else {
      loadRecentPlaylist();
    }
  }, [user, playlistId]);

  useEffect(() => {
    // Apply filters and sorting when tracks, filter, or sort changes
    applyFilterAndSort();
  }, [playlistTracks, activeFilter, sortType]);

  const applyFilterAndSort = () => {
    // First apply filter
    let tracks = [...playlistTracks];
    
    if (activeFilter === 'primary') {
      tracks = tracks.filter(track => !track.primary_track_id);
    } else if (activeFilter !== 'all') {
      tracks = tracks.filter(track => track.userRating === activeFilter);
    }
    
    // Then apply sort
    switch (sortType) {
      case 'title-asc':
        tracks.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'title-desc':
        tracks.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'duration-asc':
        tracks.sort((a, b) => (a.duration || 0) - (b.duration || 0));
        break;
      case 'duration-desc':
        tracks.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'artist-asc':
        tracks.sort((a, b) => (a.artist || 'Unknown').localeCompare(b.artist || 'Unknown'));
        break;
      case 'artist-desc':
        tracks.sort((a, b) => (b.artist || 'Unknown').localeCompare(a.artist || 'Unknown'));
        break;
      case 'album-asc':
        tracks.sort((a, b) => (a.album || '').localeCompare(b.album || ''));
        break;
      case 'album-desc':
        tracks.sort((a, b) => (b.album || '').localeCompare(a.album || ''));
        break;
      case 'original':
      default:
        // Keep original order (already in position order from DB)
        break;
    }
    
    setFilteredTracks(tracks);
  };

  const loadTrackRatings = async (tracks: Track[]): Promise<TrackWithRating[]> => {
    if (!user || tracks.length === 0) return tracks;

    try {
      // Load personal ratings for all tracks
      const trackIds = tracks.map(t => t.id);
      const { data: personalRatings } = await supabase
        .from('personal_track_ratings')
        .select('track_id, rating')
        .eq('user_id', user.id)
        .in('track_id', trackIds);

      const ratingMap = new Map<string, RatingType>();
      personalRatings?.forEach(r => ratingMap.set(r.track_id, r.rating as RatingType));

      // Map tracks with ratings
      const tracksWithRatings: TrackWithRating[] = tracks.map(track => {
        return {
          ...track,
          userRating: ratingMap.get(track.id) || undefined,
          ratings: {
            listened: 0,
            liked: 0,
            loved: 0
          }
        };
      });

      return tracksWithRatings;
    } catch (error) {
      console.error('Error loading track ratings:', error);
      return tracks;
    }
  };

  const processPlaylist = async (playlist: PlaylistWithTracks) => {
    setRecentPlaylist(playlist);
    
    // Extract tracks from playlist
    const tracks = playlist.playlist_tracks
      ?.sort((a: PlaylistTrack, b: PlaylistTrack) => a.position - b.position)
      .map((pt: PlaylistTrack) => pt.tracks)
      .filter(Boolean) || [];
    
    // Generate signed URLs for all tracks using batch edge function
    const trackIds = tracks.map((t: Track) => t.id).filter(Boolean);
    
    const urls = await fetchTrackUrls(trackIds);
    
    const tracksWithUrls = tracks.map((track: Track) => ({
      ...track,
      url: urls[track.id] || ''
    }));
    
    // Tracks with URLs prepared
    
    // Load ratings
    const tracksWithRatings = await loadTrackRatings(tracksWithUrls);
    
    setPlaylistTracks(tracksWithRatings);
    
    // Set the first track as current if available
    if (tracksWithRatings.length > 0) {
      setCurrentTrack(tracksWithRatings[0]);
      setCurrentTrackIndex(0);
    }
  };

  const loadPlaylist = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Load playlist (will work for both owned and shared due to RLS policies)
      const { data: playlist, error } = await supabase
        .from('playlists')
        .select('*, playlist_tracks(track_id, position, tracks(*))')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (playlist) {
        await processPlaylist(playlist);
      }
    } catch (error) {
      // Error loading playlist
      setError('Failed to load playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentPlaylist = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      // Get the most recently accessed owned playlist
      const { data: ownedPlaylist, error: ownedError } = await supabase
        .from('playlists')
        .select('*, playlist_tracks(track_id, position, tracks(*))')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Get the most recently accessed shared playlist
      const { data: userData } = await supabase.auth.getUser();
      const userEmail = userData?.user?.email;
      
      let sharedPlaylist = null;
      if (userEmail) {
        const { data } = await supabase
          .from('playlist_shares')
          .select(`
            invited_at,
            playlists!playlist_id (
              *,
              playlist_tracks(track_id, position, tracks(*))
            )
          `)
          .eq('shared_with_email', userEmail.toLowerCase())
          .eq('status', 'active')
          .order('invited_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        sharedPlaylist = data;
      }

      // Determine which is more recent
      let mostRecentPlaylist = null;
      
      if (ownedPlaylist && sharedPlaylist) {
        const ownedDate = new Date(ownedPlaylist.updated_at);
        const sharedDate = new Date(sharedPlaylist.invited_at);
        mostRecentPlaylist = ownedDate > sharedDate ? ownedPlaylist : sharedPlaylist.playlists;
      } else if (ownedPlaylist) {
        mostRecentPlaylist = ownedPlaylist;
      } else if (sharedPlaylist) {
        mostRecentPlaylist = sharedPlaylist.playlists;
      }

      if (!mostRecentPlaylist) {
        setError('No playlists found. Create one or ask to be added to a shared playlist.');
        return;
      }

      await processPlaylist(mostRecentPlaylist);
    } catch (error) {
      // Error loading recent playlist
      setError('Failed to load playlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Remove old handleRating function - we'll use the hook instead

  const handlePlayPause = async () => {
    // If a track is selected but not playing, play the selected track
    if (selectedTrackId && !isPlaying) {
      const track = filteredTracks.find(t => t.id === selectedTrackId);
      if (track) {
        const actualIndex = playlistTracks.findIndex(t => t.id === track.id);
        setCurrentTrack(track);
        setCurrentTrackIndex(actualIndex);
        
        if (track.url) {
          await play(track.id, track.url);
        } else {
          // Track has no URL
        }
        return;
      }
    }
    
    // Otherwise, play/pause current track
    if (!currentTrack || !currentTrack.url) return;
    
    if (isPlaying) {
      pause();
    } else {
      await play(currentTrack.id, currentTrack.url);
    }
  };

  const handleTrackSelect = (track: TrackWithRating, index: number) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    // Check for double tap (within 300ms)
    if (timeSinceLastTap < 300 && selectedTrackId === track.id) {
      // Double tap - play the track
      
      const actualIndex = playlistTracks.findIndex(t => t.id === track.id);
      setCurrentTrack(track);
      setCurrentTrackIndex(actualIndex);
      
      if (track.url) {
        play(track.id, track.url);
      } else {
        // Track has no URL
      }
    } else {
      // Single tap - just select the track
      setSelectedTrackId(track.id);
    }
    
    setLastTapTime(now);
  };

  const handleNext = () => {
    if (filteredTracks.length === 0) return;
    
    // Find current track in filtered list
    const currentFilteredIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
    let nextFilteredIndex = currentFilteredIndex + 1;
    
    if (nextFilteredIndex >= filteredTracks.length) {
      if (isRepeat) {
        nextFilteredIndex = 0;
      } else {
        return;
      }
    }
    
    if (isShuffle) {
      nextFilteredIndex = Math.floor(Math.random() * filteredTracks.length);
    }
    
    const nextTrack = filteredTracks[nextFilteredIndex];
    const actualIndex = playlistTracks.findIndex(t => t.id === nextTrack.id);
    
    setCurrentTrackIndex(actualIndex);
    setCurrentTrack(nextTrack);
    if (nextTrack.url) {
      play(nextTrack.id, nextTrack.url);
    }
  };

  const handlePrevious = () => {
    if (filteredTracks.length === 0) return;
    
    // Find current track in filtered list
    const currentFilteredIndex = filteredTracks.findIndex(t => t.id === currentTrack?.id);
    let prevFilteredIndex = currentFilteredIndex - 1;
    
    if (prevFilteredIndex < 0) {
      if (isRepeat) {
        prevFilteredIndex = filteredTracks.length - 1;
      } else {
        return;
      }
    }
    
    const prevTrack = filteredTracks[prevFilteredIndex];
    const actualIndex = playlistTracks.findIndex(t => t.id === prevTrack.id);
    
    setCurrentTrackIndex(actualIndex);
    setCurrentTrack(prevTrack);
    if (prevTrack.url) {
      play(prevTrack.id, prevTrack.url);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    
    seek(newTime);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-silver opacity-60">Loading playlist...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <Music className="w-16 h-16 text-silver opacity-20 mb-4" />
        <p className="text-silver opacity-60 text-center">{error}</p>
        <button
          onClick={() => loadRecentPlaylist()}
          className="mt-4 px-4 py-2 bg-accent-yellow text-forest-dark rounded-lg hover:bg-yellow-400 transition-all duration-200 active:scale-95"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      
      {/* Header with Sort and Filter */}
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-silver opacity-60">
            {recentPlaylist?.name || 'Playlist'} • {filteredTracks.length} tracks
            {activeFilter !== 'all' && (activeFilter === 'primary' ? ' (primary only)' : ` (${activeFilter})`)}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowSortMenu(!showSortMenu); setShowFilterMenu(false); }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                sortType !== 'original' ? 'bg-accent-yellow text-forest-dark' : 'bg-forest-main text-silver'
              }`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setShowFilterMenu(!showFilterMenu); setShowSortMenu(false); }}
              className={`p-2 rounded-lg transition-all duration-200 ${
                activeFilter !== 'all' ? 'bg-accent-yellow text-forest-dark' : 'bg-forest-main text-silver'
              }`}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Menu */}
        {showFilterMenu && (
          <div className="bg-forest-main border border-forest-light rounded-lg p-2 mb-3 space-y-1">
            <button
              onClick={() => { setActiveFilter('all'); setShowFilterMenu(false); }}
              className={`w-full text-left px-3 py-2 rounded ${activeFilter === 'all' ? 'bg-forest-light' : ''}`}
            >
              <span className="text-silver">All Tracks</span>
            </button>
            <button
              onClick={() => { setActiveFilter('listened'); setShowFilterMenu(false); }}
              className={`w-full text-left px-3 py-2 rounded ${activeFilter === 'listened' ? 'bg-forest-light' : ''}`}
            >
              <span className="text-silver flex items-center gap-2">
                <Headphones className="w-4 h-4" /> Listened
              </span>
            </button>
            <button
              onClick={() => { setActiveFilter('liked'); setShowFilterMenu(false); }}
              className={`w-full text-left px-3 py-2 rounded ${activeFilter === 'liked' ? 'bg-forest-light' : ''}`}
            >
              <span className="text-silver flex items-center gap-2">
                <Star className="w-4 h-4" /> Liked
              </span>
            </button>
            <button
              onClick={() => { setActiveFilter('loved'); setShowFilterMenu(false); }}
              className={`w-full text-left px-3 py-2 rounded ${activeFilter === 'loved' ? 'bg-forest-light' : ''}`}
            >
              <span className="text-silver flex items-center gap-2">
                <Heart className="w-4 h-4" /> Loved
              </span>
            </button>
            <div className="border-t border-forest-light mt-1 pt-1">
              <button
                onClick={() => { setActiveFilter('primary'); setShowFilterMenu(false); }}
                className={`w-full text-left px-3 py-2 rounded ${activeFilter === 'primary' ? 'bg-forest-light' : ''}`}
              >
                <span className="text-silver">Primary Tracks Only</span>
              </button>
            </div>
          </div>
        )}

        {/* Sort Menu */}
        {showSortMenu && (
          <div className="bg-forest-main border border-forest-light rounded-lg p-3 mb-3 space-y-3">
            <button
              onClick={() => { setSortType('original'); setShowSortMenu(false); }}
              className={`w-full px-3 py-2 rounded-lg border transition-all ${
                sortType === 'original' 
                  ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                  : 'border-forest-light text-silver hover:border-silver/50'
              }`}
            >
              Original Order
            </button>
            
            <div className="space-y-2">
              <div className="text-xs text-silver/60 px-1">Title</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSortType('title-asc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'title-asc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  A → Z
                </button>
                <button
                  onClick={() => { setSortType('title-desc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'title-desc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  Z → A
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-silver/60 px-1">Duration</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSortType('duration-asc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'duration-asc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  Shortest
                </button>
                <button
                  onClick={() => { setSortType('duration-desc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'duration-desc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  Longest
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-silver/60 px-1">Artist</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSortType('artist-asc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'artist-asc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  A → Z
                </button>
                <button
                  onClick={() => { setSortType('artist-desc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'artist-desc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  Z → A
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-silver/60 px-1">Album</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { setSortType('album-asc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'album-asc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  A → Z
                </button>
                <button
                  onClick={() => { setSortType('album-desc'); setShowSortMenu(false); }}
                  className={`px-3 py-2 rounded-lg border transition-all ${
                    sortType === 'album-desc' 
                      ? 'bg-accent-yellow text-forest-dark border-accent-yellow' 
                      : 'border-forest-light text-silver hover:border-silver/50'
                  }`}
                >
                  Z → A
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Track List - Main Content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: currentTrack ? 'calc(12rem + env(safe-area-inset-bottom))' : '0' }}>
        <div className="px-4 pb-4">
          {/* Track List */}
          <div className="space-y-2">
            {filteredTracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track, index)}
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  currentTrack?.id === track.id 
                    ? 'bg-forest-light border border-accent-yellow' 
                    : selectedTrackId === track.id
                    ? 'bg-forest-light border border-silver/30'
                    : 'bg-forest-main hover:bg-forest-light active:scale-[0.98]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-silver opacity-40 text-sm w-6">
                    {playlistTracks.findIndex(t => t.id === track.id) + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-silver truncate">
                        {track.name}
                      </div>
                      {!track.primary_track_id && (
                        <div className="flex-shrink-0 w-5 h-5 bg-accent-yellow rounded-full flex items-center justify-center">
                          <span className="text-forest-dark text-xs font-bold">P</span>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-silver opacity-60 truncate">
                      {track.artist || 'Unknown Artist'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {track.userRating && (
                      <div className="text-silver opacity-60">
                        {track.userRating === 'listened' && <Headphones className="w-4 h-4" />}
                        {track.userRating === 'liked' && <Star className="w-4 h-4 text-green-500" />}
                        {track.userRating === 'loved' && <Heart className="w-4 h-4 text-accent-coral" />}
                      </div>
                    )}
                    <div className="text-xs text-silver opacity-40">
                      {track.duration ? formatDuration(track.duration) : '--:--'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {filteredTracks.length === 0 && activeFilter !== 'all' && (
            <div className="text-center py-8">
              <p className="text-silver opacity-60">No {activeFilter} tracks</p>
              <button
                onClick={() => setActiveFilter('all')}
                className="mt-2 text-accent-yellow text-sm"
              >
                Show all tracks
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Audio Controls at Bottom - Above Navigation */}
      {currentTrack && (
        <div className="fixed left-0 right-0 bg-forest-main border-t border-forest-light z-40" 
             style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}>
          <div className="p-3">
            {/* Currently Playing Info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-silver truncate text-sm">{currentTrack.name}</div>
                  {!currentTrack.primary_track_id && (
                    <div className="flex-shrink-0 w-5 h-5 bg-accent-yellow rounded-full flex items-center justify-center">
                      <span className="text-forest-dark text-xs font-bold">P</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-silver opacity-60 truncate">
                  {currentTrack.artist || 'Unknown Artist'}
                </div>
              </div>
              
              {/* Rating Buttons */}
              <div className="flex-shrink-0">
                <MobileRatingSection trackId={currentTrack.id} playlistId={recentPlaylist?.id} />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-silver opacity-60 mb-1">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration || currentTrack.duration || 0)}</span>
              </div>
              <div 
                className="bg-forest-dark rounded-full h-2 cursor-pointer relative overflow-hidden"
                onClick={handleProgressClick}
              >
                <div 
                  className="bg-accent-yellow h-full rounded-full transition-all duration-300 pointer-events-none" 
                  style={{ 
                    width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
                  }}
                ></div>
              </div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setIsShuffle(!isShuffle)}
                className={`p-1.5 transition-all duration-200 active:scale-95 ${
                  isShuffle ? 'text-accent-yellow' : 'text-silver opacity-60'
                }`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrevious}
                  className="p-1.5 text-silver hover:text-accent-yellow transition-all duration-200 active:scale-95"
                >
                  <SkipBack className="w-5 h-5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="p-2.5 bg-accent-yellow text-forest-dark rounded-full hover:bg-yellow-400 transition-all duration-200 active:scale-95"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5" />
                  ) : (
                    <Play className="w-5 h-5 ml-0.5" />
                  )}
                </button>

                <button
                  onClick={handleNext}
                  className="p-1.5 text-silver hover:text-accent-yellow transition-all duration-200 active:scale-95"
                >
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => setIsRepeat(!isRepeat)}
                className={`p-1.5 transition-all duration-200 active:scale-95 ${
                  isRepeat ? 'text-accent-yellow' : 'text-silver opacity-60'
                }`}
              >
                <Repeat className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNowPlaying;