-- CREATE TEST SHARE
-- Use this to create a test share between accounts

-- 1. First, check what playlists exist
SELECT 
    'Available Playlists' as section,
    p.id as playlist_id,
    p.name as playlist_name,
    pr.email as owner_email,
    COUNT(pt.track_id) as track_count
FROM playlists p
JOIN profiles pr ON pr.id = p.user_id
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
GROUP BY p.id, p.name, pr.email
ORDER BY p.created_at DESC;

-- 2. Create a test share
-- Replace the values below with actual data:
/*
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    status,
    can_rate,
    can_edit
) VALUES (
    'REPLACE_WITH_PLAYLIST_ID',  -- Get from query above
    'REPLACE_WITH_OWNER_ID',     -- Get from query above or use auth.uid() if you own it
    'recipient@example.com',     -- Email of person to share with
    'pending',
    true,
    false
) ON CONFLICT (playlist_id, shared_with_email) DO UPDATE
SET status = 'pending', updated_at = NOW();
*/

-- 3. Example: Share your first playlist with a specific email
-- Uncomment and run if you have playlists:
/*
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    status,
    can_rate,
    can_edit
) 
SELECT 
    p.id,
    p.user_id,
    'test@example.com',  -- Change to actual recipient email
    'pending',
    true,
    false
FROM playlists p
WHERE p.user_id = auth.uid()
ORDER BY p.created_at DESC
LIMIT 1
ON CONFLICT (playlist_id, shared_with_email) DO NOTHING;
*/

-- 4. Verify the share was created
SELECT 
    'Recent Shares' as section,
    ps.*,
    p.name as playlist_name
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
ORDER BY ps.created_at DESC
LIMIT 5;