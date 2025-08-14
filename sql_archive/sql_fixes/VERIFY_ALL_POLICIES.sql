-- Verify all critical policies are in place

-- 1. Check playlists table policies
SELECT 'PLAYLISTS TABLE:' as table_info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'playlists' ORDER BY policyname;

-- 2. Check playlist_shares table policies  
SELECT 'PLAYLIST_SHARES TABLE:' as table_info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'playlist_shares' ORDER BY policyname;

-- 3. Check tracks table policies
SELECT 'TRACKS TABLE:' as table_info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tracks' ORDER BY policyname;

-- Expected results:
-- PLAYLISTS: Should have policies for own playlists AND shared playlists
-- PLAYLIST_SHARES: Should allow users to view shares where they're the recipient
-- TRACKS: Should have policies for own tracks AND tracks in shared playlists