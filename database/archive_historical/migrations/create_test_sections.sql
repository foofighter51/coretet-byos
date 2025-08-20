-- Create test audio sections for existing tracks
-- This will add sections to your first 5 tracks so you can test the rating system

-- Create sections for tracks (adjust track_id as needed)
WITH first_tracks AS (
  SELECT id, name, duration, user_id
  FROM tracks
  WHERE deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 5
)
INSERT INTO audio_sections (track_id, name, start_time, end_time, color, created_by)
SELECT 
  t.id as track_id,
  section.name,
  section.start_time,
  section.end_time,
  section.color,
  t.user_id as created_by
FROM first_tracks t
CROSS JOIN (
  VALUES 
    ('Intro', 0, 30, '#FF6B6B'),
    ('Verse 1', 30, 90, '#4ECDC4'),
    ('Chorus', 90, 120, '#45B7D1'),
    ('Verse 2', 120, 180, '#4ECDC4'),
    ('Bridge', 180, 210, '#96CEB4'),
    ('Outro', 210, 240, '#FFEAA7')
) AS section(name, start_time, end_time, color)
WHERE NOT EXISTS (
  SELECT 1 FROM audio_sections 
  WHERE track_id = t.id
)
AND t.duration IS NOT NULL 
AND t.duration > 0;

-- Optional: Add some sample ratings to see aggregation working
-- This adds a few 5-star ratings to demonstrate the "loved sections" feature
WITH sample_sections AS (
  SELECT 
    s.id as section_id,
    c.id as category_id,
    s.created_by as user_id
  FROM audio_sections s
  CROSS JOIN rating_categories c
  WHERE c.name IN ('melody', 'vibe', 'production')
  AND s.name IN ('Chorus', 'Bridge')
  LIMIT 10
)
INSERT INTO section_ratings (section_id, category_id, user_id, rating_value, notes)
SELECT 
  section_id,
  category_id,
  user_id,
  5 as rating_value,
  'Great section!' as notes
FROM sample_sections
ON CONFLICT (section_id, category_id, user_id) DO NOTHING;

-- Return summary of what was created
SELECT 
  'Created sections for ' || COUNT(DISTINCT track_id) || ' tracks' as result
FROM audio_sections
WHERE created_at >= NOW() - INTERVAL '1 minute';