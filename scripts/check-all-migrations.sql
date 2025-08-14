-- Comprehensive migration check
-- Run each query separately to see all results

-- 1. Check core tables
SELECT 
  'Core Tables' as category,
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM (
  VALUES 
    ('tracks'),
    ('playlists'),
    ('playlist_tracks'),
    ('collection_tracks'),
    ('collaborators'),
    ('collaborator_sessions'),
    ('playlist_shares'),
    ('track_ratings'),
    ('audio_sections'),
    ('arrangements'),
    ('arrangement_sections'),
    ('feedback')
) AS required(table_name)
LEFT JOIN information_schema.tables ist 
  ON ist.table_name = required.table_name 
  AND ist.table_schema = 'public'
ORDER BY required.table_name;

-- 2. Check track columns
SELECT 
  'Track Columns' as category,
  column_name,
  CASE WHEN isc.column_name IS NOT NULL THEN '✅ Exists' ELSE '❌ Missing' END as status
FROM (
  VALUES 
    ('artist'),
    ('collection'),
    ('listened'),
    ('liked'),
    ('loved'),
    ('tempo'),
    ('key'),
    ('time_signature'),
    ('genre'),
    ('mood'),
    ('notes'),
    ('tags')
) AS required(column_name)
LEFT JOIN information_schema.columns isc 
  ON isc.table_name = 'tracks' 
  AND isc.column_name = required.column_name
  AND isc.table_schema = 'public'
ORDER BY required.column_name;

-- 3. Check storage setup
SELECT 
  'Storage Buckets' as category,
  name as bucket_name,
  CASE WHEN public THEN '⚠️ Public' ELSE '✅ Private' END as status
FROM storage.buckets
WHERE name = 'audio-files';

-- 4. Check functions
SELECT 
  'Functions' as category,
  routine_name,
  '✅ Exists' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_track_positions', 'get_track_rating_counts', 'update_updated_at_column')
ORDER BY routine_name;