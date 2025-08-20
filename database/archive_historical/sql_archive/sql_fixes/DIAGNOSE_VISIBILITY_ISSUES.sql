-- Diagnose visibility issues for both main user and collaborators

-- 1. First, check your current user ID and email
SELECT 
  auth.uid() as your_user_id,
  email as your_email
FROM auth.users 
WHERE id = auth.uid();

-- 2. Check if you have any tracks in the database
SELECT COUNT(*) as total_tracks FROM tracks;
SELECT COUNT(*) as your_tracks FROM tracks WHERE user_id = auth.uid();

-- 3. Check if there are any active playlist shares for your email
SELECT 
  ps.id,
  ps.playlist_id,
  ps.shared_with_email,
  ps.status,
  p.name as playlist_name
FROM playlist_shares ps
JOIN playlists p ON p.id = ps.playlist_id
WHERE ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND ps.status = 'active';

-- 4. Check all policies on tracks table to see what might be blocking
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'tracks'
ORDER BY policyname;