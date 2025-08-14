-- FIX STATUS VALUES
-- The frontend expects 'active' but database has 'accepted'

-- 1. First check current status values
SELECT DISTINCT status, COUNT(*) 
FROM playlist_shares 
GROUP BY status;

-- 2. Update the CHECK constraint to allow 'active'
ALTER TABLE playlist_shares 
DROP CONSTRAINT IF EXISTS playlist_shares_status_check;

ALTER TABLE playlist_shares 
ADD CONSTRAINT playlist_shares_status_check 
CHECK (status IN ('pending', 'active', 'accepted', 'declined', 'revoked'));

-- 3. Update existing 'accepted' to 'active'
UPDATE playlist_shares 
SET status = 'active' 
WHERE status = 'accepted';

-- 4. Update the auto-accept function to use 'active'
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE playlist_shares
  SET 
    status = 'active',  -- Changed from 'accepted' to 'active'
    accepted_at = NOW()
  WHERE 
    LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'pending';
END;
$$;

-- 5. Run auto-accept again to fix any pending shares
SELECT auto_accept_playlist_shares();

-- 6. Verify the fix
SELECT 
    'Share Status After Fix' as result,
    shared_with_email,
    status,
    accepted_at,
    playlist_id
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email())
ORDER BY created_at DESC;

-- 7. Check what the recipient should see
SELECT 
    'Shares Visible to You' as section,
    ps.id,
    ps.playlist_id,
    ps.status,
    p.name as playlist_name,
    pr.email as shared_by
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email())
  AND ps.status = 'active';