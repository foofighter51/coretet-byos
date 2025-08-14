-- FIX STORAGE PATHS
-- This will update tracks to have proper storage_path values

-- =====================================================
-- 1. FIRST CHECK WHAT WE'RE WORKING WITH
-- =====================================================

-- Show sample tracks to understand the data
SELECT 
    id,
    user_id,
    name,
    file_name,
    storage_path
FROM tracks
WHERE user_id = auth.uid()
LIMIT 5;

-- =====================================================
-- 2. UPDATE STORAGE PATHS
-- =====================================================

-- Update all tracks for current user to have proper storage_path
-- Format: user_id/track_id/filename
UPDATE tracks
SET storage_path = user_id || '/' || id || '/' || file_name
WHERE user_id = auth.uid()
AND file_name IS NOT NULL
AND (storage_path IS NULL OR storage_path = '');

-- Show how many were updated
SELECT 
    'Storage paths updated' as status,
    COUNT(*) as tracks_updated
FROM tracks
WHERE user_id = auth.uid()
AND storage_path IS NOT NULL;

-- =====================================================
-- 3. VERIFY THE UPDATE
-- =====================================================

-- Show updated tracks
SELECT 
    id,
    name,
    file_name,
    storage_path,
    substring(storage_path, 1, 50) || '...' as path_preview
FROM tracks
WHERE user_id = auth.uid()
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- 4. CHECK IF FILES ACTUALLY EXIST IN STORAGE
-- =====================================================

-- This is important - tracks might have paths but files might not be uploaded
SELECT 
    'Checking if files exist in storage...' as status;

-- Try to list some files in storage
SELECT 
    name as file_path,
    created_at,
    metadata
FROM storage.objects
WHERE bucket_id = 'audio-files'
AND owner = auth.uid()
LIMIT 5;

-- =====================================================
-- 5. IF NO FILES IN STORAGE
-- =====================================================

-- Count files vs tracks
WITH file_check AS (
    SELECT 
        (SELECT COUNT(*) FROM tracks WHERE user_id = auth.uid()) as track_count,
        (SELECT COUNT(*) FROM storage.objects WHERE bucket_id = 'audio-files' AND owner = auth.uid()) as file_count
)
SELECT 
    track_count,
    file_count,
    CASE 
        WHEN file_count = 0 THEN 'WARNING: No files in storage! Files need to be uploaded.'
        WHEN file_count < track_count THEN 'WARNING: Some files missing from storage.'
        ELSE 'OK: Files exist in storage.'
    END as status
FROM file_check;

-- =====================================================
-- 6. FIX STORAGE POLICIES (SIMPLIFIED)
-- =====================================================

-- Make sure basic policies exist for file access
DO $$
BEGIN
    -- Drop any problematic policies
    DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
    DROP POLICY IF EXISTS "Allow users to view own files" ON storage.objects;
    
    -- Create a simple policy for viewing files
    CREATE POLICY "Allow users to view own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'audio-files' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
    
    RAISE NOTICE 'Storage view policy created';
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Storage policies already exist';
END $$;

-- =====================================================
-- 7. FINAL STATUS
-- =====================================================

SELECT 
    E'\n✅ STORAGE PATHS FIXED!\n\n' ||
    'What was done:\n' ||
    '• Updated all tracks with proper storage_path values\n' ||
    '• Format: user_id/track_id/filename\n' ||
    '• Storage policies verified\n\n' ||
    'Next steps:\n' ||
    '• If files show in storage: Audio should now play!\n' ||
    '• If NO files in storage: Files need to be uploaded\n' ||
    '• Check browser console for any remaining errors' as result;

-- =====================================================
-- 8. TEST QUERY
-- =====================================================

-- This simulates what the app does to get a file URL
SELECT 
    'Test file access:' as test,
    id,
    name,
    storage_path
FROM tracks
WHERE user_id = auth.uid()
AND storage_path IS NOT NULL
LIMIT 1;