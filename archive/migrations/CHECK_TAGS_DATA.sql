-- Check tags data in tracks table
-- Run this in Supabase SQL editor

-- 1. Check if tags column exists and its data type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' AND column_name = 'tags';

-- 2. Check all tracks with tags
SELECT 
  id,
  name,
  tags,
  array_length(tags, 1) as tag_count
FROM tracks
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
ORDER BY created_at DESC;

-- 3. Get unique tags and their usage count
SELECT 
  tag,
  COUNT(*) as usage_count
FROM tracks, unnest(tags) as tag
WHERE tags IS NOT NULL
GROUP BY tag
ORDER BY usage_count DESC;

-- 4. Check the specific tracks mentioned that have tags
SELECT 
  id,
  name,
  tags,
  category,
  collection,
  created_at
FROM tracks
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
LIMIT 10;

-- 5. Debug: Check if tags are stored as text[] array
SELECT 
  id,
  name,
  tags,
  pg_typeof(tags) as tags_type
FROM tracks
WHERE tags IS NOT NULL
LIMIT 5;

-- 6. If tags are stored incorrectly (e.g., as JSON), we can check:
SELECT 
  id,
  name,
  tags::text as tags_as_text,
  CASE 
    WHEN tags::text LIKE '[%' THEN 'Looks like JSON array'
    WHEN tags::text LIKE '{%' THEN 'Looks like PostgreSQL array'
    ELSE 'Unknown format'
  END as format_check
FROM tracks
WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
LIMIT 5;