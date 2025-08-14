export interface Track {
  id: string;
  name: string;
  file: File | null;
  url: string;
  duration: number;
  category: TrackCategory;
  uploadedAt: Date;
  tags: string[];
  // User-entered metadata
  artist?: string;
  collection?: string;
  key?: string;
  tempo?: number; // BPM for arrangements
  timeSignature?: string;
  mood?: string;
  genre?: string;
  notes?: string;
  tuning?: string; // Instrument tuning (e.g., Drop D, DADGAD)
  lyrics?: string; // Song lyrics
  // Rating fields
  listened?: boolean;
  liked?: boolean;
  loved?: boolean;
  // Variations
  primary_track_id?: string | null;
  variation_count?: number;
  // Soft delete
  deleted_at?: string | null;
  // Timestamps
  updated_at?: string;
  // BYOS fields
  storage_provider?: 'google_drive' | 'dropbox' | 'onedrive' | 'supabase';
  provider_file_id?: string;
  provider_url?: string;
}

export type TrackCategory = 'songs' | 'demos' | 'ideas' | 'voice-memos' | 'final-versions' | 'live-performances';

// Arrangements types
export interface AudioSection {
  id: string;
  track_id: string;
  name: string;
  start_time: number;
  end_time: number;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Arrangement {
  id: string;
  track_id: string;
  name: string;
  created_by: string;
  is_original: boolean;
  created_at: string;
  updated_at: string;
  arrangement_sections?: ArrangementSection[];
}

export interface ArrangementSection {
  id: string;
  arrangement_id: string;
  section_id: string;
  position: number;
  created_at: string;
  section?: AudioSection;
}

export interface Collection {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: Date;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // Owner ID
  isShared?: boolean; // True if this is a shared playlist for the current user
  shareInfo?: {
    ownerId: string;
    ownerEmail?: string;
    canEdit: boolean;
    canRate: boolean;
    sharedAt: Date;
  };
}

export interface TrackComment {
  id: string;
  trackId: string;
  playlistId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  storage_used: number;
  storage_limit: number;
  is_active: boolean;
  invited_by: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  track_id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  completed_at?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  user_order?: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

// Re-export custom rating types
export * from './customRatings';

// Re-export storage types
export * from './storage';