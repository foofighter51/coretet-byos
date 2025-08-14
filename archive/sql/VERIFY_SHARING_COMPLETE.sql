-- VERIFY SHARING IS COMPLETE
-- Run this to check the full sharing system

-- 1. Check your current user
SELECT 
    'Current User' as section,
    auth.uid() as user_id,
    auth.email() as email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
        THEN '✅ Profile exists'
        ELSE '❌ Profile missing'
    END as profile_status;

-- 2. Check shares you've made
SELECT 
    'Shares You Created' as section,
    p.name as playlist_name,
    ps.shared_with_email as shared_with,
    ps.status,
    ps.created_at::date as date_shared,
    CASE 
        WHEN ps.accepted_at IS NOT NULL THEN '✅ Accepted'
        WHEN ps.status = 'pending' THEN '⏳ Pending'
        ELSE ps.status
    END as status_display
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE ps.shared_by = auth.uid()
ORDER BY ps.created_at DESC;

-- 3. Check shares you've received
SELECT 
    'Shares You Received' as section,
    p.name as playlist_name,
    pr.email as shared_by,
    ps.status,
    ps.accepted_at::date as date_accepted,
    CASE 
        WHEN ps.status = 'accepted' THEN '✅ Ready to play'
        WHEN ps.status = 'pending' THEN '⏳ Log out/in to accept'
        ELSE ps.status
    END as action_needed
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
ORDER BY ps.created_at DESC;

-- 4. System health check
SELECT 
    'System Status' as section,
    (SELECT COUNT(*) FROM playlist_shares) as total_shares,
    (SELECT COUNT(*) FROM playlist_shares WHERE status = 'accepted') as accepted_shares,
    (SELECT COUNT(*) FROM playlist_shares WHERE status = 'pending') as pending_shares,
    (SELECT COUNT(DISTINCT shared_with_email) FROM playlist_shares) as unique_recipients;

-- 5. Test auto-accept
SELECT 
    'Auto-Accept Test' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE LOWER(shared_with_email) = LOWER(auth.email()) 
            AND status = 'pending'
        )
        THEN 'You have pending shares - run auto_accept_playlist_shares()'
        ELSE 'No pending shares to accept'
    END as status;