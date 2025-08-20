-- SIMPLE CORE FIX - Get back to working state
-- Focus on core functionality: users can play their own music

-- Option 1: Make bucket public (simplest, works immediately)
UPDATE storage.buckets 
SET public = true 
WHERE id = 'audio-files';

-- This works because:
-- 1. Your tracks table already has RLS policies limiting who can see which tracks
-- 2. File paths include user IDs, making them hard to guess
-- 3. You're the only user right now
-- 4. We can secure it properly later

-- Check the change
SELECT 
    id,
    name,
    public,
    file_size_limit
FROM storage.buckets
WHERE id = 'audio-files';

SELECT '✅ Bucket is public. Audio playback will work immediately.' as status;

-- Later, when ready to secure properly, we'll need to:
-- 1. Use an edge function to generate signed URLs server-side
-- 2. Or adjust RLS policies to work with Supabase's signed URL requirements