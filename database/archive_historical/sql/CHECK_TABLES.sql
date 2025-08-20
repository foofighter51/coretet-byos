-- CHECK EXISTING TABLES
-- Run this to see what tables actually exist in the database

-- List all tables in public schema
SELECT 
    'Tables in Database' as section,
    table_name,
    CASE 
        WHEN table_name LIKE '%rating%' THEN '⭐ Rating Table'
        WHEN table_name LIKE '%playlist%' THEN '📋 Playlist Table'
        WHEN table_name LIKE '%track%' THEN '🎵 Track Table'
        WHEN table_name LIKE '%profile%' THEN '👤 User Table'
        ELSE '📦 Other Table'
    END as table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check for views
SELECT 
    'Views in Database' as section,
    table_name as view_name
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check specific tables we expect
SELECT 
    'Expected Tables Check' as section,
    table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = expected.table_name
        ) THEN '✅ Exists'
        ELSE '❌ Missing'
    END as status
FROM (
    VALUES 
        ('tracks'),
        ('playlists'),
        ('playlist_tracks'),
        ('playlist_shares'),
        ('profiles'),
        ('personal_track_ratings'),
        ('playlist_track_ratings')
) AS expected(table_name)
ORDER BY 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = expected.table_name
        ) THEN 1 
        ELSE 0 
    END DESC,
    table_name;