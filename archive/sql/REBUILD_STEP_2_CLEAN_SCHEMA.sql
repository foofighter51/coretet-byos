-- STEP 2: CREATE CLEAN SCHEMA
-- This creates a simple, working database structure

-- 1. Drop all the complex stuff we don't need
DROP TABLE IF EXISTS playlist_shares CASCADE;
DROP TABLE IF EXISTS collaborators CASCADE;
DROP TABLE IF EXISTS collaborator_permissions CASCADE;
DROP TABLE IF EXISTS invites CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS track_ratings CASCADE;
DROP TABLE IF EXISTS user_track_ratings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Keep core tables but clean them up
-- First, disable RLS to make changes
ALTER TABLE tracks DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks DISABLE ROW LEVEL SECURITY;

-- 3. Drop all existing policies to start fresh
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

-- 4. Create simple profiles table FIRST (before we reference it)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Insert ALL existing users from tracks/playlists into profiles
INSERT INTO profiles (id, email)
SELECT DISTINCT u.id, u.email 
FROM auth.users u
WHERE u.id IN (
    SELECT DISTINCT user_id FROM tracks
    UNION
    SELECT DISTINCT user_id FROM playlists
)
ON CONFLICT (id) DO NOTHING;

-- 6. Clean up tracks table - remove unused columns
ALTER TABLE tracks DROP COLUMN IF EXISTS s3_key;
ALTER TABLE tracks DROP COLUMN IF EXISTS key;
ALTER TABLE tracks DROP COLUMN IF EXISTS ai_recommended_tags;
ALTER TABLE tracks DROP COLUMN IF EXISTS analysis;

-- 7. Fix categories first (update non-standard ones)
UPDATE tracks
SET category = 'songs'
WHERE category NOT IN ('songs', 'demos', 'ideas', 'voice-memos');

-- 8. Ensure tracks table has correct structure
ALTER TABLE tracks 
    ALTER COLUMN storage_path SET NOT NULL,
    ALTER COLUMN category TYPE TEXT;

-- Remove complex category constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_category_check;

-- Add simple category constraint
ALTER TABLE tracks ADD CONSTRAINT tracks_category_check 
    CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos'));

-- 9. NOW add foreign key constraints (after profiles table is populated)
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_user_id_fkey;
ALTER TABLE tracks ADD CONSTRAINT tracks_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE playlists DROP CONSTRAINT IF EXISTS playlists_user_id_fkey;
ALTER TABLE playlists ADD CONSTRAINT playlists_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 9. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_created_at ON tracks(created_at);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);

SELECT '✅ Schema cleaned up and ready for simple RLS' as status;