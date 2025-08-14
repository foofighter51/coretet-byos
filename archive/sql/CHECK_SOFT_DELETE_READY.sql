-- Check if soft delete system is ready

-- Check if deleted_at column exists
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'tracks' 
AND column_name = 'deleted_at';

-- If no results above, run:
-- \i ADD_SOFT_DELETE_TO_TRACKS.sql

-- Test soft delete (replace with actual track ID)
-- UPDATE tracks SET deleted_at = NOW() WHERE id = 'your-track-id-here' AND user_id = auth.uid();

-- Check deleted tracks view exists
SELECT EXISTS (
    SELECT FROM information_schema.views 
    WHERE table_name = 'deleted_tracks'
) as deleted_tracks_view_exists;