-- FIX VIEW PERMISSIONS
-- Grant access to views for the sharing system

-- 1. Check what playlist_track_rating_summary is
SELECT 
    'Object Info' as section,
    table_name,
    table_type,
    is_insertable_into
FROM information_schema.tables
WHERE table_name = 'playlist_track_rating_summary';

-- 2. Grant permissions on the view
GRANT SELECT ON playlist_track_rating_summary TO authenticated;
GRANT SELECT ON playlist_track_rating_summary TO anon;
GRANT SELECT ON playlist_track_rating_summary TO service_role;

-- 3. Also grant on the underlying table to ensure the view works
GRANT SELECT ON playlist_track_ratings TO authenticated;
GRANT SELECT ON playlist_track_ratings TO anon;

-- 4. Fix personal_track_ratings RLS
ALTER TABLE personal_track_ratings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies
DROP POLICY IF EXISTS "Users can view all personal ratings" ON personal_track_ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON personal_track_ratings;

CREATE POLICY "Users can view all personal ratings" ON personal_track_ratings
    FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own personal ratings" ON personal_track_ratings
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 5. Fix playlist_track_ratings policies for write operations
DROP POLICY IF EXISTS "Users can rate in accessible playlists" ON playlist_track_ratings;
DROP POLICY IF EXISTS "Users can update own playlist ratings" ON playlist_track_ratings;
DROP POLICY IF EXISTS "Users can delete own playlist ratings" ON playlist_track_ratings;

-- Insert policy
CREATE POLICY "Users can rate in accessible playlists" ON playlist_track_ratings
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        EXISTS (
            SELECT 1 
            FROM playlist_tracks pt
            JOIN playlists p ON p.id = pt.playlist_id
            WHERE pt.id = playlist_track_id
            AND (
                p.user_id = auth.uid()
                OR
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

-- Update policy
CREATE POLICY "Users can update own playlist ratings" ON playlist_track_ratings
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Delete policy
CREATE POLICY "Users can delete own playlist ratings" ON playlist_track_ratings
    FOR DELETE
    USING (user_id = auth.uid());

-- 6. Test permissions
SELECT 'Permission Test' as section;

-- Test view access
SELECT 
    'View Access' as test,
    COUNT(*) as count
FROM playlist_track_rating_summary;

-- Test rating table access
SELECT 
    'Rating Table Access' as test,
    COUNT(*) as count
FROM playlist_track_ratings;

-- 7. Show current policies
SELECT 
    'Current Policies' as section,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('personal_track_ratings', 'playlist_track_ratings')
ORDER BY tablename, cmd;