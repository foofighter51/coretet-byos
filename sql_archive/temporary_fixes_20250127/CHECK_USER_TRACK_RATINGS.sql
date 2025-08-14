-- CHECK USER_TRACK_RATINGS TABLE AND POLICIES

-- 1. Verify the table exists
SELECT 
    'Table exists' as check_type,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_track_ratings'
    ) as result;

-- 2. Check if RLS is enabled
SELECT 
    'RLS enabled' as check_type,
    relrowsecurity as result
FROM pg_class
WHERE relname = 'user_track_ratings';

-- 3. Check existing policies
SELECT 
    'Current policies on user_track_ratings:' as info;
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_track_ratings'
ORDER BY policyname;

-- 4. If no policies exist, check for any errors in policy creation
-- Let's create them one by one to identify any issues

-- First, drop any existing policies
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

-- 5. Enable RLS if not already enabled
ALTER TABLE user_track_ratings ENABLE ROW LEVEL SECURITY;

-- 6. Create policies one by one with error handling

-- Policy 1: View ratings
DO $$
BEGIN
    CREATE POLICY "Users can view ratings on accessible tracks" ON user_track_ratings
        FOR SELECT TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM tracks t
                WHERE t.id = user_track_ratings.track_id
                AND (
                    t.user_id = auth.uid()
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
    RAISE NOTICE 'Policy 1 created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating Policy 1: %', SQLERRM;
END $$;

-- Policy 2: Insert ratings
DO $$
BEGIN
    CREATE POLICY "Users can rate accessible tracks" ON user_track_ratings
        FOR INSERT TO authenticated
        WITH CHECK (
            user_id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM tracks t
                WHERE t.id = user_track_ratings.track_id
                AND (
                    t.user_id = auth.uid()
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
    RAISE NOTICE 'Policy 2 created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating Policy 2: %', SQLERRM;
END $$;

-- Policy 3: Update ratings
DO $$
BEGIN
    CREATE POLICY "Users can update own ratings" ON user_track_ratings
        FOR UPDATE TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
    RAISE NOTICE 'Policy 3 created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating Policy 3: %', SQLERRM;
END $$;

-- Policy 4: Delete ratings
DO $$
BEGIN
    CREATE POLICY "Users can delete own ratings" ON user_track_ratings
        FOR DELETE TO authenticated
        USING (user_id = auth.uid());
    RAISE NOTICE 'Policy 4 created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating Policy 4: %', SQLERRM;
END $$;

-- 7. Verify final state
SELECT 
    'Final policy count' as check_type,
    COUNT(*) as count
FROM pg_policies
WHERE tablename = 'user_track_ratings';

-- 8. List all policies
SELECT 
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename IN ('user_track_ratings', 'track_ratings')
ORDER BY tablename, policyname;