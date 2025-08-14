-- STEP 1: BACKUP YOUR DATA
-- Run this first to save your tracks and playlists

-- 1. Check what we're backing up
SELECT COUNT(*) as track_count FROM tracks WHERE user_id = auth.uid();
SELECT COUNT(*) as playlist_count FROM playlists WHERE user_id = auth.uid();

-- 2. Create backup tables
CREATE TABLE IF NOT EXISTS backup_tracks_20250127 AS 
SELECT * FROM tracks WHERE user_id = auth.uid();

CREATE TABLE IF NOT EXISTS backup_playlists_20250127 AS 
SELECT * FROM playlists WHERE user_id = auth.uid();

CREATE TABLE IF NOT EXISTS backup_playlist_tracks_20250127 AS 
SELECT pt.* FROM playlist_tracks pt
JOIN playlists p ON p.id = pt.playlist_id
WHERE p.user_id = auth.uid();

-- 3. Verify backups
SELECT 
    'Tracks backed up' as item,
    COUNT(*) as count 
FROM backup_tracks_20250127
UNION ALL
SELECT 
    'Playlists backed up' as item,
    COUNT(*) as count 
FROM backup_playlists_20250127
UNION ALL
SELECT 
    'Playlist tracks backed up' as item,
    COUNT(*) as count 
FROM backup_playlist_tracks_20250127;

-- 4. Export file list for reference
SELECT 
    name,
    file_name,
    storage_path,
    category,
    tags
FROM backup_tracks_20250127
ORDER BY created_at DESC;