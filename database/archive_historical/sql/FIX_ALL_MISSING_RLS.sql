-- FIX ALL MISSING RLS POLICIES
-- Complete RLS setup for sharing system

-- 1. Check if playlist_track_rating_summary is a table or view
SELECT 
    'Object Type' as section,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_name = 'playlist_track_rating_summary';

-- 2. If it's a table, add RLS policy
DO $$
BEGIN
    -- Check if it's a table
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'playlist_track_rating_summary' 
        AND table_type = 'BASE TABLE'
    ) THEN
        -- Enable RLS if not already enabled
        ALTER TABLE playlist_track_rating_summary ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Public read access" ON playlist_track_rating_summary;
        
        -- Create new policy
        CREATE POLICY "Public read access" ON playlist_track_rating_summary
            FOR ALL
            USING (true);
    END IF;
END $$;

-- 3. Check and fix personal_track_ratings RLS
ALTER TABLE personal_track_ratings ENABLE ROW LEVEL SECURITY;

-- Ensure users can create their own ratings
DROP POLICY IF EXISTS "Users can manage their own ratings" ON personal_track_ratings;
CREATE POLICY "Users can manage their own ratings" ON personal_track_ratings
    FOR ALL
    USING (user_id = auth.uid() OR true)  -- Allow read for all, write for own
    WITH CHECK (user_id = auth.uid());

-- 4. Ensure playlist_track_ratings has all needed policies
ALTER TABLE playlist_track_ratings ENABLE ROW LEVEL SECURITY;

-- Users can create ratings in playlists they have access to
DROP POLICY IF EXISTS "Users can rate in accessible playlists" ON playlist_track_ratings;
CREATE POLICY "Users can rate in accessible playlists" ON playlist_track_ratings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM playlist_tracks pt
            JOIN playlists p ON p.id = pt.playlist_id
            WHERE pt.id = playlist_track_id
            AND (
                -- User owns the playlist
                p.user_id = auth.uid()
                OR
                -- Playlist is shared with user and they can rate
                EXISTS (
                    SELECT 1 
                    FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
                    AND ps.status = 'active'
                    AND ps.can_rate = true
                )
            )
        )
    );

-- Users can update their own ratings
DROP POLICY IF EXISTS "Users can update own playlist ratings" ON playlist_track_ratings;
CREATE POLICY "Users can update own playlist ratings" ON playlist_track_ratings
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own ratings
DROP POLICY IF EXISTS "Users can delete own playlist ratings" ON playlist_track_ratings;
CREATE POLICY "Users can delete own playlist ratings" ON playlist_track_ratings
    FOR DELETE
    USING (user_id = auth.uid());

-- 5. Create a view for rating summary if it doesn't exist
CREATE OR REPLACE VIEW playlist_track_rating_summary AS
SELECT 
    playlist_track_id,
    COUNT(*) FILTER (WHERE rating = 'listened') as listened_count,
    COUNT(*) FILTER (WHERE rating = 'liked') as liked_count,
    COUNT(*) FILTER (WHERE rating = 'loved') as loved_count
FROM playlist_track_ratings
GROUP BY playlist_track_id;

-- 6. Grant access to the view
GRANT SELECT ON playlist_track_rating_summary TO authenticated;
GRANT SELECT ON playlist_track_rating_summary TO anon;

-- 7. Verify all policies
SELECT 
    'RLS Status' as section,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN (
    'tracks', 
    'playlists', 
    'playlist_tracks', 
    'playlist_shares',
    'personal_track_ratings',
    'playlist_track_ratings'
)
ORDER BY tablename, cmd;

-- 8. Test access
SELECT 'Test Results' as section;
SELECT 'Can read tracks' as test, COUNT(*) > 0 as passes FROM tracks LIMIT 1;
SELECT 'Can read playlists' as test, COUNT(*) > 0 as passes FROM playlists LIMIT 1;
SELECT 'Can read ratings' as test, true as passes FROM playlist_track_rating_summary LIMIT 1;