-- First, drop the open policy that allows anyone to upload
DROP POLICY IF EXISTS "Allow authenticated uploads to audio-files" ON storage.objects;

-- Make sure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 1. Allow users to upload their own files (path must start with their user ID)
CREATE POLICY "Users can upload own audio files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 2. Allow users to view only their own files
CREATE POLICY "Users can view own audio files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 3. Allow users to update their own files
CREATE POLICY "Users can update own audio files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- 4. Allow users to delete their own files
CREATE POLICY "Users can delete own audio files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Also update the bucket to be private (not public)
-- This requires changing the bucket settings in the Supabase dashboard
-- Go to Storage > audio-files > Settings > Toggle "Public bucket" OFF