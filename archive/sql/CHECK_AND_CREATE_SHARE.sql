-- CHECK AND CREATE SHARE
-- Debug why shares aren't being created

-- 1. First, check your email
SELECT 
    'Your Email' as info,
    auth.email() as email,
    auth.uid() as user_id;

-- 2. Check all shares in the system
SELECT 
    'All Shares in System' as section,
    ps.*,
    p.name as playlist_name,
    'From: ' || pr1.email as shared_by,
    'To: ' || ps.shared_with_email as shared_with
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr1 ON pr1.id = ps.shared_by
ORDER BY ps.created_at DESC;

-- 3. Find a playlist to share (from another user)
SELECT 
    'Available Playlists to Share With You' as section,
    p.id as playlist_id,
    p.name,
    pr.email as owner_email,
    p.created_at
FROM playlists p
JOIN profiles pr ON pr.id = p.user_id
WHERE p.user_id != auth.uid()
ORDER BY p.created_at DESC
LIMIT 5;

-- 4. Create a test share (you'll need to update the playlist_id)
-- IMPORTANT: Replace 'PLAYLIST_ID_HERE' with an actual playlist ID from step 3
/*
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    share_status,
    can_rate
) 
SELECT 
    'PLAYLIST_ID_HERE'::uuid,  -- Replace with actual playlist ID
    p.user_id,
    auth.email(),  -- Share with current user
    'pending',
    true
FROM playlists p
WHERE p.id = 'PLAYLIST_ID_HERE'::uuid  -- Replace with same playlist ID
ON CONFLICT (playlist_id, shared_with_email) DO NOTHING;
*/

-- 5. If you're the playlist owner, share with a test email
SELECT 
    'Your Playlists' as section,
    id as playlist_id,
    name,
    created_at,
    '-- Share this playlist by uncommenting below and replacing email' as instructions
FROM playlists
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 5;

-- Example share command (uncomment and modify):
/*
INSERT INTO playlist_shares (
    playlist_id,
    shared_by,
    shared_with_email,
    share_status,
    can_rate
) VALUES (
    'YOUR_PLAYLIST_ID',  -- Replace with your playlist ID
    auth.uid(),
    'recipient@example.com',  -- Replace with recipient email
    'pending',
    true
);
*/

-- 6. Check if share was created
SELECT 
    'Recent Shares' as section,
    *
FROM playlist_shares
ORDER BY created_at DESC
LIMIT 10;