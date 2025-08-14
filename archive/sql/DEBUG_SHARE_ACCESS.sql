-- DEBUG SHARE ACCESS
-- Run this AS the recipient user (eric@exleycorp.com)

-- 1. Who are you logged in as?
SELECT 
    'Current Session' as section,
    auth.uid() as user_id,
    auth.email() as email,
    p.id as profile_id,
    p.email as profile_email
FROM profiles p
WHERE p.id = auth.uid();

-- 2. Check RLS policy for playlist_shares
SELECT 
    'Can You See Shares?' as section,
    ps.id,
    ps.shared_with_email,
    ps.status,
    p.name as playlist_name,
    CASE 
        WHEN LOWER(ps.shared_with_email) = LOWER(auth.email()) THEN '✅ Email matches'
        ELSE '❌ Email mismatch'
    END as access_check
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());

-- 3. Check if you can access the playlist
SELECT 
    'Playlist Access Check' as section,
    p.id,
    p.name,
    p.user_id,
    CASE 
        WHEN p.user_id = auth.uid() THEN 'Owner'
        WHEN EXISTS (
            SELECT 1 FROM playlist_shares 
            WHERE playlist_id = p.id 
            AND LOWER(shared_with_email) = LOWER(auth.email())
            AND status = 'active'
        ) THEN 'Shared with you'
        ELSE 'No access'
    END as access_type
FROM playlists p
WHERE p.id IN (
    SELECT playlist_id FROM playlist_shares 
    WHERE LOWER(shared_with_email) = LOWER(auth.email())
);

-- 4. Test the exact app query
SELECT 
    'App Query Result' as section,
    COUNT(*) as shares_found
FROM playlist_shares
WHERE shared_with_email = auth.email()
    AND status IN ('active', 'pending');