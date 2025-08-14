# SQL Archive

This directory contains historical SQL files from troubleshooting and fixes applied to the CoreTet database.

## Directory Structure

### `/applied_fixes/`
SQL files that were executed to fix specific issues:
- `TEMPORARY_TRACKS_VISIBILITY_FIX.sql` - Temporary policy to allow ericexley@gmail.com to see tracks
- `FIX_500_ERROR.sql` - Attempted fix for 500 errors from conflicting policies
- `FIX_AUTH_MISMATCH.sql` - Diagnostic and fix for auth context issues

### `/troubleshooting/`
Diagnostic SQL files used to identify issues:
- `CHECK_AUTH_MISMATCH.sql` - Check for auth.uid() mismatches
- `DEBUG_AUTH_ISSUE.sql` - Debug authentication problems
- `DIAGNOSE_AUTH_SESSION.sql` - Comprehensive auth session diagnostics
- `DIAGNOSE_MAIN_USER_ISSUE.sql` - Diagnose visibility issues for main user
- `CHECK_ERICEXLEY_DATA.sql` - Verify data exists for specific user
- `VERIFY_ERICEXLEY_DATA.sql` - Additional data verification
- `TEST_APP_CONNECTION.sql` - Test app connection and RLS policies
- `CLEAN_RLS_SOLUTION.sql` - **The fix that worked** - Simplified RLS policies
- `FINAL_DIAGNOSTIC.sql` - Comprehensive diagnostic queries
- `VERIFY_AND_FIX.sql` - Final verification steps

### `/supabase_fixes/`
SQL files from the supabase directory:
- Various playlist policy fixes
- Admin status checks

### `/sql_fixes/`
Original sql_fixes directory with various migration and fix attempts

## Key Learnings

1. **Keep RLS policies simple** - Multiple overlapping policies cause 500 errors
2. **Use single FOR ALL policies** - Instead of separate SELECT, INSERT, UPDATE, DELETE
3. **auth.uid() context** - SQL Editor doesn't have user auth context
4. **Clean slate approach** - Sometimes it's better to drop all policies and start fresh

## Current Production Policies

As of the fix, the production policies are:
- `tracks_owner_all` - Users can only access their own tracks
- `playlists_owner_all` - Users can only access their own playlists

These simple policies resolved all visibility issues.