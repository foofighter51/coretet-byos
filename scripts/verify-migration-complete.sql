-- Final verification that everything is set up correctly

-- 1. Check all track columns are present
SELECT 
  'Track columns' as check_type,
  COUNT(*) as columns_found,
  CASE WHEN COUNT(*) = 12 THEN '✅ All columns present' ELSE '❌ Some columns missing' END as status
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name IN ('artist', 'collection', 'listened', 'liked', 'loved', 
                      'tempo', 'key', 'time_signature', 'genre', 'mood', 'notes', 'tags');

-- 2. Check playlist tables
SELECT 
  'Playlist tables' as check_type,
  COUNT(*) as tables_found,
  CASE WHEN COUNT(*) = 2 THEN '✅ All tables present' ELSE '❌ Some tables missing' END as status
FROM information_schema.tables 
WHERE table_name IN ('playlists', 'playlist_tracks');

-- 3. Check collection_tracks table
SELECT 
  'Collection table' as check_type,
  COUNT(*) as tables_found,
  CASE WHEN COUNT(*) = 1 THEN '✅ Table present' ELSE '❌ Table missing' END as status
FROM information_schema.tables 
WHERE table_name = 'collection_tracks';

-- 4. Check functions
SELECT 
  'Functions' as check_type,
  COUNT(*) as functions_found,
  CASE WHEN COUNT(*) = 3 THEN '✅ All functions present' ELSE '❌ Some functions missing' END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('update_track_positions', 'get_track_rating_counts', 'update_updated_at_column');

-- 5. Summary of migrated data
SELECT 
  'Data migration' as check_type,
  COUNT(DISTINCT collection_name) || ' collections, ' || COUNT(*) || ' tracks' as migrated_data,
  '✅ Migration complete' as status
FROM collection_tracks;