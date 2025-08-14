# Deployment Instructions

## Changes Made

1. **Enhanced Error Logging**: Added detailed error logging to the `updateTrack` function in `LibraryContext.tsx` to help diagnose why metadata fields aren't saving.
   - Logs each metadata field being added to the update
   - Shows the complete database update payload
   - Displays detailed error information if update fails
   - Verifies returned data contains updated values

2. **Debug Logging**: Added specific logging in `TrackDetailsModal.tsx` to show exactly what values are being sent when saving metadata.

3. **Improved Update Logic**: Modified the update object construction to only include metadata fields that have actual values, preventing empty strings from overwriting existing data.

4. **SQL Scripts Created**:
   - `RUN_METADATA_MIGRATION.sql` - Ensures metadata columns exist
   - `TEST_METADATA_UPDATE.sql` - Tests direct SQL updates
   - `CHECK_UPDATE_POLICIES.sql` - Verifies RLS policies

## Confirmed

The database columns exist:
- genre (text)
- key (text)  
- mood (text)
- notes (text)
- tempo (integer)
- time_signature (text)

## To Deploy

### Option 1: Manual Deployment via Git
1. Commit and push the changes:
   ```bash
   git add -A
   git commit -m "Add debug logging for metadata save issue"
   git push origin main
   ```
2. Your deployment platform should automatically pick up the changes.

### Option 2: Netlify CLI
1. Link the project first:
   ```bash
   netlify link
   ```
2. Then deploy:
   ```bash
   netlify deploy --prod
   ```

### Option 3: Vercel CLI
1. Login first:
   ```bash
   vercel login
   ```
2. Then deploy:
   ```bash
   vercel --prod
   ```

## Database Migration

Run the following SQL in your Supabase SQL editor:

```sql
-- Add metadata columns if they don't exist
ALTER TABLE tracks
ADD COLUMN IF NOT EXISTS tempo INTEGER,
ADD COLUMN IF NOT EXISTS key TEXT,
ADD COLUMN IF NOT EXISTS time_signature TEXT,
ADD COLUMN IF NOT EXISTS genre TEXT,
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;
```

## Testing the Fix

1. Open the browser console (F12)
2. Edit a track's metadata (key, tempo, time signature)
3. Look for console logs showing:
   - "TrackDetailsModal - Saving edits:" with the values
   - "Updating database with:" showing what's sent to Supabase
   - Any error messages with detailed information

The enhanced logging will help identify if:
- The values are being captured correctly from the UI
- The database update is failing due to missing columns
- There's a permission issue with the updates