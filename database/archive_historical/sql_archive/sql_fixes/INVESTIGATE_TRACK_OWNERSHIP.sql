-- Investigate track ownership issues

-- 1. Show your current user ID
SELECT 
  auth.uid() as your_current_user_id,
  email as your_email
FROM auth.users 
WHERE id = auth.uid();

-- 2. Show all unique user_ids that own tracks
SELECT DISTINCT 
  t.user_id as track_owner_id,
  p.email as owner_email,
  COUNT(*) as track_count
FROM tracks t
LEFT JOIN profiles p ON p.id = t.user_id
GROUP BY t.user_id, p.email
ORDER BY track_count DESC;

-- 3. Check if there are any tracks at all
SELECT COUNT(*) as total_tracks_in_database FROM tracks;

-- 4. Sample of first 5 tracks to see their user_ids
SELECT 
  t.id,
  t.title,
  t.user_id as track_owner,
  p.email as owner_email
FROM tracks t
LEFT JOIN profiles p ON p.id = t.user_id
LIMIT 5;