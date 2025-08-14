-- URGENT FIX: Restore track visibility
-- The RLS policy is blocking all tracks - let's fix it

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can view their own non-deleted tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view their own deleted tracks" ON tracks;

-- Create a single, working policy that shows all non-deleted tracks
CREATE POLICY "Users can view own tracks" 
ON tracks FOR SELECT 
USING (
  auth.uid() = user_id 
  AND (deleted_at IS NULL OR deleted_at IS NULL)
);

-- Verify tracks are visible again
SELECT COUNT(*) as visible_tracks 
FROM tracks 
WHERE user_id = auth.uid();

-- Check if any tracks were accidentally marked as deleted
SELECT COUNT(*) as accidentally_deleted 
FROM tracks 
WHERE user_id = auth.uid() 
AND deleted_at IS NOT NULL;

-- If there are accidentally deleted tracks, restore them:
-- UPDATE tracks SET deleted_at = NULL WHERE user_id = auth.uid() AND deleted_at IS NOT NULL;