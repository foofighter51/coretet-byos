-- PART 3: Create new secure policies
-- Run this after Part 2

-- Users can only upload to their own folder
CREATE POLICY "Users can upload to their own folder" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'audio-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only view their own files
CREATE POLICY "Users can view their own files" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'audio-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only delete their own files
CREATE POLICY "Users can delete their own files" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'audio-files' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );