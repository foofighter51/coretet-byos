-- Verify which account you're currently logged in with

-- 1. Your current login
SELECT 
  auth.uid() as your_current_user_id,
  email as you_are_logged_in_as
FROM auth.users 
WHERE id = auth.uid();

-- 2. What this account owns
SELECT 
  COUNT(*) as tracks_you_own,
  COUNT(DISTINCT p.id) as playlists_you_own
FROM tracks t
FULL OUTER JOIN playlists p ON p.user_id = auth.uid()
WHERE t.user_id = auth.uid() OR p.user_id = auth.uid();

-- 3. What's been shared with this account
SELECT 
  COUNT(*) as playlists_shared_with_you
FROM playlist_shares ps
WHERE ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
AND ps.status = 'active';

-- If you're logged in as eric@exleycorp.com, you need to:
-- 1. Log out and log back in as ericexley@gmail.com to see your tracks
-- 2. Or share playlists from ericexley@gmail.com to eric@exleycorp.com