-- First, ensure RLS is enabled on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view audio files" ON storage.objects;

-- Create new policies with correct path checking
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update own audio files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  auth.uid()::text = (string_to_array(name, '/'))[1]
);

-- Optional: Allow public to view all files (remove if you want files to be private)
-- CREATE POLICY "Public can view audio files"
-- ON storage.objects
-- FOR SELECT
-- TO anon
-- USING (bucket_id = 'audio-files');