-- CHECK SHARE FOR ERIC@EXLEYCORP.COM
-- Verify the sharing is working for this specific user

-- 1. Confirm the user details
SELECT 
    'User Details' as section,
    id,
    email,
    created_at
FROM profiles
WHERE id = '86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3';

-- 2. Check shares sent to this email
SELECT 
    'Shares to eric@exleycorp.com' as section,
    ps.id,
    ps.shared_with_email,
    ps.status,
    ps.can_rate,
    ps.accepted_at,
    p.name as playlist_name,
    pr.email as shared_by_email,
    COUNT(pt.id) as track_count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) IN ('eric@exleycorp.com', 'Eric@exleycorp.com')
GROUP BY ps.id, ps.shared_with_email, ps.status, ps.can_rate, ps.accepted_at, p.name, pr.email;

-- 3. What the app queries for (exact match)
SELECT 
    'App Query Result' as section,
    ps.*,
    p.name as playlist_name
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE ps.shared_with_email = 'eric@exleycorp.com'
    AND ps.status = 'active';

-- 4. Try lowercase comparison (what the app should use)
SELECT 
    'Case-Insensitive Result' as section,
    ps.*,
    p.name as playlist_name
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE LOWER(ps.shared_with_email) = LOWER('eric@exleycorp.com')
    AND ps.status = 'active';

-- 5. Debug: Show all shares in the system
SELECT 
    'All Shares Debug' as section,
    shared_with_email,
    status,
    LOWER(shared_with_email) as lowercase_email,
    LOWER(shared_with_email) = LOWER('eric@exleycorp.com') as matches_eric
FROM playlist_shares;