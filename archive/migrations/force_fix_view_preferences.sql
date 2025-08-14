-- Force fix for view_preferences with schema refresh
-- Run this AFTER the diagnostic script

-- 1. Drop everything related to view_preferences
DROP TABLE IF EXISTS view_preferences CASCADE;
DROP FUNCTION IF EXISTS upsert_view_preference CASCADE;
DROP FUNCTION IF EXISTS get_or_create_view_preferences CASCADE;
DROP FUNCTION IF EXISTS update_view_preferences CASCADE;

-- 2. Wait a moment for cleanup
DO $$ BEGIN PERFORM pg_sleep(1); END $$;

-- 3. Create the table fresh with explicit schema
CREATE TABLE public.view_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    sort_by TEXT DEFAULT 'added',
    sort_direction TEXT DEFAULT 'desc',
    view_mode TEXT DEFAULT 'list',
    manual_positions JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT view_preferences_sort_direction_check CHECK (sort_direction IN ('asc', 'desc')),
    CONSTRAINT view_preferences_view_mode_check CHECK (view_mode IN ('list', 'grid')),
    CONSTRAINT view_preferences_unique UNIQUE(user_id, view_type, view_id)
);

-- 4. Create indexes
CREATE INDEX idx_view_preferences_user ON public.view_preferences(user_id);
CREATE INDEX idx_view_preferences_view ON public.view_preferences(view_type, view_id);

-- 5. Enable RLS
ALTER TABLE public.view_preferences ENABLE ROW LEVEL SECURITY;

-- 6. Create policies with explicit schema
CREATE POLICY "Users can view their own preferences"
    ON public.view_preferences
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
    ON public.view_preferences
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
    ON public.view_preferences
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own preferences"
    ON public.view_preferences
    FOR DELETE
    USING (user_id = auth.uid());

-- 7. Create the RPC function with explicit schema
CREATE OR REPLACE FUNCTION public.upsert_view_preference(
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
BEGIN
    INSERT INTO public.view_preferences (
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
        auth.uid(),
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

-- 8. Grant explicit permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.view_preferences TO authenticated;
GRANT SELECT ON public.view_preferences TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_view_preference TO authenticated;

-- 9. Force PostgREST to reload schema (Supabase specific)
NOTIFY pgrst, 'reload schema';

-- 10. Insert a test row to ensure table is working
DO $$
BEGIN
    -- Only insert if user is authenticated
    IF auth.uid() IS NOT NULL THEN
        INSERT INTO public.view_preferences (
            user_id, view_type, view_id, sort_by, sort_direction, view_mode
        ) VALUES (
            auth.uid(), 'test', 'test', 'added', 'desc', 'list'
        ) ON CONFLICT DO NOTHING;
        
        -- Delete the test row
        DELETE FROM public.view_preferences 
        WHERE view_type = 'test' AND view_id = 'test';
        
        RAISE NOTICE 'Test insert/delete succeeded';
    ELSE
        RAISE NOTICE 'No authenticated user for test';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Test failed: %', SQLERRM;
END $$;

-- 11. Final verification
DO $$
DECLARE
    col_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'view_preferences';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'view_preferences';
    
    RAISE NOTICE '';
    RAISE NOTICE '=== VERIFICATION ===';
    RAISE NOTICE 'Columns created: %', col_count;
    RAISE NOTICE 'Policies created: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Table has been completely rebuilt.';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANT: After running this migration:';
    RAISE NOTICE '1. Go to Supabase Dashboard > Settings > API';
    RAISE NOTICE '2. Look for "Schema cache" or "Reload schema" button';
    RAISE NOTICE '3. Click to reload the schema';
    RAISE NOTICE '4. Or wait 60 seconds for automatic refresh';
    RAISE NOTICE '';
    RAISE NOTICE 'The 406 errors should then be resolved.';
END $$;