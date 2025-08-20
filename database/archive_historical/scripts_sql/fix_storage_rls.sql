-- Check if RLS is enabled on storage.objects
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'storage' AND tablename = 'objects';

-- Check existing policies
SELECT 
  pol.polname as policy_name,
  pol.polcmd as command,
  pol.polroles::regrole[] as roles
FROM pg_policy pol
JOIN pg_class cls ON pol.polrelid = cls.oid
JOIN pg_namespace nsp ON cls.relnamespace = nsp.oid
WHERE nsp.nspname = 'storage' AND cls.relname = 'objects';

-- Option 1: Add a simple policy that allows authenticated users to insert into audio-files bucket
CREATE POLICY "Allow authenticated uploads to audio-files" 
ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'audio-files');

-- Option 2: If you want to completely bypass RLS for testing, you can disable it
-- WARNING: This will disable security for ALL storage buckets
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;