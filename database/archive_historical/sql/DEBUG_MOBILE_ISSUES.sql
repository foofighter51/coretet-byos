-- DEBUG MOBILE ISSUES
-- Run this as the logged in user to diagnose mobile problems

-- 1. Current user info
SELECT 
    'Current User' as section,
    auth.uid() as user_id,
    auth.email() as email,
    p.id as profile_id
FROM profiles p
WHERE p.id = auth.uid();

-- 2. User's own playlists (for My Lists)
SELECT 
    'My Playlists' as section,
    p.id,
    p.name,
    p.description,
    p.user_id,
    p.created_at,
    COUNT(pt.id) as track_count
FROM playlists p
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name, p.description, p.user_id, p.created_at
ORDER BY p.created_at DESC;

-- 3. User's own tracks (for library)
SELECT 
    'My Tracks' as section,
    COUNT(*) as total_tracks
FROM tracks
WHERE user_id = auth.uid();

-- 4. Shared playlists (for Shared view)
SELECT 
    'Shared With Me' as section,
    ps.id as share_id,
    ps.playlist_id,
    ps.status,
    ps.shared_with_email,
    p.name as playlist_name,
    pr.email as shared_by,
    COUNT(pt.id) as track_count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
GROUP BY ps.id, ps.playlist_id, ps.status, ps.shared_with_email, p.name, pr.email;

-- 5. Check RLS policies
SELECT 
    'RLS Check - Can See Own Playlists?' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM playlists WHERE user_id = auth.uid()
        ) THEN 'Yes - Found playlists'
        ELSE 'No playlists found (might not have any)'
    END as result;

-- 6. Check if user is recipient (eric@exleycorp.com)
SELECT 
    'Is Recipient User?' as section,
    CASE 
        WHEN auth.email() = 'eric@exleycorp.com' THEN 'Yes - This is the recipient'
        ELSE 'No - This is: ' || auth.email()
    END as result,
    auth.uid() = '86ded636-5c4c-4f4f-99bb-bcc7fa59ecf3' as is_recipient_id;