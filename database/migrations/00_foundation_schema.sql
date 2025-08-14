-- CoreTet BYOS Foundation Schema
-- Complete base schema + BYOS support for new Supabase project

-- =================================================================
-- PART 1: Core CoreTet Schema (from bright_delta.sql)
-- =================================================================

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 10737418240, -- 10GB in bytes for BYOS
  is_active BOOLEAN DEFAULT true,
  invited_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User roles table
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin'))
);

-- Invites table
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  email TEXT,
  used_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tracks table (with BYOS fields included)
CREATE TABLE IF NOT EXISTS tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  s3_key TEXT, -- Made nullable for BYOS
  duration REAL,
  category TEXT NOT NULL CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions', 'live-performances')),
  tags TEXT[] DEFAULT '{}',
  ai_recommended_tags TEXT[] DEFAULT '{}',
  analysis JSONB,
  -- BYOS fields
  storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('google_drive', 'dropbox', 'onedrive', 'supabase')),
  provider_file_id TEXT,
  provider_url TEXT,
  -- Additional fields from evolution
  artist TEXT,
  collection TEXT,
  key TEXT,
  tempo INTEGER,
  time_signature TEXT,
  mood TEXT,
  genre TEXT,
  notes TEXT,
  tuning TEXT,
  lyrics TEXT,
  listened BOOLEAN DEFAULT false,
  liked BOOLEAN DEFAULT false,
  loved BOOLEAN DEFAULT false,
  primary_track_id UUID REFERENCES tracks(id),
  variation_count INTEGER DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  track_ids UUID[] DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- View preferences table
CREATE TABLE IF NOT EXISTS view_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  view_context TEXT NOT NULL, -- 'library', 'playlist', etc.
  sort_by TEXT NOT NULL DEFAULT 'created_at',
  sort_direction TEXT NOT NULL DEFAULT 'desc' CHECK (sort_direction IN ('asc', 'desc')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, view_context)
);

-- =================================================================
-- PART 2: BYOS Storage Provider Tables
-- =================================================================

-- Storage provider connections table
CREATE TABLE IF NOT EXISTS user_storage_providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'dropbox', 'onedrive', 'supabase')),
  encrypted_access_token TEXT,
  encrypted_refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  provider_email TEXT,
  storage_quota BIGINT,
  storage_used BIGINT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Storage events for debugging
CREATE TABLE IF NOT EXISTS storage_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'upload', 'download', 'connection', 'error'
  provider TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =================================================================
-- PART 3: Indexes
-- =================================================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_category ON tracks(category);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);

