-- DEBUG SHARING
-- Simple queries to understand the current state

-- 1. Your info
SELECT 
    'Your Info' as section,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Check if your profile exists
SELECT 
    'Profile Check' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
        THEN 'Profile exists'
        ELSE 'Profile missing - run FIX_SHARING_ISSUES.sql'
    END as status;

-- 3. All shares for your email (regardless of status)
SELECT 
    'All Shares For You' as section,
    ps.id,
    ps.shared_with_email,
    ps.status,
    p.name as playlist_name,
    pr.email as shared_by_email
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());

-- 4. Show exact column names in playlist_shares
SELECT 
    'Playlist Shares Columns' as section,
    column_name
FROM information_schema.columns
WHERE table_name = 'playlist_shares'
ORDER BY ordinal_position;

-- 5. Raw query to see any shares
SELECT 
    'Raw Shares Data' as section,
    *
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email())
LIMIT 5;