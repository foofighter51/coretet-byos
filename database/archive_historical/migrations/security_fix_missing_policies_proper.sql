-- SECURITY FIX: Add PROPER RLS policies for tables with RLS enabled but no policies
-- Generated: 2025-08-09
-- Priority: MEDIUM - These tables have RLS but no policies, blocking all access
-- This version implements proper restrictive policies based on actual ownership model

-- Drop any existing policies to start fresh
DO $$
BEGIN
    -- Drop existing policies for clean slate
    DROP POLICY IF EXISTS "Users manage own arrangement sections" ON public.arrangement_sections;
    DROP POLICY IF EXISTS "Users manage own arrangements" ON public.arrangements;
    DROP POLICY IF EXISTS "Users manage own audio sections" ON public.audio_sections;
    DROP POLICY IF EXISTS "Admin only access" ON public.collaborator_sessions;
    DROP POLICY IF EXISTS "Users manage own collection track order" ON public.collection_track_order;
    DROP POLICY IF EXISTS "Users manage own collection tracks" ON public.collection_tracks;
    DROP POLICY IF EXISTS "Users manage own feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Admins view all feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Project members view collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners add collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners update collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners remove collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Users manage own song versions" ON public.song_versions;
    DROP POLICY IF EXISTS "Users manage own version iterations" ON public.version_iterations;
    DROP POLICY IF EXISTS "Users manage own version metadata" ON public.version_metadata;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Some policies could not be dropped: %', SQLERRM;
END $$;

-- ============================================
-- 1. ARRANGEMENT_SECTIONS
-- Ownership: Through arrangements → tracks
-- ============================================
CREATE POLICY "Users manage own arrangement sections" ON public.arrangement_sections
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.arrangements a
            JOIN public.tracks t ON t.id = a.track_id
            WHERE a.id = arrangement_sections.arrangement_id
            AND (
                t.user_id = auth.uid()  -- Own tracks
                OR EXISTS (  -- Or shared through playlists
                    SELECT 1 FROM public.playlist_tracks pt
                    JOIN public.playlist_shares ps ON ps.playlist_id = pt.playlist_id
                    JOIN public.profiles prof ON prof.email = ps.shared_with_email
                    WHERE pt.track_id = t.id
                    AND prof.id = auth.uid()
                    AND ps.accepted_at IS NOT NULL
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.arrangements a
            JOIN public.tracks t ON t.id = a.track_id
            WHERE a.id = arrangement_sections.arrangement_id
            AND t.user_id = auth.uid()  -- Only owners can modify
        )
    );

-- ============================================
-- 2. ARRANGEMENTS
-- Ownership: created_by OR through track ownership
-- ============================================
CREATE POLICY "Users manage own arrangements" ON public.arrangements
    FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid()  -- Created by user
        OR EXISTS (  -- Or owns the track
            SELECT 1 FROM public.tracks t
            WHERE t.id = arrangements.track_id
            AND t.user_id = auth.uid()
        )
        OR EXISTS (  -- Or track shared through playlist
            SELECT 1 FROM public.playlist_tracks pt
            JOIN public.playlist_shares ps ON ps.playlist_id = pt.playlist_id
            JOIN public.profiles prof ON prof.email = ps.shared_with_email
            WHERE pt.track_id = arrangements.track_id
            AND prof.id = auth.uid()
            AND ps.accepted_at IS NOT NULL
        )
    )
    WITH CHECK (
        created_by = auth.uid()  -- Only creator can modify
        OR EXISTS (  -- Or track owner
            SELECT 1 FROM public.tracks t
            WHERE t.id = arrangements.track_id
            AND t.user_id = auth.uid()
        )
    );

