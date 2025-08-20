-- Force Supabase to reload the schema
-- This uses multiple methods to trigger a refresh

-- Method 1: Send reload notifications
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Method 2: Alter the table to trigger schema change detection
ALTER TABLE public.view_preferences ADD COLUMN IF NOT EXISTS temp_reload BOOLEAN DEFAULT false;
ALTER TABLE public.view_preferences DROP COLUMN IF EXISTS temp_reload;

-- Method 3: Create and drop a dummy function to trigger reload
CREATE OR REPLACE FUNCTION trigger_schema_reload()
RETURNS void
LANGUAGE sql
AS $$
  SELECT 1;
$$;
DROP FUNCTION trigger_schema_reload();

-- Method 4: Touch the table's comment to force metadata update
COMMENT ON TABLE public.view_preferences IS 'User view preferences - refreshed for schema reload';

-- Method 5: Recreate a policy to trigger policy reload
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.view_preferences;
CREATE POLICY "Users can view their own preferences"
    ON public.view_preferences
    FOR SELECT
    USING (user_id = auth.uid());

-- Verify the table structure
SELECT 
    'Column Check' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'view_preferences'
ORDER BY ordinal_position;

-- Test that we can query the table
SELECT 
    'Query Test' as test,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'SUCCESS - Table is queryable'
        ELSE 'FAILED'
    END as result
FROM public.view_preferences
WHERE 1=0; -- Don't actually return rows, just test the query

-- Final message
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== SCHEMA RELOAD TRIGGERED ===';
    RAISE NOTICE 'Multiple reload signals sent.';
    RAISE NOTICE 'Wait 10-30 seconds then refresh your app.';
    RAISE NOTICE '';
    RAISE NOTICE 'If still getting 406 errors:';
    RAISE NOTICE '1. Try restarting your Supabase project';
    RAISE NOTICE '2. Or wait 2-3 minutes for full cache expiry';
END $$;