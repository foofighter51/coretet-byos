-- EMERGENCY FIX: Secure storage bucket and fix file access
-- This migration fixes the critical security issue where all users can access all files

-- 1. First, revoke public access to the storage bucket
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audio-files';

-- 2. Drop the dangerous anonymous access policy
DROP POLICY IF EXISTS "Public can view audio files" ON storage.objects;

-- 3. Drop existing authenticated user policies to recreate them properly
DROP POLICY IF EXISTS "Authenticated users can upload audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;

-- 4. Create proper storage policies that respect ownership
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

-- 5. Add policy for viewing files in shared playlists
CREATE POLICY "Users can view files in shared playlists" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'audio-files' AND
    EXISTS (
      SELECT 1 FROM tracks t
      JOIN playlist_tracks pt ON pt.track_id = t.id
      JOIN playlists p ON p.id = pt.playlist_id
      LEFT JOIN playlist_shares ps ON ps.playlist_id = p.id
      WHERE t.storage_path = name
      AND (
        p.user_id = auth.uid() OR
        (ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND ps.status = 'active')
      )
    )
  );

-- 6. Fix the tracks table RLS policy that was too permissive
DROP POLICY IF EXISTS "Users can view tracks they have access to" ON tracks;

-- Replace with a more restrictive policy
CREATE POLICY "Users can view own tracks" ON tracks
  FOR SELECT
  USING (user_id = auth.uid());

-- Separate policy for viewing tracks in shared playlists
CREATE POLICY "Users can view tracks in shared playlists" ON tracks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlist_tracks pt
      JOIN playlists p ON p.id = pt.playlist_id
      JOIN playlist_shares ps ON ps.playlist_id = p.id
      WHERE pt.track_id = tracks.id
      AND ps.shared_with_email = (SELECT email FROM auth.users WHERE id = auth.uid())
      AND ps.status = 'active'
    )
  );

-- 7. Important note: After running this migration, you'll need to:
-- a) Update all existing file paths to include user IDs
-- b) Regenerate all signed URLs (public URLs will no longer work)
-- c) Test thoroughly to ensure collaborators can still access shared tracks