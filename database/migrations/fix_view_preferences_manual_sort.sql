-- Allow 'manual' as a valid sort_by option
-- This migration updates the check constraint on view_preferences table

-- Drop the existing constraint
ALTER TABLE view_preferences 
DROP CONSTRAINT IF EXISTS check_sort_by;

-- Add the new constraint that includes 'manual'
ALTER TABLE view_preferences
ADD CONSTRAINT check_sort_by 
CHECK (sort_by IN ('added', 'title', 'type', 'artist', 'album', 'duration', 'date', 'manual'));

-- Also update the RPC function to handle 'manual' sort
CREATE OR REPLACE FUNCTION upsert_view_preference(
    p_view_type TEXT,
    p_view_id TEXT,
    p_sort_by TEXT,
    p_sort_direction TEXT,
    p_view_mode TEXT,
    p_manual_positions JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Validate inputs
    IF p_sort_direction NOT IN ('asc', 'desc') THEN
        p_sort_direction := 'desc';
    END IF;
    
    IF p_view_mode NOT IN ('list', 'grid') THEN
        p_view_mode := 'list';
    END IF;
    
    IF p_sort_by NOT IN ('added', 'title', 'type', 'artist', 'album', 'duration', 'date', 'manual') THEN
        p_sort_by := 'added';
    END IF;
    
    -- Perform the upsert
    INSERT INTO view_preferences (
        user_id,
        view_type,
        view_id,
        sort_by,
        sort_direction,
        view_mode,
        manual_positions,
        updated_at
    )
    VALUES (
        current_user_id,
        p_view_type,
        p_view_id,
        p_sort_by,
        p_sort_direction,
        p_view_mode,
        p_manual_positions,
        NOW()
    )
    ON CONFLICT (user_id, view_type, view_id)
    DO UPDATE SET
        sort_by = EXCLUDED.sort_by,
        sort_direction = EXCLUDED.sort_direction,
        view_mode = EXCLUDED.view_mode,
        manual_positions = EXCLUDED.manual_positions,
        updated_at = NOW();
END;
$$;

-- Notify PostgREST to refresh
NOTIFY pgrst, 'reload schema';

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully updated view_preferences to support manual sorting';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes made:';
    RAISE NOTICE '- Added "manual" as a valid sort_by option';
    RAISE NOTICE '- Updated RPC function to accept "manual" sort';
    RAISE NOTICE '';
    RAISE NOTICE 'Manual order will now persist across sessions!';
END $$;