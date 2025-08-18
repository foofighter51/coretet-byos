-- Nuclear Option: Completely Disable RLS for Development
-- This disables all RLS policies to stop recursion issues during BYOS development

-- Disable RLS on all tables that might cause issues
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE view_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_storage_providers DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to clean slate
DROP POLICY IF EXISTS "Simple profile access" ON profiles;
DROP POLICY IF EXISTS "Simple role access" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can insert their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can update their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can insert their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can update their own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can view their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON view_preferences;

-- Keep RLS disabled for now - we'll re-enable with proper policies later
-- This allows BYOS development to continue without authentication issues