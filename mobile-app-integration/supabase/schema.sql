-- CoreTet Database Schema for Mobile App Integration
-- This is a comprehensive view of all tables and their relationships

-- =====================================================
-- CORE TABLES
-- =====================================================

-- User Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB default
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  subscription_status TEXT DEFAULT 'free',
  has_completed_tutorial BOOLEAN DEFAULT false,
  preferred_theme TEXT DEFAULT 'dark' CHECK (preferred_theme IN ('light', 'dark')),
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Roles
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Tracks (Audio Files)
CREATE TABLE tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL, -- Path in Supabase Storage
  duration REAL,
  category TEXT NOT NULL CHECK (category IN ('songs', 'final-versions', 'live-performances', 'demos', 'ideas', 'voice-memos')),
  tags TEXT[] DEFAULT '{}',
  
  -- Metadata fields
  artist TEXT,
  collection TEXT, -- Album/Collection name
  tempo TEXT, -- BPM
  key TEXT,
  time_signature TEXT,
  genre TEXT,
  mood TEXT,
  notes TEXT, -- Can contain JSON for extended metadata
  
  -- Ratings (stored directly on track)
  listened BOOLEAN DEFAULT false,
  liked BOOLEAN DEFAULT false,
  loved BOOLEAN DEFAULT false,
  
  -- Collaboration
  collaborators UUID[] DEFAULT '{}',
  shared BOOLEAN DEFAULT false,
  shared_with UUID[] DEFAULT '{}',
  
  -- Versioning
  primary_track_id UUID REFERENCES tracks(id),
  variation_name TEXT,
  
  -- Analysis
  waveform_data REAL[] DEFAULT '{}',
  ai_recommended_tags TEXT[] DEFAULT '{}',
  analysis JSONB,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

-- Playlists
CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  cover_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist Tracks (Junction Table)
CREATE TABLE playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id) NOT NULL,
  UNIQUE(playlist_id, track_id)
);

-- Playlist Shares
CREATE TABLE playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  shared_by UUID REFERENCES auth.users(id) NOT NULL,
  shared_with_email TEXT NOT NULL,
  permissions TEXT DEFAULT 'view' CHECK (permissions IN ('view', 'edit')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, shared_with_email)
);

-- Collection Track Order (for album ordering)
CREATE TABLE collection_track_order (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  collection_name TEXT NOT NULL,
  track_id UUID REFERENCES tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  UNIQUE(user_id, collection_name, track_id)
);

-- User Feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  user_agent TEXT,
  app_version TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in-progress', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_tracks_user_id ON tracks(user_id);
CREATE INDEX idx_tracks_category ON tracks(category);
CREATE INDEX idx_tracks_created_at ON tracks(created_at DESC);
CREATE INDEX idx_tracks_primary_track_id ON tracks(primary_track_id);
CREATE INDEX idx_tracks_deleted_at ON tracks(deleted_at);
CREATE INDEX idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX idx_playlist_tracks_track_id ON playlist_tracks(track_id);
CREATE INDEX idx_playlist_shares_shared_with ON playlist_shares(shared_with_email);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_track_order ENABLE ROW LEVEL SECURITY;

-- Track Policies
CREATE POLICY "Users can CRUD own tracks" ON tracks
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view shared tracks" ON tracks
  FOR SELECT TO authenticated
  USING (
    auth.uid() = ANY(shared_with) OR
    auth.uid() = ANY(collaborators)
  );

-- Playlist Policies
CREATE POLICY "Users can CRUD own playlists" ON playlists
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view shared playlists" ON playlists
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlist_shares
      WHERE playlist_id = playlists.id
      AND shared_with_email = auth.email()
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at BEFORE UPDATE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to get track count for a primary track
CREATE OR REPLACE FUNCTION get_variation_count(track_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM tracks
    WHERE primary_track_id = track_id
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql;