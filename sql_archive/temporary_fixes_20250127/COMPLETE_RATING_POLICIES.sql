-- COMPLETE RATING POLICIES FOR BOTH SYSTEMS
-- This properly sets up policies for both rating tables

-- =====================================================
-- PART 1: USER_TRACK_RATINGS (for regular authenticated users)
-- =====================================================

-- Drop existing policies
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

-- Policy 1: Users can view all ratings for tracks they can access
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

-- Policy 2: Users can insert ratings for accessible tracks
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

-- Policy 3: Users can update their own ratings
CREATE POLICY "Users can update own ratings" ON user_track_ratings
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy 4: Users can delete their own ratings
CREATE POLICY "Users can delete own ratings" ON user_track_ratings
    FOR DELETE TO authenticated
    USING (user_id = auth.uid());

-- =====================================================
-- PART 2: TRACK_RATINGS (for collaborator system)
-- =====================================================

-- Drop existing policies
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'track_ratings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON track_ratings', pol.policyname);
    END LOOP;
END $$;

-- For the collaborator system, authenticated users (playlist owners) can view ratings
-- The actual rating insertion is handled by collaborators through a different auth system

-- Policy 1: Playlist owners can view all ratings on their playlists
CREATE POLICY "Playlist owners can view all ratings" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlists p
            WHERE p.id = track_ratings.playlist_id
            AND p.user_id = auth.uid()
        )
    );

-- Policy 2: Users can view ratings on playlists shared with them
CREATE POLICY "Users can view ratings on shared playlists" ON track_ratings
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM playlist_shares ps
            WHERE ps.playlist_id = track_ratings.playlist_id
            AND ps.shared_with_email = auth.jwt()->>'email'
            AND ps.status = 'active'
        )
    );

-- Note: INSERT/UPDATE/DELETE for track_ratings would be handled by the collaborator
-- authentication system, not regular Supabase Auth

-- =====================================================
-- PART 3: VERIFY POLICIES
-- =====================================================

SELECT 'user_track_ratings policies:' as table_info;
SELECT 
    policyname,
    cmd,
    length(qual) as policy_size
FROM pg_policies
WHERE tablename = 'user_track_ratings'
ORDER BY policyname;

SELECT 'track_ratings policies:' as table_info;
SELECT 
    policyname,
    cmd,
    length(qual) as policy_size
FROM pg_policies
WHERE tablename = 'track_ratings'
ORDER BY policyname;

-- =====================================================
-- PART 4: TEST QUERIES
-- =====================================================

-- Test 1: Can users access user_track_ratings?
SELECT 'user_track_ratings access test' as test, COUNT(*) as count 
FROM user_track_ratings;

-- Test 2: Can users access track_ratings for their playlists?
SELECT 'track_ratings access test' as test, COUNT(*) as count 
FROM track_ratings;

-- Test 3: Check if regular users can rate their own tracks
-- This should succeed
DO $$
BEGIN
    -- Try to insert a test rating (will rollback)
    INSERT INTO user_track_ratings (track_id, user_id, rating)
    SELECT 
        t.id,
        auth.uid(),
        'liked'
    FROM tracks t
    WHERE t.user_id = auth.uid()
    LIMIT 1;
    
    RAISE NOTICE 'Success: Users can rate their own tracks';
    
    -- Rollback the test insert
    RAISE EXCEPTION 'Rolling back test insert';
EXCEPTION
    WHEN OTHERS THEN
        IF SQLERRM LIKE '%Rolling back test insert%' THEN
            RAISE NOTICE 'Test completed successfully';
        ELSE
            RAISE NOTICE 'Error during test: %', SQLERRM;
        END IF;
END $$;

-- =====================================================
-- SUMMARY
-- =====================================================

/*
The two rating systems are now properly configured:

1. user_track_ratings:
   - Regular users can view ratings on all accessible tracks
   - Regular users can rate any track they can access
   - Regular users can update/delete their own ratings
   
2. track_ratings:
   - Playlist owners can view all ratings on their playlists
   - Users can view ratings on playlists shared with them
   - Actual rating insertion is handled by collaborator auth system

This maintains proper separation between the two systems while allowing
the expected functionality for each.
*/