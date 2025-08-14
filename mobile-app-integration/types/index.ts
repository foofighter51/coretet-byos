// Core TypeScript Types for CoreTet Mobile App Integration

export type TrackCategory = 
  | 'songs' 
  | 'final-versions' 
  | 'live-performances' 
  | 'demos' 
  | 'ideas' 
  | 'voice-memos';

export interface Track {
  id: string;
  name: string;
  filePath: string;
  category: TrackCategory;
  tags: string[];
  artist: string;
  collection: string; // Album/Collection name
  listened: boolean;
  liked: boolean;
  loved: boolean;
  duration: number; // in seconds
  waveformData?: number[];
  created_at: string;
  updated_at: string;
  deleted_at?: string; // For soft deletes
  
  // Music metadata
  tempo?: string; // BPM
  key?: string;
  timeSignature?: string;
  genre?: string;
  mood?: string;
  notes?: string; // Can contain JSON for extended metadata
  
  // Collaboration
  collaborators?: string[];
  shared?: boolean;
  sharedWith?: string[];
  
  // File info
  fileSize?: number;
  fileUrl?: string;
  user_id: string;
  
  // Variations
  primary_track_id?: string; // If this is a variation
  variation_name?: string;
  variation_count?: number; // Count of variations for primary tracks
}

export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  subscription_status?: 'free' | 'pro' | 'premium';
  storage_used?: number;
  storage_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  user_id: string;
  is_public: boolean;
  track_ids: string[];
  created_at: string;
  updated_at: string;
  shared_with?: string[]; // User IDs
  cover_image?: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  added_at: string;
  added_by: string;
}

export interface Collection {
  id: string;
  name: string;
  trackCount: number;
  lastUpdated: Date;
  coverArt?: string;
}

export interface Rating {
  track_id: string;
  user_id: string;
  listened: boolean;
  liked: boolean;
  loved: boolean;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
  avatar_url?: string;
  subscription_status?: string;
  storage_used?: number;
  storage_limit?: number;
  has_completed_tutorial?: boolean;
  preferred_theme?: 'light' | 'dark';
  email_notifications?: boolean;
}

export interface ExtendedMetadata {
  // Music Theory
  scale?: string;
  mode?: string;
  energyLevel?: string;
  instruments?: string[];
  arrangement?: string;
  
  // Production
  producer?: string;
  engineer?: string;
  studio?: string;
  recordingDate?: string;
  mixNotes?: string;
  masteringNotes?: string;
  
  // Technical
  sampleRate?: string;
  bitRate?: string;
  fileFormat?: string;
  codec?: string;
  channels?: string;
  
  // Rights & Publishing
  isrc?: string;
  publisher?: string;
  label?: string;
  copyrightYear?: string;
  license?: string;
  
  // External Links
  spotifyUrl?: string;
  appleMusicUrl?: string;
  soundcloudUrl?: string;
  youtubeUrl?: string;
  bandcampUrl?: string;
  websiteUrl?: string;
  
  // Custom Fields
  customFields?: Record<string, string>;
  
  // Lyrics
  lyrics?: string;
}

// Filter State for Advanced Filtering
export interface FilterState {
  bpmRange: { min: number | null; max: number | null };
  key: string | 'all';
  dateFilter: 'all' | 'today' | 'week' | 'month' | 'year' | 'last30' | 'last90' | 'custom';
  dateRange: { from: Date | null; to: Date | null };
  tags: string[];
  rating: 'listened' | 'liked' | 'loved' | 'all';
  type: TrackCategory | 'all';
  collection: string | 'all';
  artist: string | 'all';
  primaryOnly: boolean;
}

// Saved Filter Preset
export interface SavedFilter {
  id: string;
  name: string;
  filter: FilterState;
}

// Sort Options
export type SortBy = 'added' | 'title' | 'type' | 'artist' | 'album' | 'duration' | 'manual';
export type SortDirection = 'asc' | 'desc';

// View Preferences
export interface ViewPreferences {
  sortBy: SortBy;
  sortDirection: SortDirection;
  viewMode: 'list' | 'grid';
  manualPositions?: Record<string, number>;
}

// Audio Context Types
export interface AudioState {
  currentTrack: string | null;
  isPlaying: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isLoading: boolean;
}