-- Check which migrations have been applied by looking for expected tables/columns

-- Check for playlists tables
SELECT 'playlists table' as checking, 
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playlists') as exists;

SELECT 'playlist_tracks table' as checking,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playlist_tracks') as exists;

-- Check for track metadata columns
SELECT 'artist column' as checking,
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tracks' AND column_name = 'artist') as exists;

SELECT 'collection column' as checking,
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tracks' AND column_name = 'collection') as exists;

SELECT 'rating fields' as checking,
       EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tracks' AND column_name = 'listened') as exists;

-- Check for collection ordering
SELECT 'collection_tracks table' as checking,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_tracks') as exists;

-- Check for collaborator tables
SELECT 'collaborators table' as checking,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collaborators') as exists;

-- Check for audio sections
SELECT 'audio_sections table' as checking,
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audio_sections') as exists;

-- Check track categories
SELECT 'Current track categories:' as info, 
       conname, 
       pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass 
AND conname LIKE '%category%';