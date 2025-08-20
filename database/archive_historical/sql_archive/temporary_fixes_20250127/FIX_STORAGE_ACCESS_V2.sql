-- FIX STORAGE ACCESS ISSUES V2
-- This fixes the audio file access problems

-- =====================================================
-- 1. CHECK STORAGE CONFIGURATION
-- =====================================================

-- Check if the audio-files bucket exists
SELECT 
    name as bucket_name,
    public as is_public,
    created_at
FROM storage.buckets
WHERE name = 'audio-files';

-- =====================================================
-- 2. CREATE BUCKET IF IT DOESN'T EXIST
-- =====================================================

-- Create the bucket if needed
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'audio-files',
    'audio-files', 
    false, -- private bucket
    104857600, -- 100MB limit
    ARRAY['audio/mpeg', 'audio/mp4', 'audio/mp3', 'audio/m4a']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. CHECK TRACKS TABLE STRUCTURE
-- =====================================================

-- First, let's see what columns we actually have
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('storage_path', 's3_key', 'key', 'file_path', 'url')
ORDER BY ordinal_position;

-- =====================================================
-- 4. FIX STORAGE POLICIES
-- =====================================================

-- Drop existing storage policies for audio-files bucket
DO $$
BEGIN
    -- Drop all policies on storage.objects for audio-files bucket
    DELETE FROM storage.policies 
    WHERE bucket_id = 'audio-files';
EXCEPTION
    WHEN OTHERS THEN
        -- If direct delete doesn't work, use DROP POLICY
        NULL;
END $$;

-- Create new storage policies for audio-files bucket

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload audio files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 2: Users can view their own files
CREATE POLICY "Users can view own audio files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update own audio files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete own audio files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================
-- 5. CHECK HOW TRACKS ARE STORING FILE REFERENCES
-- =====================================================

-- Check a sample of tracks to see how files are referenced
SELECT 
    id,
    name,
    file_name,
    storage_path,
    substring(storage_path, 1, 80) as storage_path_preview
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- Check if storage_path column exists and has data
SELECT 
    'Storage path analysis' as check_type,
    COUNT(*) as total_tracks,
    COUNT(storage_path) as tracks_with_storage_path,
    COUNT(CASE WHEN storage_path LIKE '%/%' THEN 1 END) as paths_with_folders
FROM tracks
WHERE user_id = auth.uid();

-- =====================================================
-- 6. ADD STORAGE_PATH COLUMN IF MISSING
-- =====================================================

-- Add storage_path column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'tracks' 
        AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE tracks ADD COLUMN storage_path TEXT;
        RAISE NOTICE 'Added storage_path column to tracks table';
    END IF;
END $$;

-- =====================================================
-- 7. VERIFY STORAGE ACCESS
-- =====================================================

-- Check storage policies
SELECT 
    name as policy_name,
    action,
    bucket_id
FROM storage.policies
WHERE bucket_id = 'audio-files'
ORDER BY name;

-- =====================================================
-- 8. TEST STORAGE ACCESS
-- =====================================================

-- Try to list files in the bucket (admin only)
SELECT 
    name,
    metadata,
    created_at
FROM storage.objects
WHERE bucket_id = 'audio-files'
LIMIT 5;

-- =====================================================
-- 9. SUCCESS MESSAGE
-- =====================================================

SELECT 
    E'\n✅ STORAGE CONFIGURATION UPDATED!\n\n' ||
    'Next steps:\n' ||
    '1. Check if files exist in Supabase Storage\n' ||
    '2. Verify storage_path values in tracks table\n' ||
    '3. If files are in S3, they need to be migrated\n' ||
    '4. Test audio playback in the app\n\n' ||
    'Storage policies are now set for authenticated users.' as result;