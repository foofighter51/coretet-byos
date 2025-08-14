-- TEST SHARING FUNCTIONALITY NOW
-- The sharing system is ready!

-- 1. Your current playlists
SELECT 
    '📋 Your Playlists' as section,
    p.id,
    p.name,
    COUNT(pt.track_id) as tracks,
    p.created_at::date as created
FROM playlists p
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name, p.created_at
ORDER BY p.created_at DESC;

-- 2. Test the auto-accept function
SELECT auto_accept_playlist_shares();

-- 3. Check any shares you've made
SELECT 
    '📤 Playlists You Shared' as section,
    p.name as playlist,
    ps.shared_with_email as shared_with,
    ps.share_status as status,
    ps.created_at as when_shared
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE ps.shared_by = auth.uid();

-- 4. Check any shares you've received
SELECT 
    '📥 Playlists Shared With You' as section,
    p.name as playlist,
    profiles.email as shared_by,
    ps.share_status as status,
    CASE 
        WHEN ps.share_status = 'accepted' THEN '✅ Ready to play!'
        WHEN ps.share_status = 'pending' THEN '⏳ Log out/in to accept'
        ELSE ps.share_status
    END as action,
    ps.created_at as when_shared
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles ON profiles.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()));

-- 5. Quick share test (update these values!)
/*
-- Example: Share your first playlist
INSERT INTO playlist_shares (
    playlist_id, 
    shared_by, 
    shared_with_email
) VALUES (
    (SELECT id FROM playlists WHERE user_id = auth.uid() LIMIT 1),
    auth.uid(),
    'friend@example.com'  -- Change this!
);
*/

-- 6. Summary
SELECT 
    '✅ Sharing System Status' as status,
    'Ready to use!' as message,
    'Use the UI share button or SQL INSERT above' as next_step;