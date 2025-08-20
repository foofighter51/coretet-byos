# Deployment Guide - RLS Policy Fixes

## Pre-Deployment Checklist

- [ ] Backup your production database
- [ ] Test in a staging environment if available
- [ ] Notify users of potential brief downtime
- [ ] Have rollback scripts ready

## Deployment Order

### Step 1: Apply Core RLS Fixes
Run these scripts in your Supabase SQL Editor in this exact order:

1. **FIX_RLS_RECURSION_FINAL.sql**
   - Drops all existing policies
   - Creates base policies without recursion
   - Establishes the policy hierarchy

2. **COMPLETE_SHARING_SYSTEM_V2.sql**
   - Implements granular policies for all core tables
   - Sets up the complete sharing system
   - Excludes rating tables to avoid conflicts

3. **SETUP_USER_TRACK_RATINGS_POLICIES.sql**
   - Configures policies for user ratings
   - Enables regular users to rate tracks

### Step 2: Verify Deployment

Run **VERIFY_COMPLETE_SYSTEM.sql** to ensure:
- All policies are created correctly
- No recursion errors occur
- Basic queries work as expected

### Step 3: Application Testing

1. Test user login and track viewing
2. Test playlist creation and sharing
3. Test track rating functionality
4. Verify shared content is visible to recipients

## Rollback Plan

If issues occur, use these emergency scripts:

```sql
-- EMERGENCY ROLLBACK - Revert to simple owner-only policies
-- Save current policies first
CREATE TABLE policy_backup AS 
SELECT * FROM pg_policies 
WHERE tablename IN ('tracks', 'playlists', 'playlist_tracks', 'playlist_shares');

-- Then run the original FIX_INFINITE_RECURSION.sql
```

## Post-Deployment

1. Monitor application logs for any RLS errors
2. Check Supabase dashboard for query performance
3. Gather user feedback on sharing functionality

## Important Notes

- The deployment should take less than 5 minutes
- Users might experience brief interruptions during policy updates
- All existing data remains intact - only access policies change
- The collaborator rating system (`track_ratings`) remains separate

## Success Indicators

- No 500 errors in the application
- Users can see their own tracks and playlists
- Shared playlists appear for recipients
- Rating functionality works correctly

---

Ready to deploy? Start with Step 1 in your Supabase SQL Editor.