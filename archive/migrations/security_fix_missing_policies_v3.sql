-- SECURITY FIX: Add RLS policies for tables with RLS enabled but no policies (Version 3)
-- Generated: 2025-08-09
-- Priority: MEDIUM - These tables have RLS but no policies, blocking all access

-- First, let's check which tables exist and their columns
DO $$
DECLARE
    table_info RECORD;
BEGIN
    RAISE NOTICE 'Checking table structures...';
    
    FOR table_info IN 
        SELECT 
            t.tablename,
            array_agg(c.column_name) as columns
        FROM pg_tables t
        JOIN information_schema.columns c 
            ON c.table_name = t.tablename 
            AND c.table_schema = t.schemaname
        WHERE t.schemaname = 'public'
        AND t.tablename IN (
            'arrangement_sections',
            'arrangements', 
            'audio_sections',
            'collaborator_sessions',
            'collection_track_order',
            'collection_tracks',
            'feedback',
            'project_collaborators',
            'song_versions',
            'version_iterations',
            'version_metadata'
        )
        GROUP BY t.tablename
    LOOP
        RAISE NOTICE 'Table %: columns = %', table_info.tablename, table_info.columns;
    END LOOP;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
    DROP POLICY IF EXISTS "Users can manage own arrangement sections" ON public.arrangement_sections;
    DROP POLICY IF EXISTS "Users can manage own arrangements" ON public.arrangements;
    DROP POLICY IF EXISTS "Users can manage own audio sections" ON public.audio_sections;
    DROP POLICY IF EXISTS "Users can view own collaborator sessions" ON public.collaborator_sessions;
    DROP POLICY IF EXISTS "Users can manage own collection track order" ON public.collection_track_order;
    DROP POLICY IF EXISTS "Users can manage own collection tracks" ON public.collection_tracks;
    DROP POLICY IF EXISTS "Users can manage own feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Project members can view collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners can add collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners can update collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners can remove collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Users can manage own song versions" ON public.song_versions;
    DROP POLICY IF EXISTS "Users can manage own version iterations" ON public.version_iterations;
    DROP POLICY IF EXISTS "Users can manage own version metadata" ON public.version_metadata;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies could not be dropped: %', SQLERRM;
END $$;

