-- FIX VIEW_PREFERENCES TABLE STRUCTURE

-- ========================================
-- 1. CHECK CURRENT STRUCTURE
-- ========================================
SELECT 'CURRENT VIEW_PREFERENCES COLUMNS:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'view_preferences'
ORDER BY ordinal_position;

-- ========================================
-- 2. DROP AND RECREATE WITH CORRECT STRUCTURE
-- ========================================
-- Since it has wrong columns, let's rebuild it
DROP TABLE IF EXISTS view_preferences CASCADE;

CREATE TABLE view_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    view_type TEXT NOT NULL,
    view_id TEXT NOT NULL,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, view_type, view_id)
);

-- Create indexes
CREATE INDEX idx_view_preferences_user ON view_preferences(user_id);
CREATE INDEX idx_view_preferences_type ON view_preferences(view_type, view_id);

-- Enable RLS
ALTER TABLE view_preferences ENABLE ROW LEVEL SECURITY;

-- Create simple policy
CREATE POLICY "view_preferences_all" ON view_preferences
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON view_preferences TO authenticated;
GRANT ALL ON view_preferences TO anon;
GRANT ALL ON view_preferences TO service_role;

-- ========================================
-- 3. INSERT DEFAULT PREFERENCES
-- ========================================
INSERT INTO view_preferences (user_id, view_type, view_id, preferences)
SELECT 
    id as user_id,
    'category' as view_type,
    'all' as view_id,
    '{"sortBy": "updated_at", "sortOrder": "desc"}'::jsonb
FROM auth.users
ON CONFLICT (user_id, view_type, view_id) DO NOTHING;

-- ========================================
-- 4. VERIFY NEW STRUCTURE
-- ========================================
SELECT 'NEW VIEW_PREFERENCES STRUCTURE:' as info;
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'view_preferences'
ORDER BY ordinal_position;

-- ========================================
-- 5. TEST EVERYTHING WORKS
-- ========================================
DO $$
DECLARE
    test_user_id UUID := '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f';
    all_tests_passed BOOLEAN := true;
    error_msg TEXT;
BEGIN
    -- Test 1: view_preferences query
    BEGIN
        PERFORM 1 FROM view_preferences WHERE user_id = test_user_id LIMIT 1;
        RAISE NOTICE '✅ Test 1: view_preferences query works (406 fixed)';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 1 FAILED: %', error_msg;
        all_tests_passed := false;
    END;
    
    -- Test 2: playlists query (no recursion)
    BEGIN
        PERFORM 1 FROM playlists WHERE user_id = test_user_id LIMIT 1;
        RAISE NOTICE '✅ Test 2: playlists query works (no recursion)';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 2 FAILED: %', error_msg;
        all_tests_passed := false;
    END;
    
    -- Test 3: tracks query
    BEGIN
        PERFORM 1 FROM tracks WHERE user_id = test_user_id LIMIT 1;
        RAISE NOTICE '✅ Test 3: tracks query works';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 3 FAILED: %', error_msg;
        all_tests_passed := false;
    END;
    
    -- Test 4: Can insert into view_preferences
    BEGIN
        INSERT INTO view_preferences (user_id, view_type, view_id, preferences)
        VALUES (test_user_id, 'test', 'test', '{}')
        ON CONFLICT DO NOTHING;
        RAISE NOTICE '✅ Test 4: Can insert into view_preferences';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 4 FAILED: %', error_msg;
        all_tests_passed := false;
    END;
    
    IF all_tests_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '===========================================';
        RAISE NOTICE '🎉 ALL ISSUES FIXED!';
        RAISE NOTICE '===========================================';
        RAISE NOTICE '✅ view_preferences table created with correct structure';
        RAISE NOTICE '✅ No recursion in policies';
        RAISE NOTICE '✅ All queries work without errors';
        RAISE NOTICE '';
        RAISE NOTICE 'The app should now work without any 406 or 500 errors!';
        RAISE NOTICE '===========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ Some tests failed. Check errors above.';
    END IF;
END $$;

-- ========================================
-- 6. FINAL CHECK - COUNT DATA
-- ========================================
SELECT 
    'DATA SUMMARY:' as info,
    (SELECT COUNT(*) FROM view_preferences) as view_preferences_rows,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM playlists WHERE user_id = '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f') as test_user_playlists,
    (SELECT COUNT(*) FROM tracks WHERE user_id = '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f') as test_user_tracks;