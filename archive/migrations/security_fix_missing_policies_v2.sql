-- SECURITY FIX: Add RLS policies for tables with RLS enabled but no policies (Version 2)
-- Generated: 2025-08-09
-- Priority: MEDIUM - These tables have RLS but no policies, blocking all access

-- Drop existing policies if they exist to avoid conflicts
DO $$
BEGIN
    -- List of policies to drop
    DROP POLICY IF EXISTS "Users can manage own arrangement sections" ON public.arrangement_sections;
    DROP POLICY IF EXISTS "Users can manage own arrangements" ON public.arrangements;
    DROP POLICY IF EXISTS "Users can manage own audio sections" ON public.audio_sections;
    DROP POLICY IF EXISTS "Users can view own collaborator sessions" ON public.collaborator_sessions;
    DROP POLICY IF EXISTS "Users can manage own collection track order" ON public.collection_track_order;
    DROP POLICY IF EXISTS "Users can manage own collection tracks" ON public.collection_tracks;
    DROP POLICY IF EXISTS "Users can manage own feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
    DROP POLICY IF EXISTS "Project members can view collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Project owners can manage collaborators" ON public.project_collaborators;
    DROP POLICY IF EXISTS "Users can manage own song versions" ON public.song_versions;
    DROP POLICY IF EXISTS "Users can manage own version iterations" ON public.version_iterations;
    DROP POLICY IF EXISTS "Users can manage own version metadata" ON public.version_metadata;
END $$;

-- ============================================
-- 1. ARRANGEMENT_SECTIONS - Track arrangement sections
-- ============================================
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

-- ============================================
-- 2. ARRANGEMENTS - Track arrangements
-- ============================================
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

-- ============================================
-- 3. AUDIO_SECTIONS - Audio waveform sections
-- ============================================
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

-- ============================================
-- 4. COLLABORATOR_SESSIONS - Collaborator access sessions
-- ============================================
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

-- ============================================
-- 5. COLLECTION_TRACK_ORDER - Track ordering within collections
-- ============================================
CREATE POLICY "Users can manage own collection track order" ON public.collection_track_order
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 6. COLLECTION_TRACKS - Tracks in collections
-- ============================================
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

-- ============================================
-- 7. FEEDBACK - User feedback
-- ============================================
-- Users can manage their own feedback
CREATE POLICY "Users can manage own feedback" ON public.feedback
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can view all feedback
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

-- ============================================
-- 8. PROJECT_COLLABORATORS - Project collaboration
-- ============================================
-- Project members can view collaborators
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
                    SELECT 1 FROM public.project_collaborators pc
                    WHERE pc.project_id = p.id
                    AND pc.user_id = auth.uid()
                )
            )
        )
    );

-- Project owners can insert new collaborators
CREATE POLICY "Project owners can add collaborators" ON public.project_collaborators
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_collaborators.project_id
            AND p.owner_id = auth.uid()
        )
    );

-- Project owners can update collaborators
CREATE POLICY "Project owners can update collaborators" ON public.project_collaborators
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_collaborators.project_id
            AND p.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_collaborators.project_id
            AND p.owner_id = auth.uid()
        )
    );

-- Project owners can remove collaborators
CREATE POLICY "Project owners can remove collaborators" ON public.project_collaborators
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = project_collaborators.project_id
            AND p.owner_id = auth.uid()
        )
    );

-- ============================================
-- 9. SONG_VERSIONS - Song version tracking
-- ============================================
CREATE POLICY "Users can manage own song versions" ON public.song_versions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ============================================
-- 10. VERSION_ITERATIONS - Version iterations
-- ============================================
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

-- ============================================
-- 11. VERSION_METADATA - Version metadata
-- ============================================
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

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
    tables_without_policies TEXT[];
    tables_with_policies INTEGER;
BEGIN
    -- Check for tables with RLS but no policies
    SELECT array_agg(t.tablename) INTO tables_without_policies
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
    
    -- Count tables with policies
    SELECT COUNT(DISTINCT tablename) INTO tables_with_policies
    FROM pg_policies
    WHERE schemaname = 'public';
    
    IF tables_without_policies IS NOT NULL THEN
        RAISE WARNING 'Tables still without policies: %', tables_without_policies;
    ELSE
        RAISE NOTICE '✓ SUCCESS: All tables with RLS now have policies defined';
        RAISE NOTICE 'Total tables with policies: %', tables_with_policies;
    END IF;
END $$;

-- Display summary of all policies
SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
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
GROUP BY tablename
ORDER BY tablename;