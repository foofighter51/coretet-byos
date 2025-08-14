-- CLARIFICATION: Two Different Rating Systems
-- This explains and fixes the rating table confusion

-- =====================================================
-- UNDERSTANDING THE TWO RATING SYSTEMS
-- =====================================================

/*
Your project has TWO different rating systems:

1. track_ratings table:
   - Uses collaborator_id
   - For external collaborators (not regular users)
   - Requires playlist_id (ratings are per-playlist)
   - Part of the collaborator authentication system

2. user_track_ratings table:
   - Uses user_id (auth.users)
   - For regular authenticated users
   - Global ratings (not playlist-specific)
   - Part of the main Supabase Auth system
*/

-- Check both tables
SELECT 'track_ratings (collaborator-based)' as table_name,
       string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'track_ratings'
UNION ALL
SELECT 'user_track_ratings (user-based)' as table_name,
       string_agg(column_name || ' (' || data_type || ')', ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'user_track_ratings';

-- =====================================================
-- FIX POLICIES FOR USER_TRACK_RATINGS
-- =====================================================

-- Drop any existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_track_ratings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON user_track_ratings', pol.policyname);
    END LOOP;
END $$;

-- Create proper policies for user_track_ratings

-- Users can view all ratings for tracks they can access
CREATE POLICY "Users can view ratings on accessible tracks" ON user_track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = user_track_ratings.track_id
            AND (
                -- Own tracks
                t.user_id = auth.uid()
                -- Or tracks in shared playlists
                OR EXISTS (
                    SELECT 1 FROM playlist_tracks pt
                    WHERE pt.track_id = t.id
                    AND EXISTS (
                        SELECT 1 FROM playlists p
                        WHERE p.id = pt.playlist_id
                        AND EXISTS (
                            SELECT 1 FROM playlist_shares ps
                            WHERE ps.playlist_id = p.id
                            AND ps.shared_with_email = auth.jwt()->>'email'
                            AND ps.status = 'active'
                        )
                    )
                )
            )
        )
    );

-- Users can insert ratings for tracks they can access
CREATE POLICY "Users can rate accessible tracks" ON user_track_ratings
    FOR INSERT TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM tracks t
            WHERE t.id = user_track_ratings.track_id
            AND (
                -- Own tracks
                t.user_id = auth.uid()
                -- Or tracks in shared playlists
                OR EXISTS (
                    SELECT 1 FROM playlist_tracks pt
                    WHERE pt.track_id = t.id
                    AND EXISTS (
                        SELECT 1 FROM playlists p
                        WHERE p.id = pt.playlist_id
                        AND EXISTS (
                            SELECT 1 FROM playlist_shares ps
                            WHERE ps.playlist_id = p.id
                            AND ps.shared_with_email = auth.jwt()->>'email'
                            AND ps.status = 'active'
                        )
                    )
                )
            )
        )
    );

-- Users can update their own ratings
CREATE POLICY "Users can update own ratings" ON user_track_ratings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Users can delete their own ratings
CREATE POLICY "Users can delete own ratings" ON user_track_ratings
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- VERIFY BOTH SYSTEMS
-- =====================================================

SELECT 
    'Policies for user_track_ratings:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'user_track_ratings'
ORDER BY policyname;

SELECT 
    'Policies for track_ratings:' as info;
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'track_ratings'
ORDER BY policyname;

-- =====================================================
-- RECOMMENDATION FOR YOUR APPLICATION
-- =====================================================

/*
Based on your code review, your React application uses:
- Regular Supabase Auth (auth.uid())
- The sharing system with authenticated users

Therefore, you should use the user_track_ratings table for ratings,
NOT the track_ratings table (which is for the separate collaborator system).

Update your application code to use 'user_track_ratings' table instead of 'track_ratings'.
*/

-- Test that policies work
SELECT 'Test user_track_ratings access' as test, COUNT(*) as count 
FROM user_track_ratings;

-- Example: How to rate a track as a regular user
/*
INSERT INTO user_track_ratings (track_id, user_id, rating)
VALUES (
    'some-track-uuid',
    auth.uid(),
    'liked'
)
ON CONFLICT (track_id, user_id) 
DO UPDATE SET 
    rating = EXCLUDED.rating,
    updated_at = NOW();
*/