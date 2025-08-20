-- VERIFY SHARE IS WORKING
-- Run this as the recipient to confirm they can see the shared playlist

-- 1. Your identity
SELECT 
    'You are' as info,
    auth.email() as your_email,
    auth.uid() as your_user_id;

-- 2. Shares for you (what the frontend queries)
SELECT 
    'Shared Playlists Visible' as section,
    ps.id as share_id,
    ps.playlist_id,
    ps.status,
    ps.can_rate,
    p.name as playlist_name,
    p.description,
    pr.email as shared_by_email,
    COUNT(pt.id) as track_count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
GROUP BY ps.id, ps.playlist_id, ps.status, ps.can_rate, p.name, p.description, pr.email;

-- 3. Can you access tracks in the shared playlist?
SELECT 
    'Sample Tracks from Shared Playlists' as section,
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
ORDER BY p.name, pt.position
LIMIT 10;

-- 4. Summary
SELECT 
    'Summary' as section,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ You have ' || COUNT(*) || ' shared playlist(s)'
        ELSE '❌ No shared playlists found'
    END as status
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'active';