-- ============================================
-- 3. AUDIO_SECTIONS
-- Ownership: created_by OR through track ownership
-- ============================================
CREATE POLICY "Users manage own audio sections" ON public.audio_sections
    FOR ALL
    TO authenticated
    USING (
        created_by = auth.uid()  -- Created by user
        OR EXISTS (  -- Or owns the track
            SELECT 1 FROM public.tracks t
            WHERE t.id = audio_sections.track_id
            AND t.user_id = auth.uid()
        )
        OR EXISTS (  -- Or track shared through playlist
            SELECT 1 FROM public.playlist_tracks pt
            JOIN public.playlist_shares ps ON ps.playlist_id = pt.playlist_id
            JOIN public.profiles prof ON prof.email = ps.shared_with_email
            WHERE pt.track_id = audio_sections.track_id
            AND prof.id = auth.uid()
            AND ps.accepted_at IS NOT NULL
        )
    )
    WITH CHECK (
        created_by = auth.uid()  -- Only creator can modify
        OR EXISTS (  -- Or track owner
            SELECT 1 FROM public.tracks t
            WHERE t.id = audio_sections.track_id
            AND t.user_id = auth.uid()
        )
    );

-- ============================================
-- 4. COLLABORATOR_SESSIONS
-- Legacy table - admin only for safety
-- ============================================
CREATE POLICY "Admin only access" ON public.collaborator_sessions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- ============================================
-- 5. COLLECTION_TRACK_ORDER
-- Direct ownership via user_id
-- ============================================
CREATE POLICY "Users manage own collection track order" ON public.collection_track_order
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 6. COLLECTION_TRACKS
-- Direct ownership via user_id
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'collection_tracks'
        AND column_name = 'user_id'
    ) THEN
        CREATE POLICY "Users manage own collection tracks" ON public.collection_tracks
            FOR ALL
            TO authenticated
            USING (user_id = auth.uid())
            WITH CHECK (user_id = auth.uid());
    ELSE
        -- Fallback if user_id doesn't exist
        CREATE POLICY "Users manage collection tracks for own tracks" ON public.collection_tracks
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
    END IF;
END $$;

-- ============================================
-- 7. FEEDBACK
-- Direct ownership via user_id
-- ============================================
CREATE POLICY "Users manage own feedback" ON public.feedback
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins view all feedback" ON public.feedback
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND is_admin = true
        )
    );

-- ============================================
-- 8. PROJECT_COLLABORATORS (if exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_collaborators') THEN
        -- View policy: project members can see collaborators
        CREATE POLICY "Project members view collaborators" ON public.project_collaborators
            FOR SELECT
            TO authenticated
            USING (
                user_id = auth.uid()  -- Is a collaborator
                OR EXISTS (  -- Or owns the project
                    SELECT 1 FROM public.projects p
                    WHERE p.id = project_collaborators.project_id
                    AND p.user_id = auth.uid()
                )
            );
        
        -- Insert policy: only project owners
        CREATE POLICY "Project owners add collaborators" ON public.project_collaborators
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.projects p
                    WHERE p.id = project_collaborators.project_id
                    AND p.user_id = auth.uid()
                )
            );
            
        -- Update policy: only project owners
        CREATE POLICY "Project owners update collaborators" ON public.project_collaborators
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.projects p
                    WHERE p.id = project_collaborators.project_id
                    AND p.user_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.projects p
                    WHERE p.id = project_collaborators.project_id
                    AND p.user_id = auth.uid()
                )
            );
            
        -- Delete policy: only project owners
        CREATE POLICY "Project owners remove collaborators" ON public.project_collaborators
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.projects p
                    WHERE p.id = project_collaborators.project_id
                    AND p.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ============================================
