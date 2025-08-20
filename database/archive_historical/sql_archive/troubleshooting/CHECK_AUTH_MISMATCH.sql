-- Find the auth ID mismatch

-- 1. Show your ACTUAL auth.uid() when logged in as ericexley@gmail.com
SELECT 
  auth.uid() as your_actual_auth_id,
  email as your_email
FROM auth.users 
WHERE id = auth.uid();

-- 2. Show what user ID owns the tracks
SELECT 
  '55a58df9-3698-4973-9add-b82d76cde766' as tracks_are_owned_by_this_id,
  82 as track_count;

-- 3. Check if there are multiple users with ericexley@gmail.com
SELECT 
  id as user_id,
  email,
  created_at,
  CASE 
    WHEN id = auth.uid() THEN '← YOU ARE LOGGED IN AS THIS'
    ELSE ''
  END as current_user
FROM auth.users
WHERE email = 'ericexley@gmail.com'
ORDER BY created_at;

-- 4. Let's see if the user IDs are somehow different (case, formatting, etc)
SELECT 
  auth.uid()::text as your_auth_id_as_text,
  '55a58df9-3698-4973-9add-b82d76cde766'::text as expected_id_as_text,
  auth.uid()::text = '55a58df9-3698-4973-9add-b82d76cde766'::text as do_they_match;