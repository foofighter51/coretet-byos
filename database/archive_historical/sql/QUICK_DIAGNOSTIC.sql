-- QUICK DIAGNOSTIC
-- Run this to get a snapshot of the current system state

-- User Info
SELECT 
    '👤 Current User' as section,
    auth.uid() as user_id,
    (SELECT email FROM auth.users WHERE id = auth.uid()) as email;

-- Track Summary
SELECT 
    '🎵 Tracks' as section,
    COUNT(*) as total_tracks,
    COUNT(DISTINCT category) as categories,
    COUNT(CASE WHEN storage_path IS NOT NULL THEN 1 END) as tracks_with_storage
FROM tracks
WHERE user_id = auth.uid();

-- Playlist Summary
SELECT 
    '📋 Playlists' as section,
    COUNT(*) as owned_playlists,
    (SELECT COUNT(*) FROM playlist_shares 
     WHERE shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
     AND status = 'active') as shared_playlists
FROM playlists
WHERE user_id = auth.uid();

-- Rating Summary
SELECT 
    '⭐ Ratings' as section,
    (SELECT COUNT(*) FROM personal_track_ratings WHERE user_id = auth.uid()) as personal_ratings,
    (SELECT COUNT(*) FROM playlist_track_ratings WHERE user_id = auth.uid()) as playlist_ratings;

-- Recent Activity
SELECT 
    '📅 Recent Activity' as section,
    'Latest Track' as type,
    name as item,
    created_at::date as date
FROM tracks
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1
UNION ALL
SELECT 
    '📅 Recent Activity' as section,
    'Latest Playlist' as type,
    name as item,
    created_at::date as date
FROM playlists
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 1;

-- Storage Usage (approximate)
SELECT 
    '💾 Storage Info' as section,
    pg_size_pretty(SUM(COALESCE(file_size, 0))::bigint) as total_size,
    COUNT(*) as file_count
FROM tracks
WHERE user_id = auth.uid();

-- Quick Health Check
SELECT 
    '🏥 Health Check' as section,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ System appears healthy'
        ELSE '⚠️ No data found - new user?'
    END as status
FROM tracks
WHERE user_id = auth.uid();