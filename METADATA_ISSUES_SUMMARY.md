# Metadata Issues Summary

## Current Status

1. **Double-click edit (TrackDetailsModal)** - Works correctly for metadata fields (key, tempo, time signature)

2. **Bulk edit (Edit tracks button)** - Has two issues:
   - Database constraint error: `'final-versions'` is not accepted by the `tracks_category_check` constraint
   - The metadata fields were not being passed through (now fixed in code)

## Issues Found

### 1. Category Constraint Mismatch
- **Error**: `new row for relation "tracks" violates check constraint "tracks_category_check"`
- **Cause**: Trying to save `'final-versions'` but the database constraint doesn't include this value
- **TypeScript allows**: `'songs' | 'demos' | 'ideas' | 'voice-memos' | 'final-versions' | 'live-performances'`
- **Database might only allow**: `'songs' | 'demos' | 'ideas' | 'voice-memos'`

### 2. Metadata Fields Not Saving in Bulk Edit
- **Fixed**: Added missing fields to `handleBulkUpdate` in `TrackList.tsx`
- Fields now included: `key`, `tempo`, `timeSignature`, `notes`

## To Fix

### 1. Run the Category Constraint Fix in Supabase
```sql
-- Drop the existing constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS tracks_category_check;

-- Add the updated constraint with all categories
ALTER TABLE tracks ADD CONSTRAINT tracks_category_check 
CHECK (category IN ('songs', 'demos', 'ideas', 'voice-memos', 'final-versions', 'live-performances'));
```

### 2. Verify Metadata Columns Exist
Run `RUN_METADATA_MIGRATION.sql` if needed to ensure all metadata columns exist.

### 3. Deploy the Code Changes
The code fixes have been implemented:
- Fixed bulk edit to include all metadata fields
- Enhanced error logging to diagnose issues

## Testing

After running the SQL fix:
1. Test bulk edit with category change to 'Final Versions'
2. Test bulk edit with metadata fields (key, tempo, time signature)
3. Verify double-click edit continues to work