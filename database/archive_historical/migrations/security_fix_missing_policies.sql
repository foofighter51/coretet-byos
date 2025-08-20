-- SECURITY FIX: Add RLS policies for tables with RLS enabled but no policies
-- Generated: 2025-08-09
-- Priority: MEDIUM - These tables have RLS but no policies, blocking all access

-- 1. arrangement_sections - Track arrangement sections
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

-- 2. arrangements - Track arrangements
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

-- 3. audio_sections - Audio waveform sections
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

-- 4. collaborator_sessions - Collaborator access sessions
CREATE POLICY "Users can view own collaborator sessions" ON public.collaborator_sessions
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.playlist_shares ps
            WHERE ps.share_token = collaborator_sessions.share_token
            AND (ps.shared_by = auth.uid() OR ps.shared_with = auth.uid())
        )
    );

-- 5. collection_track_order - Track ordering within collections
CREATE POLICY "Users can manage own collection track order" ON public.collection_track_order
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. collection_tracks - Tracks in collections
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

-- 7. feedback - User feedback
CREATE POLICY "Users can manage own feedback" ON public.feedback
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admin can view all feedback
CREATE POLICY "Admins can view all feedback" ON public.feedback
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE user_id = auth.uid()
            AND is_admin = true
        )
    );

-- 8. project_collaborators - Project collaboration
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

CREATE POLICY "Project owners can manage collaborators" ON public.project_collaborators
    FOR ALL
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

-- 9. song_versions - Song version tracking
CREATE POLICY "Users can manage own song versions" ON public.song_versions
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 10. version_iterations - Version iterations
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

-- 11. version_metadata - Version metadata
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

-- Verify all tables now have policies
DO $$
DECLARE
    tables_without_policies TEXT[];
BEGIN
    SELECT array_agg(tablename) INTO tables_without_policies
    FROM pg_tables t
    WHERE t.schemaname = 'public'
    AND EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
        AND c.relname = t.tablename
        AND c.relrowsecurity = true
    )
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public'
        AND p.tablename = t.tablename
    );
    
    IF tables_without_policies IS NOT NULL THEN
        RAISE WARNING 'Tables still without policies: %', tables_without_policies;
    ELSE
        RAISE NOTICE 'All tables with RLS now have policies defined';
    END IF;
END $$;