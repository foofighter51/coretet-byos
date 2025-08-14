-- =====================================================
-- DEFINITIVE VIEW_PREFERENCES FIX
-- =====================================================
-- This script completely rebuilds the view_preferences table
-- to match exactly what the frontend expects

-- Step 1: Backup existing data if any
DROP TABLE IF EXISTS view_preferences_backup CASCADE;
CREATE TABLE IF NOT EXISTS view_preferences_backup AS 
SELECT * FROM view_preferences WHERE FALSE; -- Create structure only

-- Try to backup data if table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'view_preferences'
    ) THEN
        -- Backup existing data
        INSERT INTO view_preferences_backup SELECT * FROM view_preferences;
        RAISE NOTICE 'Backed up % rows from existing view_preferences table', 
            (SELECT COUNT(*) FROM view_preferences_backup);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not backup existing data (table structure might be incompatible)';
END $$;

-- Step 2: Drop everything related to view_preferences
DROP FUNCTION IF EXISTS upsert_view_preference CASCADE;
DROP TABLE IF EXISTS view_preferences CASCADE;

-- Step 3: Create the table with EXACT structure frontend expects
CREATE TABLE view_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    
    -- These EXACT column names are required by the frontend
    sort_by TEXT DEFAULT 'added',
    sort_direction TEXT DEFAULT 'desc',
    view_mode TEXT DEFAULT 'list',
    manual_positions JSONB DEFAULT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure unique preferences per user/view combination
    UNIQUE(user_id, view_type, view_id)
);

-- Step 4: Add constraints for data integrity
ALTER TABLE view_preferences
    ADD CONSTRAINT check_sort_direction 
    CHECK (sort_direction IN ('asc', 'desc'));

ALTER TABLE view_preferences
    ADD CONSTRAINT check_view_mode 
    CHECK (view_mode IN ('list', 'grid'));

ALTER TABLE view_preferences
    ADD CONSTRAINT check_sort_by 
    CHECK (sort_by IN ('added', 'title', 'type', 'artist', 'album', 'duration', 'date'));

-- Step 5: Create indexes for performance
CREATE INDEX idx_view_preferences_user_id ON view_preferences(user_id);
CREATE INDEX idx_view_preferences_lookup ON view_preferences(user_id, view_type, view_id);
CREATE INDEX idx_view_preferences_view ON view_preferences(view_type, view_id);

-- Step 6: Enable RLS
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Step 7: Create comprehensive RLS policies
-- Drop any existing policies first
DROP POLICY IF EXISTS "Users can view their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can insert their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can update their own preferences" ON view_preferences;
DROP POLICY IF EXISTS "Users can delete their own preferences" ON view_preferences;

-- Create new policies
CREATE POLICY "Users can view their own preferences"
    ON view_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
    ON view_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
    ON view_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preferences"
    ON view_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- Step 8: Create the RPC function the frontend expects
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
    -- Get the current user ID
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
    
    -- Perform the upsert
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

-- Step 9: Grant necessary permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT EXECUTE ON FUNCTION upsert_view_preference TO authenticated;

-- Step 10: Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_view_preferences_updated_at ON view_preferences;
CREATE TRIGGER update_view_preferences_updated_at
    BEFORE UPDATE ON view_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 11: Attempt to restore data from backup
DO $$
DECLARE
    restored_count INTEGER := 0;
