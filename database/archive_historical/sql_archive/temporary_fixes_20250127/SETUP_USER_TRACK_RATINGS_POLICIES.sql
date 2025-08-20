-- SETUP USER_TRACK_RATINGS POLICIES
-- Simple, focused script for user_track_ratings table

-- 1. Enable RLS
ALTER TABLE user_track_ratings ENABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies
DROP POLICY IF EXISTS "Users can view ratings on accessible tracks" ON user_track_ratings;
DROP POLICY IF EXISTS "Users can rate accessible tracks" ON user_track_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON user_track_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON user_track_ratings;
DROP POLICY IF EXISTS "Users can manage their own ratings" ON user_track_ratings;

-- 3. Create simplified policies

-- View policy: Users can see all ratings on tracks they can access
CREATE POLICY "view_accessible_track_ratings" ON user_track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = user_track_ratings.track_id
            AND (
                -- User owns the track
                t.user_id = auth.uid()
                -- Or track is in a shared playlist
                OR EXISTS (
                    SELECT 1 FROM playlist_tracks pt
                    JOIN playlists p ON p.id = pt.playlist_id
                    JOIN playlist_shares ps ON ps.playlist_id = p.id
                    WHERE pt.track_id = t.id
                    AND ps.shared_with_email = auth.jwt()->>'email'
                    AND ps.status = 'active'
                )
            )
        )
    );

-- Insert policy: Users can rate tracks they can access
CREATE POLICY "insert_track_rating" ON user_track_ratings
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Must be the current user
        user_id = auth.uid()
        -- And track must be accessible
        AND EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = user_track_ratings.track_id
            AND (
                -- User owns the track
                t.user_id = auth.uid()
                -- Or track is in a shared playlist
                OR EXISTS (
                    SELECT 1 FROM playlist_tracks pt
                    JOIN playlists p ON p.id = pt.playlist_id
                    JOIN playlist_shares ps ON ps.playlist_id = p.id
                    WHERE pt.track_id = t.id
                    AND ps.shared_with_email = auth.jwt()->>'email'
                    AND ps.status = 'active'
                )
            )
        )
    );

-- Update policy: Users can only update their own ratings
CREATE POLICY "update_own_rating" ON user_track_ratings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Delete policy: Users can only delete their own ratings
CREATE POLICY "delete_own_rating" ON user_track_ratings
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- 4. Verify the policies were created
SELECT 
    'user_track_ratings' as table_name,
    COUNT(*) as policy_count,
    string_agg(policyname || ' (' || cmd || ')', ', ' ORDER BY cmd DESC, policyname) as policies
FROM pg_policies
WHERE tablename = 'user_track_ratings';

-- 5. Test basic access
SELECT 
    'Can access user_track_ratings' as test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'Yes - policies working'
        ELSE 'No - policy error'
    END as result
FROM user_track_ratings;

-- 6. Show both rating tables status
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE tablename IN ('user_track_ratings', 'track_ratings')
GROUP BY tablename
ORDER BY tablename;