-- Create policies only for tables that exist with proper column references
DO $$
BEGIN
    -- 1. ARRANGEMENT_SECTIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'arrangement_sections') THEN
        CREATE POLICY "Users can manage own arrangement sections" ON public.arrangement_sections
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.arrangements a
                    JOIN public.tracks t ON t.id = a.track_id
                    WHERE a.id = arrangement_sections.arrangement_id
                    AND t.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.arrangements a
                    JOIN public.tracks t ON t.id = a.track_id
                    WHERE a.id = arrangement_sections.arrangement_id
                    AND t.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy for arrangement_sections';
    END IF;

    -- 2. ARRANGEMENTS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'arrangements') THEN
        CREATE POLICY "Users can manage own arrangements" ON public.arrangements
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.id = arrangements.track_id
                    AND t.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.id = arrangements.track_id
                    AND t.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy for arrangements';
    END IF;

    -- 3. AUDIO_SECTIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audio_sections') THEN
        CREATE POLICY "Users can manage own audio sections" ON public.audio_sections
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.id = audio_sections.track_id
                    AND t.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.id = audio_sections.track_id
                    AND t.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy for audio_sections';
    END IF;

    -- 4. COLLABORATOR_SESSIONS - Check if user_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collaborator_sessions' 
        AND column_name = 'user_id'
    ) THEN
        CREATE POLICY "Users can view own collaborator sessions" ON public.collaborator_sessions
            FOR SELECT
            TO authenticated
            USING (
                user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM public.playlist_shares ps
                    WHERE ps.share_token = collaborator_sessions.share_token
                    AND (ps.shared_by = auth.uid() OR ps.shared_with_email = (
                        SELECT email FROM public.profiles WHERE id = auth.uid()
                    ))
                )
            );
    ELSE
        -- Alternative policy if user_id doesn't exist
        CREATE POLICY "Users can view collaborator sessions" ON public.collaborator_sessions
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.playlist_shares ps
                    WHERE ps.share_token = collaborator_sessions.share_token
                    AND (ps.shared_by = auth.uid() OR ps.shared_with_email = (
                        SELECT email FROM public.profiles WHERE id = auth.uid()
                    ))
                )
            );
    END IF;
    RAISE NOTICE 'Created policy for collaborator_sessions';

    -- 5. COLLECTION_TRACK_ORDER - Check if user_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collection_track_order' 
        AND column_name = 'user_id'
    ) THEN
        CREATE POLICY "Users can manage own collection track order" ON public.collection_track_order
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    ELSE
        -- Alternative: use track ownership
        CREATE POLICY "Users can manage own collection track order" ON public.collection_track_order
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.collection = collection_track_order.collection_name
                    AND t.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.collection = collection_track_order.collection_name
                    AND t.user_id = auth.uid()
                )
            );
    END IF;
    RAISE NOTICE 'Created policy for collection_track_order';

    -- 6. COLLECTION_TRACKS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_tracks') THEN
        CREATE POLICY "Users can manage own collection tracks" ON public.collection_tracks
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.id = collection_tracks.track_id
                    AND t.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.tracks t
                    WHERE t.id = collection_tracks.track_id
                    AND t.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy for collection_tracks';
    END IF;

    -- 7. FEEDBACK - Check if user_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'feedback' 
        AND column_name = 'user_id'
    ) THEN
        CREATE POLICY "Users can manage own feedback" ON public.feedback
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
            
        CREATE POLICY "Admins can view all feedback" ON public.feedback
            FOR SELECT
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND is_admin = true
                )
            );
    ELSE
        -- If no user_id, make it admin-only
        CREATE POLICY "Admin only feedback access" ON public.feedback
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND is_admin = true
                )
            );
    END IF;
    RAISE NOTICE 'Created policy for feedback';

    -- 8. PROJECT_COLLABORATORS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_collaborators') THEN
        -- Check if projects table exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'projects') THEN
            CREATE POLICY "Project members can view collaborators" ON public.project_collaborators
                FOR SELECT
                TO authenticated
                USING (
                    EXISTS (
                        SELECT 1 FROM public.projects p
                        WHERE p.id = project_collaborators.project_id
                        AND (
                            p.owner_id = auth.uid()
                            OR EXISTS (
                                SELECT 1 FROM public.project_collaborators pc2
                                WHERE pc2.project_id = p.id
                                AND pc2.user_id = auth.uid()
                            )
                        )
                    )
                );
        ELSE
            -- Simpler policy if projects table doesn't exist
            CREATE POLICY "Users can view own project collaborations" ON public.project_collaborators
                FOR SELECT
                TO authenticated
                USING (user_id = auth.uid());
        END IF;
        RAISE NOTICE 'Created policy for project_collaborators';
    END IF;

    -- 9. SONG_VERSIONS - Check if user_id column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'song_versions' 
        AND column_name = 'user_id'
    ) THEN
        CREATE POLICY "Users can manage own song versions" ON public.song_versions
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
        RAISE NOTICE 'Created policy for song_versions';
    END IF;

    -- 10. VERSION_ITERATIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'version_iterations') THEN
        CREATE POLICY "Users can manage own version iterations" ON public.version_iterations
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_iterations.version_id
                    AND sv.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_iterations.version_id
                    AND sv.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy for version_iterations';
    END IF;

    -- 11. VERSION_METADATA
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'version_metadata') THEN
        CREATE POLICY "Users can manage own version metadata" ON public.version_metadata
            FOR ALL
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_metadata.version_id
                    AND sv.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_metadata.version_id
                    AND sv.user_id = auth.uid()
                )
            );
        RAISE NOTICE 'Created policy for version_metadata';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error creating policies: %', SQLERRM;
        RAISE;
END $$;

-- Final verification
DO $$
DECLARE
    protected_tables INTEGER;
    unprotected_tables TEXT[];
BEGIN
    -- Count tables with policies
    SELECT COUNT(DISTINCT tablename) INTO protected_tables
    FROM pg_policies
    WHERE schemaname = 'public';
    
    -- Find tables with RLS but no policies
    SELECT array_agg(t.tablename) INTO unprotected_tables
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
    WHERE t.schemaname = 'public'
    AND c.relrowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND p.tablename = t.tablename
    );
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SECURITY POLICY SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with policies: %', protected_tables;
    
    IF unprotected_tables IS NOT NULL THEN
        RAISE WARNING 'Tables still without policies: %', unprotected_tables;
    ELSE
        RAISE NOTICE '✓ All tables with RLS now have policies!';
    END IF;
END $$;

-- Show final policy summary
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;