-- Run this query to verify your playlist tables are set up correctly

-- Check if tables exist
SELECT 
  'playlists' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'playlists'
  ) as exists
UNION ALL
SELECT 
  'playlist_tracks' as table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'playlist_tracks'
  ) as exists;

-- Check table structures
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlists' 
ORDER BY ordinal_position;

SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'playlist_tracks' 
ORDER BY ordinal_position;

-- Check if RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('playlists', 'playlist_tracks');

-- Check existing policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('playlists', 'playlist_tracks')
ORDER BY tablename, policyname;

-- Test creating a playlist (replace 'Test Playlist' with your desired name)
-- This will only work if you're authenticated
/*
INSERT INTO playlists (user_id, name, description)
VALUES (auth.uid(), 'Test Playlist', 'Testing playlist functionality')
RETURNING *;
*/