-- Check if there's a user ID mismatch

-- 1. Show your current auth user ID and email
SELECT 
  auth.uid() as your_current_auth_id,
  email as your_current_email
FROM auth.users 
WHERE id = auth.uid();

-- 2. Find all users with your email domain
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email LIKE '%ericexley%' OR email LIKE '%exleycorp%'
ORDER BY created_at;

-- 3. Check which user owns the tracks
SELECT 
  '55a58df9-3698-4973-9add-b82d76cde766' as tracks_owned_by_this_id,
  'ericexley@gmail.com' as with_this_email,
  82 as track_count;

-- If your auth.uid() doesn't match 55a58df9-3698-4973-9add-b82d76cde766,
-- then you're logged in with a different account than the one that owns the tracks