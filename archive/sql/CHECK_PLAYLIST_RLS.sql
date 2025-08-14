-- CHECK PLAYLIST RLS POLICIES
-- See what policies exist on the playlists table

-- 1. Check if RLS is enabled
SELECT 
    'RLS Status' as section,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'playlists';

-- 2. List all policies on playlists table
SELECT 
    'Playlist Policies' as section,
    polname as policy_name,
    polcmd as command,
    pg_get_expr(polqual, polrelid) as using_expression,
    pg_get_expr(polwithcheck, polrelid) as with_check_expression,
    polroles::regrole[] as roles
FROM pg_policy
WHERE polrelid = 'playlists'::regclass;

-- 3. Check if we need a policy for shared access
SELECT 
    'Missing Shared Access?' as section,
    'Need policy for users to see playlists shared with them' as issue,
    'Users can only see their own playlists currently' as current_state;