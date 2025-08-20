-- TEST SHARING FUNCTIONALITY
-- Run this after creating the sharing system

-- 1. Check if playlist_shares table exists
SELECT 
    'Playlist Shares Table' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'playlist_shares'
        ) THEN '✅ Table exists'
        ELSE '❌ Table missing - run CREATE_SHARING_SYSTEM.sql first'
    END as status;

-- 2. Check current user has playlists to share
SELECT 
    'Available Playlists' as test,
    COUNT(*) as playlist_count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ You have ' || COUNT(*) || ' playlists to share'
        ELSE '❌ No playlists found - create one first'
    END as status
FROM playlists
WHERE user_id = auth.uid();

-- 3. List your playlists with track counts
SELECT 
    'Your Playlists' as section,
    p.id,
    p.name,
    COUNT(pt.track_id) as track_count,
    p.created_at::date as created
FROM playlists p
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name, p.created_at
ORDER BY p.created_at DESC;

-- 4. Check if you have any existing shares (as owner)
SELECT 
    'Playlists You Shared' as section,
    ps.id as share_id,
    p.name as playlist_name,
    ps.shared_with_email,
    ps.share_status,
    ps.created_at::date as shared_on
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE ps.shared_by = auth.uid()
ORDER BY ps.created_at DESC;

-- 5. Check if you have any shares (as recipient)
SELECT 
    'Playlists Shared With You' as section,
    p.name as playlist_name,
    pr.email as shared_by,
    ps.share_status,
    ps.can_rate,
    ps.accepted_at::date as accepted_on
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
ORDER BY ps.created_at DESC;

-- 6. Test creating a share (replace values)
-- IMPORTANT: Update these values before running!
/*
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    can_rate
) VALUES (
    'YOUR_PLAYLIST_ID', -- Replace with actual playlist ID from step 3
    auth.uid(),
    'friend@example.com', -- Replace with recipient's email
    true
);
*/

-- 7. Instructions for testing
SELECT 
    '📋 Testing Instructions' as section,
    '1. Note a playlist ID from "Your Playlists" above' as step_1,
    '2. Uncomment and update the INSERT statement in step 6' as step_2,
    '3. Run the INSERT to share the playlist' as step_3,
    '4. Have the recipient log in with that email' as step_4,
    '5. The playlist should appear in their "Shared With Me" section' as step_5;

-- 8. Debug: Check RLS policies
SELECT 
    'RLS Policy Check' as test,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'playlist_shares'
ORDER BY tablename, policyname;