-- BYOS indexes
CREATE INDEX IF NOT EXISTS idx_user_storage_providers_user_id ON user_storage_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_storage_providers_provider ON user_storage_providers(provider);
CREATE INDEX IF NOT EXISTS idx_user_storage_providers_active ON user_storage_providers(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_tracks_storage_provider ON tracks(storage_provider);
CREATE INDEX IF NOT EXISTS idx_tracks_provider_file_id ON tracks(provider_file_id) WHERE provider_file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_storage_events_user_id ON storage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_events_type ON storage_events(event_type);

-- =================================================================
-- PART 4: Row Level Security
-- =================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_events ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Tracks policies
CREATE POLICY "Users can read own tracks" ON tracks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tracks" ON tracks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tracks" ON tracks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tracks" ON tracks FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Users can read own playlists" ON playlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own playlists" ON playlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own playlists" ON playlists FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own playlists" ON playlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- View preferences policies
CREATE POLICY "Users can manage own view preferences" ON view_preferences FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Storage provider policies
CREATE POLICY "Users can view own storage providers" ON user_storage_providers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own storage providers" ON user_storage_providers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own storage providers" ON user_storage_providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own storage providers" ON user_storage_providers FOR DELETE USING (auth.uid() = user_id);

-- Storage events policies
CREATE POLICY "Users can view own storage events" ON storage_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own storage events" ON storage_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invites policies
CREATE POLICY "Anyone can read valid invites" ON invites FOR SELECT TO anon, authenticated USING (expires_at > NOW() AND used_by IS NULL);
CREATE POLICY "Admins can manage invites" ON invites FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- User roles policies
CREATE POLICY "Users can read own role" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON user_roles FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- =================================================================
-- PART 5: Functions and Triggers
-- =================================================================

-- Updated user creation handler
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (id, email, storage_limit)
  VALUES (NEW.id, NEW.email, 10737418240); -- 10GB for BYOS users
  
  -- Create user role
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create default Supabase storage provider
  INSERT INTO user_storage_providers (user_id, provider, is_active, storage_quota, storage_used)
  VALUES (NEW.id, 'supabase', true, 10737418240, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Storage tracking function
CREATE OR REPLACE FUNCTION update_user_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles 
    SET storage_used = storage_used + NEW.file_size
    WHERE id = NEW.user_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles 
    SET storage_used = storage_used - OLD.file_size
    WHERE id = OLD.user_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for storage tracking
DROP TRIGGER IF EXISTS track_storage_changes ON tracks;
CREATE TRIGGER track_storage_changes
  AFTER INSERT OR DELETE ON tracks
  FOR EACH ROW EXECUTE FUNCTION update_user_storage();

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_user_storage_providers_updated_at 
BEFORE UPDATE ON user_storage_providers 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tracks_updated_at 
BEFORE UPDATE ON tracks 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to ensure only one active provider per user
CREATE OR REPLACE FUNCTION ensure_single_active_provider()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a provider as active, deactivate all others for this user
  IF NEW.is_active = true THEN
    UPDATE user_storage_providers 
    SET is_active = false 
    WHERE user_id = NEW.user_id 
    AND provider != NEW.provider;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to ensure single active provider
CREATE TRIGGER ensure_single_active_provider_trigger
BEFORE INSERT OR UPDATE ON user_storage_providers
FOR EACH ROW EXECUTE FUNCTION ensure_single_active_provider();

-- Storage management functions
CREATE OR REPLACE FUNCTION get_user_storage_summary(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_providers', COUNT(*),
    'active_provider', (
      SELECT json_build_object(
        'provider', provider,
        'storage_used', storage_used,
        'storage_quota', storage_quota,
        'provider_email', provider_email
      )
      FROM user_storage_providers 
      WHERE user_id = p_user_id AND is_active = true
      LIMIT 1
    ),
    'all_providers', json_agg(
      json_build_object(
        'provider', provider,
        'connected', (encrypted_access_token IS NOT NULL),
        'is_active', is_active,
        'storage_used', storage_used,
        'storage_quota', storage_quota,
        'provider_email', provider_email,
        'created_at', created_at
      )
    )
  ) INTO result
  FROM user_storage_providers
  WHERE user_id = p_user_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to switch active provider
CREATE OR REPLACE FUNCTION switch_active_provider(p_provider TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id_val UUID;
BEGIN
  -- Get current user ID
  user_id_val := auth.uid();
  
  IF user_id_val IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Check if provider exists and is connected
  IF NOT EXISTS (
    SELECT 1 FROM user_storage_providers 
    WHERE user_id = user_id_val 
    AND provider = p_provider 
    AND encrypted_access_token IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Provider % is not connected for user', p_provider;
  END IF;
  
  -- Deactivate all providers for user
  UPDATE user_storage_providers 
  SET is_active = false 
  WHERE user_id = user_id_val;
  
  -- Activate the specified provider
  UPDATE user_storage_providers 
  SET is_active = true 
  WHERE user_id = user_id_val 
  AND provider = p_provider;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =================================================================
-- PART 6: Initial Data Setup
-- =================================================================

-- Create initial invite code for setup
INSERT INTO invites (code, expires_at) 
VALUES ('BYOS2025', NOW() + INTERVAL '30 days')
ON CONFLICT (code) DO NOTHING;

-- =================================================================
-- PART 7: Permissions
-- =================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Storage bucket setup (run this separately in Supabase if needed)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', false);

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'CoreTet BYOS Foundation Schema installed successfully!';
  RAISE NOTICE 'Use invite code: BYOS2025';
  RAISE NOTICE 'Ready for user registration and storage provider setup.';
END $$;