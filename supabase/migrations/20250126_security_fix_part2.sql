-- PART 2: Drop old policies
-- Run this after Part 1

DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;