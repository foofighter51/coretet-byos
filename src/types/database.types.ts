// Waveform data structure
export interface WaveformData {
  peaks?: number[];
  duration?: number;
  sample_rate?: number;
  channels?: number;
  length?: number;
  [key: string]: unknown; // Allow for additional waveform properties
}

// Database types that match Supabase schema
export interface Track {
  id: string;
  user_id: string;
  name: string;
  artist?: string;
  album?: string;
  genre?: string;
  key?: string;
  bpm?: number;
  duration?: number;
  url?: string;
  waveform_data?: WaveformData | null;
  created_at: string;
  updated_at: string;
  storage_path?: string;
  primary_track_id?: string | null;
  // Computed fields
  variation_count?: number;
}

export type TrackWithVariations = Track & {
  variations?: Track[];
  primary_track?: Track;
};