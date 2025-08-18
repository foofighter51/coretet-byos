-- Fix Column Name Mismatches
-- This patches the foundation schema to match what the application expects

-- Add missing storage_path column to tracks (app expects this instead of s3_key)
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Copy s3_key data to storage_path if needed
UPDATE tracks SET storage_path = s3_key WHERE storage_path IS NULL AND s3_key IS NOT NULL;

-- Add missing columns to view_preferences that the app expects
ALTER TABLE view_preferences ADD COLUMN IF NOT EXISTS view_type TEXT;
ALTER TABLE view_preferences ADD COLUMN IF NOT EXISTS view_id TEXT;

-- Migrate existing view_preferences data
UPDATE view_preferences SET 
  view_type = 'category',
  view_id = view_context 
WHERE view_type IS NULL;

-- Add missing playlist_shares table (referenced by app)
CREATE TABLE IF NOT EXISTS playlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  shared_with_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  can_edit BOOLEAN DEFAULT false,
  can_rate BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add auto_accept_playlist_shares function (referenced by app)
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void AS $$
BEGIN
  -- This is a placeholder function that the app expects
  -- Implementation would auto-accept pending playlist shares
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Fix the infinite recursion in user_roles RLS policy
-- First drop existing policies if they exist
DROP POLICY IF EXISTS "Users can only view their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update their own role" ON user_roles;

-- Create simpler, non-recursive policies
CREATE POLICY "Users can view their own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all roles" ON user_roles
  FOR ALL USING (auth.role() = 'service_role');

-- Enable RLS on user_roles if not already enabled
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Ensure RLS is enabled on other tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_shares ENABLE ROW LEVEL SECURITY;

-- Add basic RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Add basic RLS policies for tracks
CREATE POLICY "Users can view their own tracks" ON tracks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks" ON tracks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" ON tracks
  FOR UPDATE USING (auth.uid() = user_id);

-- Add basic RLS policies for playlists
CREATE POLICY "Users can view their own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

-- Add basic RLS policies for view_preferences
CREATE POLICY "Users can view their own preferences" ON view_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON view_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON view_preferences
  FOR UPDATE USING (auth.uid() = user_id);