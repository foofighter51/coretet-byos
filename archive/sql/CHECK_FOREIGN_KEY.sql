-- CHECK FOREIGN KEY RELATIONSHIP
-- Verify the playlist_shares -> playlists relationship

-- 1. Check foreign key constraints
SELECT 
    conname as constraint_name,
    conrelid::regclass as table_name,
    a.attname as column_name,
    confrelid::regclass as foreign_table,
    af.attname as foreign_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'playlist_shares'::regclass
    AND c.contype = 'f';

-- 2. Test the query the app is using
SELECT 
    'App Query Test' as section,
    ps.id,
    ps.playlist_id,
    ps.status,
    ps.created_at,
    ps.invited_at,
    p.id as playlist_id_check,
    p.name as playlist_name,
    p.user_id,
    COUNT(pt.id) as track_count
FROM playlist_shares ps
LEFT JOIN playlists p ON p.id = ps.playlist_id
LEFT JOIN playlist_tracks pt ON pt.playlist_id = p.id
WHERE LOWER(ps.shared_with_email) = LOWER('eric@exleycorp.com')
    AND ps.status IN ('active', 'pending')
GROUP BY ps.id, ps.playlist_id, ps.status, ps.created_at, ps.invited_at, p.id, p.name, p.user_id;

-- 3. Check if the playlist exists
SELECT 
    'Playlist Exists?' as section,
    p.*
FROM playlists p
WHERE p.id IN (
    SELECT playlist_id 
    FROM playlist_shares 
    WHERE LOWER(shared_with_email) = LOWER('eric@exleycorp.com')
);