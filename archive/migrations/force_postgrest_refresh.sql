-- =====================================================
-- FORCE POSTGREST SCHEMA REFRESH
-- =====================================================
-- Since the table structure is correct, we need to force PostgREST to reload

-- Method 1: Send reload signals
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Method 2: Touch the table to trigger change detection
ALTER TABLE view_preferences ADD COLUMN _temp_refresh BOOLEAN DEFAULT false;
ALTER TABLE view_preferences DROP COLUMN _temp_refresh;

-- Method 3: Recreate a policy to force refresh
DROP POLICY IF EXISTS "Users can view their own preferences" ON view_preferences;
CREATE POLICY "Users can view their own preferences"
    ON view_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Method 4: Update table comment
COMMENT ON TABLE view_preferences IS 'User view preferences - schema refreshed for cache clearing';

-- Method 5: Touch the RPC function
CREATE OR REPLACE FUNCTION upsert_view_preference(
    p_view_type TEXT,
    p_view_id TEXT,
    p_sort_by TEXT,
    p_sort_direction TEXT,
    p_view_mode TEXT,
    p_manual_positions JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Validate inputs
    IF p_sort_direction NOT IN ('asc', 'desc') THEN
        p_sort_direction := 'desc';
    END IF;
    
    IF p_view_mode NOT IN ('list', 'grid') THEN
        p_view_mode := 'list';
    END IF;
    
    IF p_sort_by NOT IN ('added', 'title', 'type', 'artist', 'album', 'duration', 'date') THEN
        p_sort_by := 'added';
    END IF;
    
    INSERT INTO view_preferences (
        user_id,
        view_type,
        view_id,
        sort_by,
        sort_direction,
        view_mode,
        manual_positions,
        updated_at
    )
    VALUES (
        current_user_id,
        p_view_type,
        p_view_id,
        p_sort_by,
        p_sort_direction,
        p_view_mode,
        p_manual_positions,
        NOW()
    )
    ON CONFLICT (user_id, view_type, view_id)
    DO UPDATE SET
        sort_by = EXCLUDED.sort_by,
        sort_direction = EXCLUDED.sort_direction,
        view_mode = EXCLUDED.view_mode,
        manual_positions = EXCLUDED.manual_positions,
        updated_at = NOW();
END;
$$;

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SCHEMA REFRESH TRIGGERED';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Multiple refresh signals sent to PostgREST.';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT NEXT STEPS:';
    RAISE NOTICE '1. Wait 60 seconds for cache to expire';
    RAISE NOTICE '2. If using Supabase Dashboard, try:';
    RAISE NOTICE '   - Settings → API → Look for any refresh options';
    RAISE NOTICE '   - Or restart your Supabase project if available';
    RAISE NOTICE '3. Clear your browser cache (Cmd+Shift+R)';
    RAISE NOTICE '4. Test the application';
    RAISE NOTICE '';
    RAISE NOTICE 'If errors persist after 2 minutes:';
    RAISE NOTICE '- Check browser console for exact error details';
    RAISE NOTICE '- The issue may be client-side caching';
    RAISE NOTICE '========================================';
END $$;