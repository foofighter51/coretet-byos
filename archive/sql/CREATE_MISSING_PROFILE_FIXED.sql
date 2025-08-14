-- CREATE MISSING PROFILE (FIXED)
-- Run this as the user who is missing their profile

-- 1. Check if you have a profile
SELECT 
    'Current User Status' as section,
    auth.uid() as user_id,
    auth.email() as email,
    CASE 
        WHEN EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
        THEN 'Profile exists'
        ELSE 'Profile missing - will create'
    END as status;

-- 2. Create profile if missing
INSERT INTO profiles (id, email, created_at)
VALUES (
    auth.uid(),
    auth.email(),
    NOW()
)
ON CONFLICT (id) DO UPDATE
SET email = COALESCE(profiles.email, EXCLUDED.email);

-- 3. Verify profile was created
SELECT 
    'Profile After Creation' as section,
    id,
    email,
    created_at
FROM profiles
WHERE id = auth.uid();

-- 4. Now check for shared playlists
SELECT 
    'Your Shared Playlists' as section,
    ps.status,
    p.name as playlist_name,
    pr.email as shared_by
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());

-- 5. Run auto-accept
SELECT auto_accept_playlist_shares();

-- 6. Check shared playlists again
SELECT 
    'Active Shared Playlists' as section,
    p.name as playlist_name,
    pr.email as shared_by,
    ps.can_rate,
    COUNT(pt.id) as track_count
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
GROUP BY p.name, pr.email, ps.can_rate;