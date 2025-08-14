-- Fix playlist sharing issues with revoked users
-- Run this in Supabase SQL editor

-- 1. First, let's see all playlist shares and their status
SELECT 
  ps.id,
  p.name as playlist_name,
  ps.shared_with_email,
  ps.status,
  ps.permission_level,
  ps.created_at,
  ps.revoked_at,
  ps.accepted_at,
  CASE 
    WHEN ps.status = 'revoked' THEN 'Revoked'
    WHEN ps.accepted_at IS NOT NULL THEN 'Accepted'
    WHEN ps.expires_at < NOW() THEN 'Expired'
    ELSE 'Pending'
  END as share_status
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
WHERE p.user_id = auth.uid()  -- Your playlists
ORDER BY ps.created_at DESC;

-- 2. Check for revoked shares specifically
SELECT 
  ps.id,
  p.name as playlist_name,
  ps.shared_with_email,
  ps.status,
  ps.revoked_at,
  'Revoked ' || EXTRACT(DAY FROM NOW() - ps.revoked_at) || ' days ago' as revoked_info
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
WHERE p.user_id = auth.uid()
  AND ps.status = 'revoked'
ORDER BY ps.revoked_at DESC;

-- 3. The issue: The app checks for ANY existing share (including revoked)
-- Let's see what the app sees when checking existing shares
SELECT 
  playlist_id,
  shared_with_email,
  COUNT(*) as share_count,
  STRING_AGG(status, ', ') as all_statuses
FROM playlist_shares
WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = auth.uid())
GROUP BY playlist_id, shared_with_email
HAVING COUNT(*) > 0;

-- 4. To fix: Delete revoked shares so users can be re-invited
-- First, see what would be deleted (safe preview)
SELECT 
  ps.id,
  p.name as playlist_name,
  ps.shared_with_email,
  ps.status,
  ps.revoked_at
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
WHERE p.user_id = auth.uid()
  AND ps.status = 'revoked';

-- 5. DELETE revoked shares (uncomment to run)
/*
DELETE FROM playlist_shares
WHERE id IN (
  SELECT ps.id
  FROM playlist_shares ps
  JOIN playlists p ON ps.playlist_id = p.id
  WHERE p.user_id = auth.uid()
    AND ps.status = 'revoked'
);
*/

-- 6. Alternative: If you want to delete specific revoked shares by email
/*
DELETE FROM playlist_shares
WHERE id IN (
  SELECT ps.id
  FROM playlist_shares ps
  JOIN playlists p ON ps.playlist_id = p.id
  WHERE p.user_id = auth.uid()
    AND ps.status = 'revoked'
    AND ps.shared_with_email = 'collaborator@email.com'  -- Replace with actual email
);
*/

-- 7. After cleanup, verify the user can now be re-invited
SELECT 
  p.name as playlist_name,
  ps.shared_with_email,
  ps.status,
  ps.created_at
FROM playlist_shares ps
JOIN playlists p ON ps.playlist_id = p.id
WHERE p.user_id = auth.uid()
  AND ps.shared_with_email = 'collaborator@email.com'  -- Replace with actual email
ORDER BY ps.created_at DESC;