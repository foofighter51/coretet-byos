-- Check all playlist shares in the system
-- This will show all invitations sent, both pending and accepted

-- First, check if the playlist_shares table exists and has data
SELECT COUNT(*) as total_shares FROM playlist_shares;

-- Show all shares with details
SELECT 
    ps.id,
    ps.playlist_id,
    p.name as playlist_name,
    ps.shared_with_email,
    ps.status,
    ps.can_edit,
    ps.invited_at,
    ps.accepted_at,
    u.email as shared_by_email
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
JOIN auth.users u ON ps.shared_by = u.id
ORDER BY ps.invited_at DESC;

-- Show shares grouped by playlist
SELECT 
    p.name as playlist_name,
    COUNT(*) as total_invites,
    COUNT(CASE WHEN ps.status = 'pending' THEN 1 END) as pending,
    COUNT(CASE WHEN ps.status = 'active' THEN 1 END) as active,
    COUNT(CASE WHEN ps.status = 'revoked' THEN 1 END) as revoked
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
GROUP BY p.name
ORDER BY p.name;

-- Check for any recent shares (last 24 hours)
SELECT 
    ps.shared_with_email,
    p.name as playlist_name,
    ps.status,
    ps.invited_at,
    u.email as invited_by
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
JOIN auth.users u ON ps.shared_by = u.id
WHERE ps.invited_at > NOW() - INTERVAL '24 hours'
ORDER BY ps.invited_at DESC;