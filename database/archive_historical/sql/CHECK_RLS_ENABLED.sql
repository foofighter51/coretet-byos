-- CHECK IF RLS IS ENABLED
-- Verify Row Level Security is turned on for all tables

-- 1. Check RLS status on all relevant tables
SELECT 
    'RLS Status' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
    'tracks',
    'playlists', 
    'playlist_tracks',
    'playlist_shares',
    'personal_track_ratings',
    'playlist_track_ratings'
)
ORDER BY tablename;

-- 2. Enable RLS on any tables where it's off
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename IN (
            'tracks',
            'playlists', 
            'playlist_tracks',
            'playlist_shares',
            'personal_track_ratings',
            'playlist_track_ratings'
        )
        AND NOT rowsecurity
    ) LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Enabled RLS on table: %', r.tablename;
    END LOOP;
END $$;

-- 3. Check again after enabling
SELECT 
    'RLS Status After Fix' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN (
    'tracks',
    'playlists', 
    'playlist_tracks',
    'playlist_shares',
    'personal_track_ratings',
    'playlist_track_ratings'
)
ORDER BY tablename;

-- 4. Force recreate the most important policy for debugging
DROP POLICY IF EXISTS "Public read for debugging" ON personal_track_ratings;
CREATE POLICY "Public read for debugging" ON personal_track_ratings
    FOR SELECT
    USING (true);

-- 5. Test if we can read now
SELECT 
    'Can Read Test' as section,
    'personal_track_ratings' as table_name,
    COUNT(*) as row_count
FROM personal_track_ratings
LIMIT 1;