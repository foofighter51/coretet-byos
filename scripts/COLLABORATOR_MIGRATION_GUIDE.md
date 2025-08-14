# Collaborator to Auth User Migration Guide

This guide explains how to migrate existing collaborators from the custom `collaborators` table to proper Supabase Auth users.

## Overview

The migration involves:
1. Creating Supabase Auth users for each collaborator
2. Updating playlist_shares to reference the new auth user IDs
3. Maintaining a migration mapping for reference

## Prerequisites

1. **Supabase Service Role Key**: You need admin access to create users
2. **Node.js environment**: To run the migration script
3. **Database migrations applied**: Ensure `20250724_create_audio_sections_and_migrate.sql` has been applied

## Migration Steps

### 1. Apply the Database Migration

First, ensure the migration table exists:

```sql
-- This should already be in your database from the migration file
CREATE TABLE IF NOT EXISTS collaborator_migration_map (
  old_collaborator_id UUID PRIMARY KEY REFERENCES collaborators(id),
  new_auth_user_id UUID REFERENCES auth.users(id),
  migrated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Also ensure playlist_shares has the new column
ALTER TABLE playlist_shares 
  ADD COLUMN IF NOT EXISTS shared_with_user_id UUID REFERENCES auth.users(id);
```

### 2. Set up Environment Variables

Create a `.env` file for the migration script:

```bash
VITE_SUPABASE_URL=your-project-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

⚠️ **Important**: The service role key is different from your anon key. Find it in your Supabase project settings under API.

### 3. Run the Migration Script

```bash
cd scripts
npm install @supabase/supabase-js
node migrate-collaborators-to-auth.js
```

The script will:
- Fetch all existing collaborators
- Create auth users with temporary passwords
- Update playlist_shares to use the new auth user IDs
- Generate a migration report

### 4. Send Password Reset Emails

After migration, you need to:
1. Review the `migration-results.json` file
2. Send password reset emails to all successfully migrated users
3. Inform them about the account migration

### 5. Update Application Code

After migration, update your application to:
- Remove references to the `collaborators` table
- Use Supabase Auth for all authentication
- Update any queries that join with collaborators

### 6. Cleanup (Optional)

Once you've verified the migration is successful and all users have logged in with their new accounts:

```sql
-- Remove the old column from playlist_shares
ALTER TABLE playlist_shares DROP COLUMN IF EXISTS collaborator_id;

-- Optionally, drop the collaborators table
-- DROP TABLE collaborators CASCADE;
```

## Troubleshooting

### User Already Exists
If a collaborator's email already exists in Auth, the script will link them instead of creating a new user.

### Failed Migrations
Check the `migration-results.json` file for any failed migrations. Common issues:
- Invalid email addresses
- Network errors
- Permission issues

### Rolling Back
If needed, you can roll back by:
1. Removing the created auth users
2. Restoring playlist_shares to use collaborator_id
3. Clearing the migration map table

## Post-Migration Checklist

- [ ] All collaborators migrated successfully
- [ ] Password reset emails sent
- [ ] Application code updated
- [ ] Users can log in with new accounts
- [ ] Playlist sharing still works correctly
- [ ] Old collaborator references removed from code