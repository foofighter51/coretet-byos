-- Check current RLS policies for tracks table UPDATE operation
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'tracks'
  AND cmd = 'UPDATE';

-- Check if RLS is enabled on tracks table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'tracks';

-- Test if we can update metadata fields directly
-- This will help determine if it's a permission issue or something else
DO $$
DECLARE
    test_track_id UUID;
BEGIN
    -- Get a track ID for testing
    SELECT id INTO test_track_id
    FROM tracks
    WHERE user_id = auth.uid()
    LIMIT 1;
    
    IF test_track_id IS NOT NULL THEN
        -- Try to update metadata fields
        UPDATE tracks
        SET 
            tempo = 123,
            key = 'Test Key',
            time_signature = 'Test TS'
        WHERE id = test_track_id
          AND user_id = auth.uid();
        
        -- Check if update was successful
        RAISE NOTICE 'Update attempted on track %', test_track_id;
        
        -- Rollback the test update
        ROLLBACK;
    ELSE
        RAISE NOTICE 'No tracks found for current user';
    END IF;
END $$;