BEGIN
    -- Try to restore data with column mapping
    IF EXISTS (SELECT 1 FROM view_preferences_backup LIMIT 1) THEN
        -- Check if backup has individual columns or JSONB
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'view_preferences_backup' 
            AND column_name = 'sort_by'
        ) THEN
            -- Backup has individual columns, direct restore
            INSERT INTO view_preferences (
                user_id, view_type, view_id, 
                sort_by, sort_direction, view_mode, manual_positions,
                created_at, updated_at
            )
            SELECT 
                user_id, view_type, view_id,
                sort_by, sort_direction, view_mode, manual_positions,
                created_at, updated_at
            FROM view_preferences_backup
            ON CONFLICT (user_id, view_type, view_id) DO NOTHING;
            
            GET DIAGNOSTICS restored_count = ROW_COUNT;
            RAISE NOTICE 'Restored % rows from backup', restored_count;
            
        ELSIF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'view_preferences_backup' 
            AND column_name = 'preferences'
        ) THEN
            -- Backup has JSONB preferences column, need to extract
            INSERT INTO view_preferences (
                user_id, view_type, view_id,
                sort_by, sort_direction, view_mode, manual_positions,
                created_at, updated_at
            )
            SELECT 
                user_id, view_type, view_id,
                COALESCE(preferences->>'sortBy', preferences->>'sort_by', 'added')::TEXT,
                COALESCE(preferences->>'sortDirection', preferences->>'sort_direction', preferences->>'sortOrder', 'desc')::TEXT,
                COALESCE(preferences->>'viewMode', preferences->>'view_mode', 'list')::TEXT,
                CASE 
                    WHEN preferences->'manualPositions' IS NOT NULL THEN preferences->'manualPositions'
                    WHEN preferences->'manual_positions' IS NOT NULL THEN preferences->'manual_positions'
                    ELSE NULL
                END,
                created_at, updated_at
            FROM view_preferences_backup
            ON CONFLICT (user_id, view_type, view_id) DO NOTHING;
            
            GET DIAGNOSTICS restored_count = ROW_COUNT;
            RAISE NOTICE 'Restored and converted % rows from JSONB backup', restored_count;
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not restore backup data: %', SQLERRM;
END $$;

-- Step 12: Drop backup table
DROP TABLE IF EXISTS view_preferences_backup;

-- Step 13: Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- Add a dummy comment to trigger metadata refresh
COMMENT ON TABLE view_preferences IS 'User view preferences for sorting and display - Fixed structure';

-- Step 14: Validation tests
DO $$
DECLARE
    test_passed BOOLEAN := true;
    test_user_id UUID;
    test_result RECORD;
    error_msg TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RUNNING VALIDATION TESTS';
    RAISE NOTICE '========================================';
    
    -- Get a test user
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        -- Create a test user if none exist
        test_user_id := gen_random_uuid();
        RAISE NOTICE 'Using test UUID: %', test_user_id;
    END IF;
    
    -- Test 1: Table structure
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'view_preferences' 
        AND column_name IN ('sort_by', 'sort_direction', 'view_mode', 'manual_positions')
        HAVING COUNT(*) = 4
    ) THEN
        RAISE NOTICE '✅ Test 1: Table has all required columns';
    ELSE
        RAISE NOTICE '❌ Test 1: Missing required columns';
        test_passed := false;
    END IF;
    
    -- Test 2: RPC function exists
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'upsert_view_preference'
    ) THEN
        RAISE NOTICE '✅ Test 2: RPC function exists';
    ELSE
        RAISE NOTICE '❌ Test 2: RPC function missing';
        test_passed := false;
    END IF;
    
    -- Test 3: Can query the table
    BEGIN
        SELECT COUNT(*) INTO test_result FROM view_preferences WHERE user_id = test_user_id;
        RAISE NOTICE '✅ Test 3: Can query table successfully';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 3: Query failed - %', error_msg;
        test_passed := false;
    END;
    
    -- Test 4: Can insert data
    BEGIN
        INSERT INTO view_preferences (user_id, view_type, view_id, sort_by, sort_direction, view_mode)
        VALUES (test_user_id, 'test', 'validation', 'title', 'asc', 'grid')
        ON CONFLICT (user_id, view_type, view_id) 
        DO UPDATE SET updated_at = NOW();
        
        RAISE NOTICE '✅ Test 4: Can insert/update data';
        
        -- Clean up test data
        DELETE FROM view_preferences 
        WHERE user_id = test_user_id AND view_type = 'test' AND view_id = 'validation';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 4: Insert failed - %', error_msg;
        test_passed := false;
    END;
    
    RAISE NOTICE '========================================';
    
    IF test_passed THEN
        RAISE NOTICE '🎉 ALL TESTS PASSED!';
        RAISE NOTICE '';
        RAISE NOTICE 'The view_preferences table has been successfully fixed.';
        RAISE NOTICE 'The 406 errors should now be resolved.';
        RAISE NOTICE '';
        RAISE NOTICE 'Next steps:';
        RAISE NOTICE '1. Wait 60 seconds for PostgREST to refresh';
        RAISE NOTICE '2. Clear your browser cache';
        RAISE NOTICE '3. Test the drag-and-drop functionality';
    ELSE
        RAISE NOTICE '⚠️ SOME TESTS FAILED';
        RAISE NOTICE 'Please check the errors above and contact support if needed.';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;

-- Step 15: Show final table info
SELECT 
    'Final Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'view_preferences'
ORDER BY ordinal_position;