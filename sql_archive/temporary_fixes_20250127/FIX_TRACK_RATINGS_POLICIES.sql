-- FIX TRACK_RATINGS POLICIES
-- This handles the track_ratings table whether it uses user_id or collaborator_id

-- First, check the actual structure of track_ratings table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'track_ratings'
ORDER BY ordinal_position;

-- Drop existing policies on track_ratings
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

-- Check if we have user_id or collaborator_id column
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_collaborator_id BOOLEAN;
BEGIN
    -- Check for user_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'track_ratings' 
        AND column_name = 'user_id'
    ) INTO has_user_id;
    
    -- Check for collaborator_id column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'track_ratings' 
        AND column_name = 'collaborator_id'
    ) INTO has_collaborator_id;
    
    IF has_user_id THEN
        -- Create policies for user_id based structure
        RAISE NOTICE 'Creating policies for user_id based track_ratings table';
        
        -- Users can view all ratings for tracks they can access
        EXECUTE '
        CREATE POLICY "Users can view ratings for accessible tracks" ON track_ratings
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM tracks t
                    WHERE t.id = track_ratings.track_id
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
                                    AND ps.shared_with_email = auth.jwt()->>''email''
                                    AND ps.status = ''active''
                                )
                            )
                        )
                    )
                )
            )';
        
        -- Users can rate tracks they can access
        EXECUTE '
        CREATE POLICY "Users can rate tracks they can access" ON track_ratings
            FOR INSERT TO authenticated
            WITH CHECK (
                track_ratings.user_id = auth.uid()
                AND EXISTS (
                    SELECT 1 FROM tracks t
                    WHERE t.id = track_ratings.track_id
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
                                    AND ps.shared_with_email = auth.jwt()->>''email''
                                    AND ps.status = ''active''
                                )
                            )
                        )
                    )
                )
            )';
        
        -- Users can update own ratings
        EXECUTE '
        CREATE POLICY "Users can update own ratings" ON track_ratings
            FOR UPDATE TO authenticated
            USING (track_ratings.user_id = auth.uid())
            WITH CHECK (track_ratings.user_id = auth.uid())';
        
        -- Users can delete own ratings
        EXECUTE '
        CREATE POLICY "Users can delete own ratings" ON track_ratings
            FOR DELETE TO authenticated
            USING (track_ratings.user_id = auth.uid())';
            
    ELSIF has_collaborator_id THEN
        -- Create policies for collaborator_id based structure
        RAISE NOTICE 'Creating policies for collaborator_id based track_ratings table';
        
        -- This structure requires different policies based on collaborator system
        EXECUTE '
        CREATE POLICY "Collaborators can view ratings in shared playlists" ON track_ratings
            FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM collaborators c
                    WHERE c.id = track_ratings.collaborator_id
                    AND c.user_id = auth.uid()
                    AND EXISTS (
                        SELECT 1 FROM playlist_shares ps
                        WHERE ps.playlist_id = track_ratings.playlist_id
                        AND ps.shared_with_email = c.email
                        AND ps.status = ''active''
                    )
                )
            )';
        
        -- Add more collaborator-based policies as needed
        
    ELSE
        RAISE EXCEPTION 'track_ratings table structure not recognized - missing both user_id and collaborator_id columns';
    END IF;
END $$;

-- Verify the created policies
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'track_ratings'
ORDER BY policyname;

-- Test query to see if policies work
-- This should not error out
SELECT COUNT(*) as rating_count FROM track_ratings;