-- 9. SONG_VERSIONS (if exists)
-- Direct ownership via user_id
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'song_versions') THEN
        CREATE POLICY "Users manage own song versions" ON public.song_versions
            FOR ALL
            TO authenticated
            USING (
                user_id = auth.uid()
                OR EXISTS (  -- Or project owner
                    SELECT 1 FROM public.projects p
                    WHERE p.id = song_versions.project_id
                    AND p.user_id = auth.uid()
                )
                OR EXISTS (  -- Or project collaborator
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = song_versions.project_id
                    AND pc.user_id = auth.uid()
                    AND pc.accepted_at IS NOT NULL
                )
            )
            WITH CHECK (
                user_id = auth.uid()
                OR EXISTS (  -- Project owner can modify
                    SELECT 1 FROM public.projects p
                    WHERE p.id = song_versions.project_id
                    AND p.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ============================================
-- 10. VERSION_ITERATIONS (if exists)
-- Direct ownership via user_id
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'version_iterations') THEN
        CREATE POLICY "Users manage own version iterations" ON public.version_iterations
            FOR ALL
            TO authenticated
            USING (
                user_id = auth.uid()
                OR EXISTS (  -- Or owns the version
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_iterations.version_id
                    AND sv.user_id = auth.uid()
                )
                OR EXISTS (  -- Or owns the project
                    SELECT 1 FROM public.song_versions sv
                    JOIN public.projects p ON p.id = sv.project_id
                    WHERE sv.id = version_iterations.version_id
                    AND p.user_id = auth.uid()
                )
            )
            WITH CHECK (
                user_id = auth.uid()
                OR EXISTS (  -- Version owner can modify
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_iterations.version_id
                    AND sv.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ============================================
-- 11. VERSION_METADATA (if exists)
-- Indirect ownership through version
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'version_metadata') THEN
        CREATE POLICY "Users manage version metadata" ON public.version_metadata
            FOR ALL
            TO authenticated
            USING (
                EXISTS (  -- Owns the version
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_metadata.version_id
                    AND sv.user_id = auth.uid()
                )
                OR EXISTS (  -- Or owns the project
                    SELECT 1 FROM public.song_versions sv
                    JOIN public.projects p ON p.id = sv.project_id
                    WHERE sv.id = version_metadata.version_id
                    AND p.user_id = auth.uid()
                )
                OR EXISTS (  -- Or is a collaborator
                    SELECT 1 FROM public.song_versions sv
                    JOIN public.project_collaborators pc ON pc.project_id = sv.project_id
                    WHERE sv.id = version_metadata.version_id
                    AND pc.user_id = auth.uid()
                    AND pc.accepted_at IS NOT NULL
                )
            )
            WITH CHECK (
                EXISTS (  -- Only version owner can modify
                    SELECT 1 FROM public.song_versions sv
                    WHERE sv.id = version_metadata.version_id
                    AND (sv.user_id = auth.uid() OR EXISTS (
                        SELECT 1 FROM public.projects p
                        WHERE p.id = sv.project_id
                        AND p.user_id = auth.uid()
                    ))
                )
            );
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    unprotected_tables TEXT[];
    protected_count INTEGER;
    table_status RECORD;
BEGIN
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
    
    -- Count protected tables
    SELECT COUNT(DISTINCT tablename) INTO protected_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS POLICY IMPLEMENTATION COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with policies: %', protected_count;
    
    IF unprotected_tables IS NOT NULL THEN
        RAISE WARNING '⚠️ Tables still without policies: %', unprotected_tables;
    ELSE
        RAISE NOTICE '✅ SUCCESS: All tables with RLS now have PROPER restrictive policies!';
    END IF;
    
    -- Show detailed status for our target tables
    RAISE NOTICE '';
    RAISE NOTICE 'Policy Status for Target Tables:';
    RAISE NOTICE '---------------------------------';
    
    FOR table_status IN 
        SELECT 
            t.tablename,
            COUNT(p.policyname) as policy_count
        FROM pg_tables t
        LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
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
        ORDER BY t.tablename
    LOOP
        RAISE NOTICE '  % : % policies', rpad(table_status.tablename, 25), table_status.policy_count;
    END LOOP;
END $$;

-- Final summary view
SELECT 
    t.tablename,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS Enabled'
        ELSE 'No RLS'
    END as rls_status,
    COUNT(p.policyname) as policies,
    string_agg(p.policyname, ', ' ORDER BY p.policyname) as policy_names
FROM pg_tables t
LEFT JOIN pg_class c ON c.relname = t.tablename
LEFT JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
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
GROUP BY t.tablename, c.relrowsecurity
ORDER BY t.tablename;