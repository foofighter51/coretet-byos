-- TEST APP CONNECTION AND RLS POLICIES

-- 1. Check current RLS policies on tracks table
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'tracks'
ORDER BY policyname;

-- 2. Check if there's a policy that might be blocking
-- Look for policies that use auth.uid() = user_id
SELECT 
    policyname,
    CASE 
        WHEN qual LIKE '%auth.uid()%=%user_id%' THEN 'Standard user policy'
        WHEN qual LIKE '%role%=%admin%' THEN 'Admin policy'
        ELSE 'Other policy'
    END as policy_type,
    qual as full_condition
FROM pg_policies
WHERE tablename = 'tracks'
AND cmd = 'SELECT';

-- 3. Test if we can create a simpler policy temporarily
-- This will help debug if the issue is with RLS

-- First, check existing policies that might conflict
SELECT COUNT(*) as existing_policies
FROM pg_policies
WHERE tablename = 'tracks'
AND policyname LIKE '%view own tracks%';

-- 4. Create a debug policy that logs what's happening
-- ONLY RUN THIS IF YOU WANT TO DEBUG
/*
CREATE POLICY "debug_ericexley_tracks" ON tracks
FOR SELECT
TO authenticated
USING (
    user_id = '55a58df9-3698-4973-9add-b82d76cde766'::uuid
);
*/

-- 5. After running the app, check if this helps
-- Then immediately remove it:
/*
DROP POLICY IF EXISTS "debug_ericexley_tracks" ON tracks;
*/