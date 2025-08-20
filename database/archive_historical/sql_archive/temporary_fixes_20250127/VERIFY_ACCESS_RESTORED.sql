-- VERIFY ACCESS IS RESTORED

-- 1. Check if you can see your tracks (using auth.uid())
SELECT 'Tracks visible with auth.uid():' as test, COUNT(*) as count
FROM tracks
WHERE user_id = auth.uid();

-- 2. Check if you can see your tracks (using direct ID)
SELECT 'Tracks with direct ID:' as test, COUNT(*) as count
FROM tracks
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- 3. Check if you can see your playlists
SELECT 'Playlists visible:' as test, COUNT(*) as count
FROM playlists
WHERE user_id = auth.uid();

-- 4. Test a sample query similar to what the app uses
SELECT 
    id,
    name,
    created_at
FROM tracks
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- 5. Also update playlist_tracks and playlist_shares if needed
-- Check current policies
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE tablename IN ('playlist_tracks', 'playlist_shares')
GROUP BY tablename;