-- DEBUG WITHOUT AUTH
-- Run this to see the data without authentication

-- 1. All users in the system
SELECT 
    'All Users' as section,
    p.id,
    p.email,
    p.created_at,
    (SELECT COUNT(*) FROM tracks WHERE user_id = p.id) as track_count,
    (SELECT COUNT(*) FROM playlists WHERE user_id = p.id) as playlist_count
FROM profiles p
ORDER BY p.created_at DESC;

-- 2. All playlist shares
SELECT 
    'All Shares' as section,
    ps.shared_with_email as recipient,
    ps.status,
    p.name as playlist_name,
    pr.email as shared_by,
    ps.created_at::date as shared_date
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
ORDER BY ps.created_at DESC;

-- 3. Check specific recipient
SELECT 
    'Eric@exleycorp.com Status' as section,
    p.id as user_id,
    p.email,
    EXISTS (
        SELECT 1 FROM playlist_shares 
        WHERE LOWER(shared_with_email) = 'eric@exleycorp.com'
        AND status = 'active'
    ) as has_active_shares,
    (SELECT COUNT(*) FROM tracks WHERE user_id = p.id) as owns_tracks,
    (SELECT COUNT(*) FROM playlists WHERE user_id = p.id) as owns_playlists
FROM profiles p
WHERE LOWER(p.email) = 'eric@exleycorp.com';

-- 4. Playlist details
SELECT 
    'Shared Playlist Details' as section,
    p.id as playlist_id,
    p.name,
    pr.email as owner,
    COUNT(DISTINCT pt.id) as track_count,
    COUNT(DISTINCT ps.id) as share_count
FROM playlists p
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
LEFT JOIN playlist_shares ps ON ps.playlist_id = p.id
WHERE p.id IN (
    SELECT playlist_id FROM playlist_shares 
    WHERE LOWER(shared_with_email) = 'eric@exleycorp.com'
)
GROUP BY p.id, p.name, pr.email;