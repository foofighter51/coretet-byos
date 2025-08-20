-- Debug auth issue in the actual app
-- Run this query through your app's Supabase client, not the SQL editor

-- This will show what user the APP thinks you are
SELECT 
  auth.uid() as app_auth_uid,
  u.email as app_email,
  p.email as profile_email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE u.id = auth.uid();

-- Also check if the profile exists
SELECT 
  id,
  email,
  storage_used
FROM profiles
WHERE email = 'ericexley@gmail.com';