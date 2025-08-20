-- VERIFY SHARING WORKS NOW
-- Run this AS the recipient user to confirm access

-- 1. Your identity
SELECT 
    'You Are' as section,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Can you see the shared playlist?
SELECT 
    'Shared Playlist Access' as section,
    p.id,
    p.name,
    p.user_id as owner_id,
    pr.email as owner_email,
    ps.status as share_status,
    ps.can_rate
FROM playlists p
JOIN playlist_shares ps ON ps.playlist_id = p.id
JOIN profiles pr ON pr.id = p.user_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active';

-- 3. Can you see tracks in the shared playlist?
SELECT 
    'Shared Playlist Tracks' as section,
    p.name as playlist_name,
    t.title,
    t.artist,
    pt.position
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN playlist_tracks pt ON pt.playlist_id = p.id
JOIN tracks t ON t.id = pt.track_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
ORDER BY pt.position
LIMIT 10;

-- 4. Summary
SELECT 
    'Access Summary' as section,
    COUNT(DISTINCT p.id) as shared_playlists,
    COUNT(DISTINCT pt.track_id) as total_tracks
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active';