-- FIX ALL STATUS CONSTRAINTS
-- Find and update all constraints on the status column

-- 1. Find all constraints on playlist_shares
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'playlist_shares'::regclass
    AND contype = 'c';

-- 2. Drop ALL check constraints on playlist_shares
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'playlist_shares'::regclass
            AND contype = 'c'
    ) LOOP
        EXECUTE 'ALTER TABLE playlist_shares DROP CONSTRAINT ' || quote_ident(r.conname);
    END LOOP;
END $$;

-- 3. Add the correct constraint
ALTER TABLE playlist_shares 
ADD CONSTRAINT playlist_shares_status_check 
CHECK (status IN ('pending', 'active', 'accepted', 'declined', 'revoked'));

-- 4. Now update existing 'accepted' to 'active'
UPDATE playlist_shares 
SET status = 'active' 
WHERE status = 'accepted';

-- 5. Update the auto-accept function
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE playlist_shares
  SET 
    status = 'active',
    accepted_at = NOW()
  WHERE 
    LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'pending';
END;
$$;

-- 6. Run auto-accept
SELECT auto_accept_playlist_shares();

-- 7. Verify current status values
SELECT 
    'Status Distribution' as section,
    status, 
    COUNT(*) as count
FROM playlist_shares 
GROUP BY status;

-- 8. Check shares for current user
SELECT 
    'Your Shared Playlists' as section,
    ps.status,
    p.name as playlist_name,
    pr.email as shared_by
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
JOIN profiles pr ON pr.id = ps.shared_by
WHERE LOWER(ps.shared_with_email) = LOWER(auth.email());