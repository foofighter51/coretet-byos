-- Part 3: Migrate existing collection data
-- Run this third

-- Populate collection_tracks from existing tracks with collections
INSERT INTO collection_tracks (user_id, collection_name, track_id, position)
SELECT 
  t.user_id,
  t.collection,
  t.id,
  ROW_NUMBER() OVER (PARTITION BY t.user_id, t.collection ORDER BY t.created_at) - 1 as position
FROM tracks t
WHERE t.collection IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM collection_tracks ct 
    WHERE ct.user_id = t.user_id 
      AND ct.collection_name = t.collection 
      AND ct.track_id = t.id
  )
ORDER BY t.user_id, t.collection, t.created_at;

-- Show migration results
SELECT 
  'Migration Summary' as info,
  COUNT(DISTINCT collection_name) as collections_migrated,
  COUNT(*) as tracks_migrated
FROM collection_tracks;