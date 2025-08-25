export interface Track {
  id: string;
  name: string;
  file: File | null;
  url: string;
  duration: number;
  category: TrackCategory;
  uploadedAt: Date;
  tags: string[];
  // Essential metadata only
  file_name: string;
  file_size: number;
  notes?: string; // Simple notes/description
  // Core interaction fields
  listened?: boolean;
  liked?: boolean;
  // System fields
  deleted_at?: string | null;
  updated_at?: string;
}

export type TrackCategory = 'songs' | 'demos';

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