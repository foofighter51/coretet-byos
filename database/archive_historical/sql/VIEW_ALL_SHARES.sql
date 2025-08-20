-- VIEW ALL SHARES (Admin View)
-- This shows all shares regardless of who you're logged in as

SELECT 
    '🔍 All Playlist Shares' as section,
    ps.shared_with_email as "Recipient Email",
    ps.status as "Status",
    p.name as "Playlist Name",
    pr.email as "Shared By",
    COUNT(pt.id) as "Track Count",
    ps.created_at::date as "Shared Date",
    CASE 
        WHEN ps.status = 'active' THEN '✅ Ready'
        WHEN ps.status = 'pending' THEN '⏳ Pending'
        ELSE ps.status
    END as "Share Status"
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
GROUP BY ps.id, ps.shared_with_email, ps.status, p.name, pr.email, ps.created_at
ORDER BY ps.created_at DESC;