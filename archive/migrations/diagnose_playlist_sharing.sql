-- DIAGNOSE PLAYLIST SHARING ISSUES
-- Let's understand the current state of playlist sharing

-- ========================================
-- 1. CHECK PLAYLIST_SHARES TABLE STRUCTURE
-- ========================================
SELECT 'PLAYLIST_SHARES TABLE STRUCTURE:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'playlist_shares'
ORDER BY ordinal_position;

-- ========================================
-- 2. CHECK EXISTING SHARES
-- ========================================
SELECT 'EXISTING PLAYLIST SHARES:' as info;
SELECT 
    ps.id,
    ps.playlist_id,
    p.name as playlist_name,
    ps.shared_by,
    ps.shared_with_email,
    ps.status,
    ps.can_rate,
    ps.can_edit,
    ps.created_at
FROM playlist_shares ps
LEFT JOIN playlists p ON ps.playlist_id = p.id
ORDER BY ps.created_at DESC
LIMIT 10;

-- ========================================
-- 3. CHECK RLS POLICIES ON PLAYLIST_SHARES
-- ========================================
SELECT 'PLAYLIST_SHARES POLICIES:' as info;
SELECT 
    policyname,
    cmd,
    permissive,
    roles,
    qual::text as condition
FROM pg_policies
WHERE tablename = 'playlist_shares'
ORDER BY policyname;

-- ========================================
-- 4. CHECK IF USERS CAN SEE SHARED PLAYLISTS
-- ========================================
SELECT 'TEST: Can users see playlists shared with them?' as info;
DO $$
DECLARE
    test_email TEXT := 'ericexley@hotmail.com';
    shared_count INTEGER;
BEGIN
    -- Count playlists shared with this email
    SELECT COUNT(*) INTO shared_count
    FROM playlist_shares
    WHERE LOWER(shared_with_email) = LOWER(test_email);
    
    RAISE NOTICE 'Playlists shared with %: %', test_email, shared_count;
    
    -- Check if they can actually see them through the policy
    SELECT COUNT(*) INTO shared_count
    FROM playlists p
    WHERE EXISTS (
        SELECT 1 FROM playlist_shares ps
        WHERE ps.playlist_id = p.id
        AND LOWER(ps.shared_with_email) = LOWER(test_email)
    );
    
    RAISE NOTICE 'Playlists visible through policy: %', shared_count;
END $$;

-- ========================================
-- 5. CHECK USER PLAYLISTS AND ABILITY TO SHARE
-- ========================================
SELECT 'USER PLAYLISTS:' as info;
SELECT 
    p.id,
    p.name,
    p.user_id,
    u.email as owner_email,
    p.created_at,
    (SELECT COUNT(*) FROM playlist_shares ps WHERE ps.playlist_id = p.id) as share_count
FROM playlists p
JOIN auth.users u ON p.user_id = u.id
ORDER BY p.created_at DESC
LIMIT 10;

-- ========================================
-- 6. TEST SHARING FUNCTIONALITY
-- ========================================
DO $$
DECLARE
    test_playlist_id UUID;
    test_owner_id UUID;
    test_share_id UUID;
    error_msg TEXT;
BEGIN
    -- Get a test playlist
    SELECT id, user_id INTO test_playlist_id, test_owner_id
    FROM playlists
    LIMIT 1;
    
    IF test_playlist_id IS NULL THEN
        RAISE NOTICE 'No playlists exist to test sharing';
    ELSE
        -- Try to create a test share
        BEGIN
            INSERT INTO playlist_shares (
                playlist_id,
                shared_by,
                shared_with_email,
                status,
                can_rate,
                can_edit
            ) VALUES (
                test_playlist_id,
                test_owner_id,
                'test@example.com',
                'pending',
                true,
                false
            ) RETURNING id INTO test_share_id;
            
            RAISE NOTICE '✅ Test share created successfully: %', test_share_id;
            
            -- Clean up test
            DELETE FROM playlist_shares WHERE id = test_share_id;
            RAISE NOTICE '✅ Test share cleaned up';
            
        EXCEPTION WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
            RAISE NOTICE '❌ Failed to create test share: %', error_msg;
        END;
    END IF;
END $$;

-- ========================================
-- 7. CHECK PLAYLIST_TRACKS ACCESS FOR SHARED PLAYLISTS
-- ========================================
SELECT 'PLAYLIST_TRACKS POLICIES:' as info;
SELECT 
    policyname,
    cmd,
    qual::text as condition
FROM pg_policies
WHERE tablename = 'playlist_tracks'
ORDER BY policyname;

-- ========================================
-- 8. IDENTIFY MISSING COMPONENTS
-- ========================================
DO $$
DECLARE
    has_share_table BOOLEAN;
    has_share_policies BOOLEAN;
    has_playlist_policies BOOLEAN;
    can_insert_shares BOOLEAN;
BEGIN
    -- Check table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'playlist_shares'
    ) INTO has_share_table;
    
    -- Check policies exist
    SELECT COUNT(*) > 0 INTO has_share_policies
    FROM pg_policies WHERE tablename = 'playlist_shares';
    
    SELECT COUNT(*) > 0 INTO has_playlist_policies
    FROM pg_policies 
    WHERE tablename = 'playlists' 
    AND policyname LIKE '%shared%';
    
    -- Check if users can insert shares
    SELECT COUNT(*) > 0 INTO can_insert_shares
    FROM pg_policies 
    WHERE tablename = 'playlist_shares'
    AND cmd = 'INSERT';
    
    RAISE NOTICE '';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'SHARING SYSTEM STATUS:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'playlist_shares table exists: %', CASE WHEN has_share_table THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE 'playlist_shares has policies: %', CASE WHEN has_share_policies THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE 'playlists has sharing policies: %', CASE WHEN has_playlist_policies THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE 'Users can create shares: %', CASE WHEN can_insert_shares THEN '✅ YES' ELSE '❌ NO' END;
    RAISE NOTICE '';
    RAISE NOTICE 'Common issues to check:';
    RAISE NOTICE '1. Missing INSERT policy for playlist_shares';
    RAISE NOTICE '2. UI not sending correct data';
    RAISE NOTICE '3. Status field blocking access';
    RAISE NOTICE '4. Email matching issues';
    RAISE NOTICE '===========================================';
END $$;