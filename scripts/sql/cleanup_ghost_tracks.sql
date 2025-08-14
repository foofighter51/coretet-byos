-- First, let's see what we have
SELECT 
  id,
  name,
  file_name,
  duration,
  created_at,
  storage_path
FROM tracks
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- Check for tracks with no duration (likely failed uploads)
SELECT COUNT(*) as ghost_tracks
FROM tracks
WHERE user_id = auth.uid()
AND (duration IS NULL OR duration = 0);

-- Delete tracks with no duration (ghost uploads)
-- UNCOMMENT THE LINES BELOW TO DELETE GHOST TRACKS
-- DELETE FROM tracks
-- WHERE user_id = auth.uid()
-- AND (duration IS NULL OR duration = 0);

-- Alternative: Delete duplicate tracks (keep the most recent one with duration)
-- This query keeps the newest track with duration for each file_name
-- UNCOMMENT TO RUN
-- DELETE FROM tracks
-- WHERE user_id = auth.uid()
-- AND id NOT IN (
--   SELECT DISTINCT ON (file_name) id
--   FROM tracks
--   WHERE user_id = auth.uid()
--   ORDER BY file_name, 
--     CASE WHEN duration IS NOT NULL AND duration > 0 THEN 0 ELSE 1 END,
--     created_at DESC
-- );