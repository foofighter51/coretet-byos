-- Test metadata update
-- First, let's find a track to test with
SELECT id, name, tempo, key, time_signature, genre, mood, notes
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- Test updating a single track (replace the ID with one from above)
-- This will help us see if the update works directly in SQL
/*
UPDATE tracks 
SET 
    tempo = 120,
    key = 'C Major',
    time_signature = '4/4',
    genre = 'Rock',
    mood = 'Energetic',
    notes = 'Test update from SQL'
WHERE id = 'YOUR-TRACK-ID-HERE'
  AND user_id = auth.uid()
RETURNING id, name, tempo, key, time_signature, genre, mood, notes;
*/

-- Check if there are any RLS policies blocking updates
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'tracks'
  AND cmd = 'UPDATE';

-- Check if user has update permission on tracks table
SELECT has_table_privilege(auth.uid(), 'tracks', 'UPDATE');