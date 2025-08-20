-- CHECK ERICEXLEY'S DATA WITH ACTUAL USER ID
-- Using the confirmed user ID: 55a58df9-3698-4973-9add-b82d76cde766

-- Check your tracks
SELECT 
    COUNT(*) as track_count,
    MIN(created_at) as first_track,
    MAX(created_at) as latest_track
FROM tracks
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- Check your playlists
SELECT 
    COUNT(*) as playlist_count
FROM playlists
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- Check your tags
SELECT 
    COUNT(*) as tag_count
FROM tags
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766';

-- Sample of your tracks to verify they exist
SELECT 
    id,
    name,
    artist,
    album,
    visibility,
    created_at
FROM tracks
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766'
ORDER BY created_at DESC
LIMIT 10;

-- Sample of your playlists
SELECT 
    id,
    name,
    description,
    visibility,
    created_at
FROM playlists
WHERE user_id = '55a58df9-3698-4973-9add-b82d76cde766'
ORDER BY created_at DESC
LIMIT 10;