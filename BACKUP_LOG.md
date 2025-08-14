# Backup Log

## v2.1-metadata-persistence-fixes (2025-01-29)

### What's Fixed
1. **Metadata Saving**
   - Fixed key, tempo, and time signature fields not saving in bulk edit
   - Fixed database constraint errors for 'final-versions' and 'live-performances' categories
   - All metadata fields now properly save and persist

2. **View Preferences Persistence**
   - Sorting and filtering preferences now save to database (view_preferences table)
   - Preferences persist across cache clears and device changes
   - Automatic migration from localStorage to database

3. **UI Improvements**
   - Changed "Playlists" to "My Playlists"
   - Added "Shared Playlists" section (ready for future implementation)
   - Edit dialog shows track name when editing single track (not "Edit 1 Tracks")

4. **Deployment Process**
   - Service worker no longer caches JavaScript/CSS bundles
   - Prevents blank track lists after deployments
   - Automatic version updates during build process
   - Network-first strategy for navigation requests

### Database Changes
- Added `view_preferences` table with RLS policies
- Updated tracks category constraint to include all categories

### Files Changed
- `src/hooks/useViewPreferences.ts` - Database integration
- `src/components/Library/BulkEditModal.tsx` - Fixed metadata fields and title
- `src/components/Layout/Sidebar.tsx` - My Playlists / Shared Playlists
- `public/sw.js` - Improved caching strategy
- Various SQL scripts for database updates

### How to Restore
```bash
git checkout v2.1-metadata-persistence-fixes
```

### Commit Hash
cad5a28