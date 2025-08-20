-- MONITOR SHARING TEST
-- Run this to see the current state of shares during testing

-- 1. Show all shares with details
SELECT 
    'All Shares' as section,
    ps.id,
    p.name as playlist_name,
    pr1.email as owner_email,
    ps.shared_with_email as recipient_email,
    ps.status,
    ps.can_rate,
    ps.accepted_at,
    CASE 
        WHEN ps.accepted_at IS NOT NULL THEN '✅ Active'
        WHEN ps.status = 'pending' THEN '⏳ Pending'
        ELSE ps.status
    END as share_status
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr1 ON pr1.id = ps.shared_by
ORDER BY ps.created_at DESC;

-- 2. Show playlist ratings by collaborators
SELECT 
    'Collaborator Ratings' as section,
    p.name as playlist_name,
    t.title as track_title,
    pr.email as rated_by,
    ptr.rating,
    ptr.created_at::date as rating_date
FROM playlist_track_ratings ptr
JOIN playlist_tracks pt ON pt.id = ptr.playlist_track_id
JOIN tracks t ON t.id = pt.track_id
JOIN playlists p ON p.id = pt.playlist_id
JOIN profiles pr ON pr.id = ptr.user_id
ORDER BY ptr.created_at DESC
LIMIT 20;

-- 3. Quick share creation helper
-- Uncomment and modify to create a test share:
/*
DO $$
DECLARE
    v_playlist_id UUID;
    v_owner_id UUID;
BEGIN
    -- Get first playlist owned by current user
    SELECT id, user_id INTO v_playlist_id, v_owner_id
    FROM playlists
    WHERE user_id = auth.uid()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_playlist_id IS NOT NULL THEN
        -- Create share (replace email)
        INSERT INTO playlist_shares (
            playlist_id,
            shared_by,
            shared_with_email,
            status,
            can_rate,
            can_edit
        ) VALUES (
            v_playlist_id,
            v_owner_id,
            'recipient@example.com',  -- CHANGE THIS
            'pending',
            true,
            false
        ) ON CONFLICT (playlist_id, shared_with_email) 
        DO UPDATE SET 
            status = 'pending',
            updated_at = NOW();
            
        RAISE NOTICE 'Share created for playlist %', v_playlist_id;
    ELSE
        RAISE NOTICE 'No playlists found for current user';
    END IF;
END $$;
*/

-- 4. Test auto-accept for current user
SELECT 
    'Pending Shares for You' as section,
    p.name as playlist_name,
    pr.email as shared_by,
    ps.created_at
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
    AND ps.status = 'pending';

-- Run auto-accept if needed
-- SELECT auto_accept_playlist_shares();