# Full System Diagnostic Report - CoreTet

## Executive Summary

The CoreTet application is experiencing multiple interconnected issues preventing audio playback:

1. **Database Schema Mismatch**: The original migration creates an `s3_key` column, but the application code expects `storage_path`
2. **Missing Migration**: No migration exists to rename `s3_key` to `storage_path`
3. **Storage System Confusion**: Mix of AWS S3 and Supabase Storage references
4. **RLS Policy Complexity**: Recent sharing policies created infinite recursion
5. **File Location Issues**: Files may not exist in Supabase Storage

## Root Cause Analysis

### 1. Schema Evolution Problem
- **Original Design**: Used AWS S3 (hence `s3_key` column)
- **Current Code**: Expects Supabase Storage (uses `storage_path` column)
- **Missing Link**: No migration to handle this transition

### 2. Storage System Transition
- **Legacy**: S3 configuration still present in edge functions
- **Current**: Frontend uploads to Supabase Storage
- **Result**: Confusion about where files actually are

### 3. Recent Feature Additions
- Mobile support added complexity
- Collaborator system introduced separate auth flow
- Sharing features created recursive RLS policies

## Immediate Fix Instructions

### Step 1: Run the Full System Fix
```sql
-- Run FULL_SYSTEM_FIX.sql in Supabase SQL Editor
-- This will:
-- 1. Add storage_path column if missing
-- 2. Copy s3_key values to storage_path
-- 3. Format paths correctly (user_id/track_id/filename)
-- 4. Reset RLS to simple owner-only policies
-- 5. Fix storage bucket and policies
```

### Step 2: Verify File Location
After running the fix, check if files exist in Supabase Storage:
- If files exist → Audio should play
- If no files → Need to upload or migrate from S3

### Step 3: Test Core Functionality
1. Log in to the app
2. Check if tracks appear
3. Try playing audio
4. Upload a new track to test

## Long-term Recommendations

### 1. Database Cleanup
- Create proper migration: `20250126_rename_s3_key_to_storage_path.sql`
- Remove `s3_key` column after verification
- Add indexes on `storage_path` for performance

### 2. Code Cleanup
- Remove all S3 references from codebase
- Standardize on Supabase Storage
- Update edge functions to match

### 3. Feature Rollback Strategy
If issues persist:
1. Disable collaborator system temporarily
2. Simplify mobile routing
3. Focus on core desktop functionality

### 4. Gradual Feature Re-introduction
Once stable:
1. Re-enable basic sharing (read-only)
2. Add mobile support
3. Implement collaborator features last

## File Migration Options

If files are in S3 but not Supabase:

### Option 1: Manual Migration
```javascript
// Script to migrate files from S3 to Supabase
// Run locally with AWS credentials
const migrateFiles = async () => {
  // 1. List all S3 files
  // 2. Download each file
  // 3. Upload to Supabase Storage
  // 4. Update database records
};
```

### Option 2: Direct Upload
- Have users re-upload their files
- Simpler but requires user action

### Option 3: Dual Support
- Temporarily support both storage systems
- Gradually migrate over time

## Testing Checklist

- [ ] Users can log in
- [ ] Tracks list appears
- [ ] Audio files play correctly
- [ ] New uploads work
- [ ] No console errors
- [ ] Performance is acceptable

## Emergency Contacts

If critical issues arise:
1. Run emergency rollback (disable RLS)
2. Check Supabase service status
3. Review browser console for errors
4. Check network tab for failed requests

## Conclusion

The primary issue is a database schema mismatch combined with a storage system transition that was never completed. The `FULL_SYSTEM_FIX.sql` addresses these issues by:

1. Ensuring the correct column exists
2. Migrating data to the expected format
3. Simplifying RLS policies
4. Fixing storage configuration

After running this fix, the core functionality should be restored. Sharing, mobile, and collaborator features can be re-enabled gradually once the foundation is stable.