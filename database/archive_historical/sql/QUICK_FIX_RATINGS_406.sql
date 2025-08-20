-- QUICK FIX FOR 406 ERRORS ON RATINGS
-- Make rating tables completely public for now

-- 1. Drop all policies and make public
ALTER TABLE personal_track_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_track_ratings DISABLE ROW LEVEL SECURITY;

-- 2. Grant full access
GRANT ALL ON personal_track_ratings TO authenticated;
GRANT ALL ON playlist_track_ratings TO authenticated;
GRANT ALL ON playlist_track_rating_summary TO authenticated;

-- 3. Test
SELECT 'Ratings Access Test' as result, COUNT(*) as count FROM personal_track_ratings;