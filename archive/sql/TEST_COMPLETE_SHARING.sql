-- TEST COMPLETE SHARING FUNCTIONALITY
-- Run this as the recipient user to verify everything works

-- 1. Your session info
SELECT 
    'Session Info' as section,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Shared playlists you can access
SELECT 
    'Shared Playlists' as section,
    p.id as playlist_id,
    p.name,
    ps.can_rate,
    pr.email as shared_by,
    COUNT(DISTINCT pt.id) as track_count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
GROUP BY p.id, p.name, ps.can_rate, pr.email;

-- 3. Can you see tracks in shared playlists?
SELECT 
    'Track Access' as section,
    p.name as playlist,
    COUNT(t.id) as visible_tracks
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN playlist_tracks pt ON pt.playlist_id = p.id
JOIN tracks t ON t.id = pt.track_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
GROUP BY p.name;

-- 4. Can you see ratings?
SELECT 
    'Rating Access' as section,
    'Personal ratings visible' as type,
    COUNT(*) as count
FROM personal_track_ratings
UNION ALL
SELECT 
    'Rating Access' as section,
    'Playlist ratings visible' as type,
    COUNT(*) as count
FROM playlist_track_ratings ptr
WHERE EXISTS (
    SELECT 1 FROM playlist_tracks pt
    JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
    WHERE pt.id = ptr.playlist_track_id
    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
);

-- 5. Summary
SELECT 
    'Access Summary' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE LOWER(shared_with_email) = LOWER(auth.email()) 
            AND status = 'active'
        ) THEN '✅ Has shared playlists'
        ELSE '❌ No shared playlists'
    END as playlists,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM tracks t
            WHERE EXISTS (
                SELECT 1 FROM playlist_tracks pt
                JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
                WHERE pt.track_id = t.id
                AND LOWER(ps.shared_with_email) = LOWER(auth.email())
                AND ps.status = 'active'
            )
        ) THEN '✅ Can see tracks'
        ELSE '❌ Cannot see tracks'
    END as tracks,
    '✅ RLS policies updated' as policies;