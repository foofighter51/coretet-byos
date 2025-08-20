-- DEBUG PLAYBACK STEP BY STEP
-- Run each section to find the issue

-- SECTION 1: Check authentication
SELECT 
    'AUTH CHECK' as test,
    auth.uid() as user_id,
    auth.email() as email;

-- SECTION 2: Check if you have any shared playlists
SELECT 
    'SHARES CHECK' as test,
    COUNT(*) as share_count,
    COUNT(*) FILTER (WHERE status = 'active') as active_shares
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email());

-- SECTION 3: List your active shares
SELECT 
    'YOUR SHARES' as test,
    ps.id,
    ps.playlist_id,
    ps.shared_with_email,
    ps.status,
    p.name as playlist_name
FROM playlist_shares ps
LEFT JOIN playlists p ON p.id = ps.playlist_id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());

-- SECTION 4: Check if playlists are accessible
SELECT 
    'PLAYLIST ACCESS' as test,
    p.id,
    p.name,
    p.user_id as owner_id,
    COUNT(pt.id) as track_count
FROM playlists p
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE EXISTS (
    SELECT 1 FROM playlist_shares ps
    WHERE ps.playlist_id = p.id
    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
)
GROUP BY p.id, p.name, p.user_id;

-- SECTION 5: Check track visibility
SELECT 
    'TRACK ACCESS' as test,
    COUNT(*) as visible_tracks
FROM tracks t
WHERE EXISTS (
    SELECT 1 FROM playlist_tracks pt
    JOIN playlist_shares ps ON ps.playlist_id = pt.playlist_id
    WHERE pt.track_id = t.id
    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
);

-- SECTION 6: Sample tracks from shared playlists
SELECT 
    'SAMPLE TRACKS' as test,
    t.id,
    t.name,
    t.storage_path,
    p.name as from_playlist
FROM tracks t
JOIN playlist_tracks pt ON pt.track_id = t.id
JOIN playlists p ON p.id = pt.playlist_id
JOIN playlist_shares ps ON ps.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'active'
LIMIT 5;