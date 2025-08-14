-- TARGETED FIX: Fix only the specific issues found
-- This is a surgical fix, not a wholesale change

-- ========================================
-- 1. FIRST, CHECK WHAT WE'RE DEALING WITH
-- ========================================
SELECT 'Current playlists_select_shared policy:' as info;
SELECT qual::text as current_policy_definition
FROM pg_policies
WHERE tablename = 'playlists' 
AND policyname = 'playlists_select_shared';

-- ========================================
-- 2. FIX THE RECURSIVE POLICY
-- ========================================
-- Drop only the problematic policy
DROP POLICY IF EXISTS "playlists_select_shared" ON playlists;

-- Recreate it without recursion
-- Instead of checking playlist_shares which might check back to playlists,
-- we'll use a simpler subquery that doesn't create a loop
CREATE POLICY "playlists_select_shared" ON playlists
FOR SELECT USING (
    -- User owns the playlist
    auth.uid() = user_id
    OR
    -- Playlist is shared with user (direct email check, no back-reference)
    EXISTS (
        SELECT 1 
        FROM playlist_shares ps
        WHERE ps.playlist_id = playlists.id
        AND LOWER(ps.shared_with_email) = (
            SELECT LOWER(email) 
            FROM auth.users 
            WHERE id = auth.uid() 
            LIMIT 1
        )
    )
);

-- ========================================
-- 3. CHECK/CREATE VIEW_PREFERENCES TABLE
-- ========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'view_preferences' 
        AND table_schema = 'public'
    ) THEN
        -- Create the table
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
        
        -- Create simple policies
        CREATE POLICY "view_preferences_select" ON view_preferences
            FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "view_preferences_insert" ON view_preferences
            FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "view_preferences_update" ON view_preferences
            FOR UPDATE USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "view_preferences_delete" ON view_preferences
            FOR DELETE USING (auth.uid() = user_id);
        
        -- Grant permissions
        GRANT ALL ON view_preferences TO authenticated;
        GRANT SELECT ON view_preferences TO anon;
        
        RAISE NOTICE '✅ Created view_preferences table with RLS policies';
    ELSE
        RAISE NOTICE 'ℹ️ view_preferences table already exists';
    END IF;
END $$;

-- ========================================
-- 4. ENSURE PLAYLIST_SHARES HAS SIMPLE POLICIES
-- ========================================
-- Check if playlist_shares policies might be causing issues
SELECT 'Checking playlist_shares policies:' as info;
SELECT policyname, LEFT(qual::text, 100) as condition_preview
FROM pg_policies
WHERE tablename = 'playlist_shares';

-- If there are complex policies, simplify them
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'playlist_shares'
    AND qual::text LIKE '%playlists%playlists%';  -- Looking for potential loops
    
    IF policy_count > 0 THEN
        -- Drop and recreate with simpler logic
        DROP POLICY IF EXISTS "playlist_shares_select" ON playlist_shares;
        DROP POLICY IF EXISTS "playlist_shares_all" ON playlist_shares;
        
        -- Simple policy: you can see shares if you're the owner or recipient
        CREATE POLICY "playlist_shares_simple" ON playlist_shares
        FOR SELECT USING (
            -- You created the share
            shared_by = auth.uid()
            OR
            -- You're the recipient
            LOWER(shared_with_email) = (
                SELECT LOWER(email) 
                FROM auth.users 
                WHERE id = auth.uid() 
                LIMIT 1
            )
        );
        
        -- Allow playlist owners to manage shares
        CREATE POLICY "playlist_shares_manage" ON playlist_shares
        FOR ALL USING (
            shared_by = auth.uid()
        );
        
        RAISE NOTICE '✅ Simplified playlist_shares policies';
    ELSE
        RAISE NOTICE 'ℹ️ playlist_shares policies look OK';
    END IF;
END $$;

-- ========================================
-- 5. TEST THE FIXES
-- ========================================
DO $$
DECLARE
    test_passed BOOLEAN := true;
    error_msg TEXT;
BEGIN
    -- Test 1: Can we query playlists without recursion error?
    BEGIN
        PERFORM COUNT(*) FROM playlists WHERE user_id = '38fd46e9-3c9e-4cd9-8d6c-b35891b3c43f';
        RAISE NOTICE '✅ Test 1 PASSED: Playlists query works';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 1 FAILED: %', error_msg;
        test_passed := false;
    END;
    
    -- Test 2: Can we query view_preferences?
    BEGIN
        PERFORM COUNT(*) FROM view_preferences WHERE user_id = auth.uid();
        RAISE NOTICE '✅ Test 2 PASSED: view_preferences query works';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 2 FAILED: %', error_msg;
        test_passed := false;
    END;
    
    -- Test 3: Can we query playlist_shares?
    BEGIN
        PERFORM COUNT(*) FROM playlist_shares LIMIT 1;
        RAISE NOTICE '✅ Test 3 PASSED: playlist_shares query works';
    EXCEPTION WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE '❌ Test 3 FAILED: %', error_msg;
        test_passed := false;
    END;
    
    IF test_passed THEN
        RAISE NOTICE '';
        RAISE NOTICE '===========================================';
        RAISE NOTICE '🎉 ALL FIXES APPLIED SUCCESSFULLY!';
        RAISE NOTICE '===========================================';
        RAISE NOTICE 'The following issues should be resolved:';
        RAISE NOTICE '✅ 500 errors (infinite recursion) - FIXED';
        RAISE NOTICE '✅ 406 errors (view_preferences) - FIXED';
        RAISE NOTICE '';
        RAISE NOTICE 'Please refresh your app to test.';
        RAISE NOTICE '===========================================';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️ Some tests failed. Review the errors above.';
    END IF;
END $$;