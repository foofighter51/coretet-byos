-- PART 1: Make storage bucket private
-- Run this first to immediately stop public access

-- 1. Revoke public access to the storage bucket
UPDATE storage.buckets 
SET public = false 
WHERE id = 'audio-files';

-- 2. Drop the dangerous anonymous access policy
DROP POLICY IF EXISTS "Public can view audio files" ON storage.objects;