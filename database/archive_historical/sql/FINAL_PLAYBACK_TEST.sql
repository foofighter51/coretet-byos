-- FINAL PLAYBACK TEST
-- Test all components needed for shared playlist playback

-- 1. Your current session
SELECT 
    'Session' as section,
    auth.uid() as user_id,
    auth.email() as email,
    CASE 
        WHEN auth.uid() IS NULL THEN '❌ Not authenticated'
        ELSE '✅ Authenticated'
    END as auth_status;

-- 2. Can you see shared playlists?
SELECT 
    'Shared Playlists' as section,
    p.id,
    p.name,
    ps.status,
    ps.can_rate,
    COUNT(pt.id) as track_count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
GROUP BY p.id, p.name, ps.status, ps.can_rate;

-- 3. Can you see tracks in shared playlists?
SELECT 
    'Track Visibility' as section,
    p.name as playlist,
    t.id as track_id,
    t.name as track_name,
    t.storage_path,
    CASE 
        WHEN t.storage_path IS NOT NULL THEN '✅ Has storage path'
        ELSE '❌ Missing storage path'
    END as storage_status
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN playlist_tracks pt ON pt.playlist_id = p.id
JOIN tracks t ON t.id = pt.track_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
LIMIT 5;

-- 4. Test edge function access
-- The edge function should be able to generate URLs for these tracks
SELECT 
    'Edge Function Requirements' as section,
    'Tracks visible' as requirement,
    COUNT(*) > 0 as met
FROM tracks t
WHERE EXISTS (
    SELECT 1 FROM playlist_tracks pt
    JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
    WHERE pt.track_id = t.id
    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
)
UNION ALL
SELECT 
    'Edge Function Requirements' as section,
    'Storage paths exist' as requirement,
    COUNT(*) = COUNT(storage_path) as met
FROM tracks t
WHERE EXISTS (
    SELECT 1 FROM playlist_tracks pt
    JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
    WHERE pt.track_id = t.id
    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
);

-- 5. Summary
SELECT 
    'Playback Ready?' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE LOWER(shared_with_email) = LOWER(auth.email()) 
            AND status = 'active'
        ) AND EXISTS (
            SELECT 1 FROM tracks t
            JOIN playlist_tracks pt ON pt.track_id = t.id
            JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
            WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
            AND ps.status = 'active'
            AND t.storage_path IS NOT NULL
        ) THEN '✅ Yes - Try playing a track now!'
        ELSE '❌ No - Check requirements above'
    END as status;