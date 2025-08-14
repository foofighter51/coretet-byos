-- RESET RLS POLICIES TO ORIGINAL STATE

-- 1. Drop ALL policies on tracks table
DROP POLICY IF EXISTS "Users can view their own non-deleted tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view their own deleted tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can soft delete their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can update their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can delete their own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can insert their own tracks" ON tracks;

-- 2. Check if any policies remain
SELECT policyname FROM pg_policies WHERE tablename = 'tracks';

-- 3. Create the simple original policies
CREATE POLICY "Users can view their own tracks" 
ON tracks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tracks" 
ON tracks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tracks" 
ON tracks FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" 
ON tracks FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Make sure no tracks are marked as deleted
UPDATE tracks SET deleted_at = NULL WHERE deleted_at IS NOT NULL;

-- 5. Verify the fix
SELECT 
    'Tracks visible after fix:' as status,
    COUNT(*) as track_count 
FROM tracks 
WHERE user_id = auth.uid();

-- 6. Double check with your specific email
SELECT 
    'Tracks for ericexley@gmail.com:' as status,
    COUNT(*) as track_count 
FROM tracks t
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'ericexley@gmail.com';