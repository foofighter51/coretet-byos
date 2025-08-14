-- FIX RATING TABLE RLS POLICIES
-- Allow users to access ratings in shared playlists

-- 1. Fix personal_track_ratings policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing SELECT policies
    FOR r IN (
        SELECT polname
        FROM pg_policy
        WHERE polrelid = 'personal_track_ratings'::regclass
            AND polcmd = 'r'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON personal_track_ratings';
    END LOOP;
END $$;

CREATE POLICY "Users can view all personal ratings" ON personal_track_ratings
    FOR SELECT
    USING (true);  -- Public read for aggregation purposes

-- 2. Fix playlist_track_ratings policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing SELECT policies
    FOR r IN (
        SELECT polname
        FROM pg_policy
        WHERE polrelid = 'playlist_track_ratings'::regclass
            AND polcmd = 'r'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON playlist_track_ratings';
    END LOOP;
END $$;

CREATE POLICY "Users can view ratings in accessible playlists" ON playlist_track_ratings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM playlist_tracks pt
            JOIN playlists p ON p.id = pt.playlist_id
            WHERE pt.id = playlist_track_ratings.playlist_track_id
            AND (
                -- User owns the playlist
                p.user_id = auth.uid()
                OR
                -- Playlist is shared with user
                EXISTS (
                    SELECT 1 
                    FROM playlist_shares ps
                    WHERE ps.playlist_id = p.id
                    AND LOWER(ps.shared_with_email) = LOWER(auth.email())
                    AND ps.status = 'active'
                )
            )
        )
    );

-- 3. Fix playlist_track_rating_summary view/table policies
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop existing SELECT policies
    FOR r IN (
        SELECT polname
        FROM pg_policy
        WHERE polrelid = 'playlist_track_rating_summary'::regclass
            AND polcmd = 'r'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.polname) || ' ON playlist_track_rating_summary';
    END LOOP;
EXCEPTION
    WHEN undefined_table THEN
        -- Table doesn't exist, that's ok
        NULL;
END $$;

-- Create policy if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'playlist_track_rating_summary') THEN
        CREATE POLICY "Public read for summaries" ON playlist_track_rating_summary
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- 4. Verify policies
SELECT 
    'Updated Policies' as section,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('personal_track_ratings', 'playlist_track_ratings', 'playlist_track_rating_summary')
    AND cmd = 'SELECT'
ORDER BY tablename;