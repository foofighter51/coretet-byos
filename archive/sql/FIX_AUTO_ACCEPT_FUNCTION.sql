-- FIX AUTO ACCEPT FUNCTION
-- Update the function to use 'status' instead of 'share_status'

-- Drop and recreate the function with correct column name
CREATE OR REPLACE FUNCTION auto_accept_playlist_shares()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE playlist_shares
  SET 
    status = 'accepted',  -- Changed from share_status to status
    accepted_at = NOW()
  WHERE 
    LOWER(shared_with_email) = LOWER(auth.email())
    AND status = 'pending';  -- Changed from share_status to status
END;
$$;

-- Test the function
SELECT auto_accept_playlist_shares();

-- Verify any pending shares were accepted
SELECT 
    'Share Status After Auto-Accept' as result,
    shared_with_email,
    status,
    accepted_at,
    playlist_id
FROM playlist_shares
WHERE LOWER(shared_with_email) = LOWER(auth.email())
ORDER BY created_at DESC;