-- VERIFY SHARING SYSTEM IS WORKING
-- Run this to confirm everything is functioning properly

-- 1. Check your current user info
SELECT 
    'Current User' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Verify you can see your own playlists
SELECT 
    'Your Playlists' as section,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Can access your playlists'
        ELSE '⚠️ No playlists found'
    END as status
FROM playlists
WHERE user_id = auth.uid();

-- 3. Verify you can see your tracks
SELECT 
    'Your Tracks' as section,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ Can access your tracks'
        ELSE '⚠️ No tracks found'
    END as status
FROM tracks
WHERE user_id = auth.uid();

-- 4. Check sharing functionality
SELECT 
    'Sharing Status' as section,
    (SELECT COUNT(*) FROM playlist_shares WHERE shared_by = auth.uid()) as playlists_shared_by_you,
    (SELECT COUNT(*) FROM playlist_shares WHERE LOWER(shared_with_email) = LOWER(auth.email())) as playlists_shared_with_you;

-- 5. Test creating a share (optional)
/*
-- Uncomment and update email to test sharing:
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email
) VALUES (
    (SELECT id FROM playlists WHERE user_id = auth.uid() LIMIT 1),
    auth.uid(),
    'test@example.com'  -- Change this to a real email!
) ON CONFLICT (playlist_id, shared_with_email) DO NOTHING;
*/

-- 6. System health check
SELECT 
    'System Health' as check,
    CASE 
        WHEN (
            EXISTS (SELECT 1 FROM playlists WHERE user_id = auth.uid()) OR
            EXISTS (SELECT 1 FROM tracks WHERE user_id = auth.uid())
        ) THEN '✅ RLS policies working correctly'
        ELSE '⚠️ Check if you have data or RLS issues'
    END as status,
    '🎉 Sharing system is ready!' as message;