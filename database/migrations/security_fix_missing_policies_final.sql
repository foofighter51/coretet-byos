-- SECURITY FIX: Add RLS policies for tables with RLS enabled but no policies (FINAL)
-- Generated: 2025-08-09
-- Priority: MEDIUM - These tables have RLS but no policies, blocking all access

-- Simply add basic policies for tables that have RLS but no policies
-- We'll use the most permissive safe approach to unblock access

DO $$
BEGIN
    RAISE NOTICE 'Adding missing RLS policies...';
    
    -- ARRANGEMENT_SECTIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'arrangement_sections') 
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'arrangement_sections') THEN
        CREATE POLICY "Users manage own arrangement sections" ON public.arrangement_sections
            FOR ALL TO authenticated
            USING (true)  -- Temporarily allow all authenticated users
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for arrangement_sections';
    END IF;

    -- ARRANGEMENTS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'arrangements')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'arrangements') THEN
        CREATE POLICY "Users manage own arrangements" ON public.arrangements
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for arrangements';
    END IF;

    -- AUDIO_SECTIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audio_sections')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audio_sections') THEN
        CREATE POLICY "Users manage own audio sections" ON public.audio_sections
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for audio_sections';
    END IF;

    -- COLLABORATOR_SESSIONS (special handling for collaborator system)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collaborator_sessions')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'collaborator_sessions') THEN
        -- This table is for the old collaborator system, make it admin-only
        CREATE POLICY "Admin only access" ON public.collaborator_sessions
            FOR ALL TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM public.profiles
                    WHERE id = auth.uid()
                    AND is_admin = true
                )
            );
        RAISE NOTICE 'Added admin-only policy for collaborator_sessions';
    END IF;

    -- COLLECTION_TRACK_ORDER
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_track_order')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'collection_track_order') THEN
        CREATE POLICY "Users manage collection order" ON public.collection_track_order
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for collection_track_order';
    END IF;

    -- COLLECTION_TRACKS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_tracks')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'collection_tracks') THEN
        CREATE POLICY "Users manage collection tracks" ON public.collection_tracks
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for collection_tracks';
    END IF;

    -- FEEDBACK
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'feedback')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'feedback') THEN
        CREATE POLICY "Users manage feedback" ON public.feedback
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for feedback';
    END IF;

    -- PROJECT_COLLABORATORS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'project_collaborators')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'project_collaborators') THEN
        CREATE POLICY "Users manage project collaborators" ON public.project_collaborators
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for project_collaborators';
    END IF;

    -- SONG_VERSIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'song_versions')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'song_versions') THEN
        CREATE POLICY "Users manage song versions" ON public.song_versions
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for song_versions';
    END IF;

    -- VERSION_ITERATIONS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'version_iterations')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'version_iterations') THEN
        CREATE POLICY "Users manage version iterations" ON public.version_iterations
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for version_iterations';
    END IF;

    -- VERSION_METADATA
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'version_metadata')
       AND NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'version_metadata') THEN
        CREATE POLICY "Users manage version metadata" ON public.version_metadata
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true);
        RAISE NOTICE 'Added policy for version_metadata';
    END IF;

END $$;

-- Final verification
DO $$
DECLARE
    unprotected_tables TEXT[];
    protected_count INTEGER;
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
    RAISE NOTICE 'RLS POLICY SUMMARY';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables with policies: %', protected_count;
    
    IF unprotected_tables IS NOT NULL THEN
        RAISE WARNING '⚠️ Tables still without policies: %', unprotected_tables;
        RAISE NOTICE 'These tables have RLS enabled but no policies, blocking all access!';
    ELSE
        RAISE NOTICE '✅ SUCCESS: All tables with RLS now have policies!';
    END IF;
END $$;

-- Show which tables now have policies
SELECT 
    t.tablename,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS Enabled'
        ELSE 'No RLS'
    END as rls_status,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN c.relrowsecurity AND COUNT(p.policyname) = 0 THEN '⚠️ BLOCKED'
        WHEN c.relrowsecurity AND COUNT(p.policyname) > 0 THEN '✅ Protected'
        ELSE '➖ No RLS'
    END as status
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
ORDER BY status DESC, t.tablename;

-- IMPORTANT NOTE
SELECT '⚠️ IMPORTANT: These are temporary permissive policies to unblock access.
You should review and tighten these policies based on your actual requirements.
Consider adding proper user_id checks and ownership validation.' as note;