-- DIAGNOSE SHARE VISIBILITY
-- Run this as the recipient user to see why shares aren't showing

-- 1. Who are you?
SELECT 
    'Current User Info' as section,
    auth.uid() as your_user_id,
    auth.email() as your_email,
    p.email as profile_email,
    p.id as profile_id
FROM profiles p
WHERE p.id = auth.uid();

-- 2. Check ALL shares for your email (case-insensitive)
SELECT 
    'All Shares To You' as section,
    ps.*,
    p.name as playlist_name,
    pr.email as owner_email
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
   OR LOWER(ps.shared_with_email) = LOWER((SELECT email FROM profiles WHERE id = auth.uid()));

-- 3. Check if auto-accept ran
SELECT 
    'Auto-Accept Status' as section,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
    COUNT(*) as total_shares
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email());

-- 4. Try manual auto-accept
SELECT auto_accept_playlist_shares();

-- 5. Check again after auto-accept
SELECT 
    'Shares After Auto-Accept' as section,
    ps.id,
    ps.shared_with_email,
    ps.status,
    ps.accepted_at,
    p.name as playlist_name
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());

-- 6. What the frontend queries look for
-- Check if this returns any results
SELECT 
    'Frontend Query Test' as section,
    p.*,
    ps.can_rate,
    ps.can_edit,
    ps.shared_by,
    pr.email as owner_email
FROM playlists p
JOIN playlist_shares ps ON ps.playlist_id = p.id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE ps.shared_with_email = auth.email()
  AND ps.status = 'accepted';

-- 7. Case sensitivity check
SELECT 
    'Email Case Check' as section,
    auth.email() as auth_email,
    shared_with_email,
    LOWER(auth.email()) = LOWER(shared_with_email) as matches_case_insensitive,
    auth.email() = shared_with_email as matches_exact
FROM playlist_shares
WHERE playlist_id IN (
    SELECT playlist_id 
    FROM playlist_shares 
    WHERE LOWER(shared_with_email) LIKE '%' || SPLIT_PART(LOWER(auth.email()), '@', 1) || '%'
);