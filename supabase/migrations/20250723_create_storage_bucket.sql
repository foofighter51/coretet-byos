-- Create storage bucket for audio files
INSERT INTO storage.buckets (id, name, public, avif_autodetection, allowed_mime_types, file_size_limit)
VALUES (
  'audio-files',
  'audio-files', 
  true, -- Set to public for easier access, adjust based on your needs
  false,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/wav', 'audio/flac', 'audio/m4a'],
  104857600 -- 100MB limit per file
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for the audio-files bucket
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own audio files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'audio-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to view their own files
CREATE POLICY "Users can view own audio files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own audio files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'audio-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public to view files if bucket is public
-- Remove this policy if you want files to be private
CREATE POLICY "Public can view audio files"
ON storage.objects
FOR SELECT
TO anon
USING (bucket_id = 'audio-files');