-- EMERGENCY FIX: Restore original RLS policy

-- Drop all the new policies
DROP POLICY IF EXISTS "Users can view their own non-deleted tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view their own deleted tracks" ON tracks;
DROP POLICY IF EXISTS "Users can view own tracks" ON tracks;
DROP POLICY IF EXISTS "Users can soft delete their own tracks" ON tracks;

-- Recreate the original simple policy
CREATE POLICY "Users can view their own tracks" 
ON tracks FOR SELECT 
USING (auth.uid() = user_id);

-- Also restore update and delete policies
CREATE POLICY "Users can update their own tracks" 
ON tracks FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tracks" 
ON tracks FOR DELETE 
USING (auth.uid() = user_id);

-- Verify tracks are visible
SELECT COUNT(*) as total_tracks FROM tracks WHERE user_id = auth.uid();

-- Clear any accidental deletions
UPDATE tracks SET deleted_at = NULL WHERE user_id = auth.uid();