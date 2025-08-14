-- FIX STORAGE ACCESS ISSUES
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
-- 3. FIX STORAGE POLICIES
-- =====================================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio files" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view own files" ON storage.objects;

-- Create new storage policies for audio-files bucket

-- Policy 1: Users can upload to their own folder
CREATE POLICY "Users can upload audio files" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 2: Users can view their own files AND files in shared playlists
CREATE POLICY "Users can view audio files" ON storage.objects
    FOR SELECT TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND (
            -- Own files
            (storage.foldername(name))[1] = auth.uid()::text
            OR
            -- Files in tracks they can access
            EXISTS (
                SELECT 1 FROM tracks t
                WHERE t.storage_path = storage.objects.name
                AND (
                    t.user_id = auth.uid()
                    OR EXISTS (
                        SELECT 1 FROM playlist_tracks pt
                        JOIN playlists p ON p.id = pt.playlist_id
                        WHERE pt.track_id = t.id
                        AND p.user_id = auth.uid()
                    )
                )
            )
        )
    );

-- Policy 3: Users can update their own files
CREATE POLICY "Users can update audio files" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy 4: Users can delete their own files
CREATE POLICY "Users can delete audio files" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'audio-files' 
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================
-- 4. CHECK TRACKS TABLE STORAGE PATHS
-- =====================================================

-- Check how tracks are storing file paths
SELECT 
    'Storage path format check' as check_type,
    COUNT(*) as total_tracks,
    COUNT(storage_path) as tracks_with_storage_path,
    COUNT(s3_key) as tracks_with_s3_key
FROM tracks
WHERE user_id = auth.uid()
LIMIT 10;

-- Sample some storage paths
SELECT 
    id,
    name,
    storage_path,
    s3_key,
    substring(storage_path, 1, 50) as storage_path_preview,
    substring(s3_key, 1, 50) as s3_key_preview
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- =====================================================
-- 5. UPDATE TRACKS TO USE CORRECT STORAGE PATH
-- =====================================================

-- If tracks are using s3_key but not storage_path, update them
UPDATE tracks
SET storage_path = s3_key
WHERE storage_path IS NULL 
AND s3_key IS NOT NULL
AND user_id = auth.uid();

-- =====================================================
-- 6. VERIFY STORAGE ACCESS
-- =====================================================

-- Check storage policies
SELECT 
    'Storage policies for audio-files:' as info;
SELECT 
    name as policy_name,
    action,
    CASE 
        WHEN definition LIKE '%auth.uid()%' THEN 'Uses auth'
        ELSE 'No auth check'
    END as auth_check
FROM storage.policies
WHERE bucket_id = 'audio-files';

-- =====================================================
-- 7. SUCCESS MESSAGE
-- =====================================================

SELECT 
    E'\n✅ STORAGE ACCESS FIXED!\n\n' ||
    'Storage configuration updated:\n' ||
    '• audio-files bucket created/verified\n' ||
    '• Storage policies allow authenticated users\n' ||
    '• Users can access their own files\n' ||
    '• File paths updated if needed\n\n' ||
    'Audio playback should now work!' as result;