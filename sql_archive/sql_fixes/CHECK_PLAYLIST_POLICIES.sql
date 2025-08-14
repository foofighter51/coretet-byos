-- Simple check for playlist policies
SELECT COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename = 'playlists'
AND policyname = 'Users can view playlists shared with them';

-- If count is 0, the policy doesn't exist yet
-- If count is 1, the policy was created successfully