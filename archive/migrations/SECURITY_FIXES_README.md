# Supabase Security Fixes - Critical

## Overview
This directory contains critical security migrations to address vulnerabilities identified by Supabase's security linter on 2025-08-09.

## Files to Execute (in order)

### 1. `security_fix_critical_rls.sql` 🔴 CRITICAL
**Purpose**: Enable Row Level Security on completely exposed tables
- Enables RLS on 6 unprotected tables
- Creates appropriate access policies
- Restricts backup tables to admin-only access

**Affected Tables**:
- `auth_debug_log` - Contains sensitive authentication logs
- `task_categories` - User task categories
- `collaborator_migration_map` - Migration data
- `backup_tracks_20250127` - Backup data
- `backup_playlists_20250127` - Backup data
- `backup_playlist_tracks_20250127` - Backup data

### 2. `security_fix_views.sql` 🟡 HIGH
**Purpose**: Remove SECURITY DEFINER from views that bypass RLS
- Recreates 3 views without SECURITY DEFINER
- Ensures views respect user RLS policies

**Affected Views**:
- `deleted_tracks`
- `playlist_track_rating_summary`
- `my_shared_playlists`

### 3. `security_fix_functions_search_path.sql` 🟡 HIGH
**Purpose**: Add explicit search_path to prevent schema injection
- Updates 22 functions with secure search_path
- Prevents malicious schema injection attacks

### 4. `security_fix_missing_policies.sql` 🟠 MEDIUM
**Purpose**: Add policies to tables with RLS but no policies
- Creates policies for 11 tables
- Restores proper access control

## How to Apply

### Via Supabase Dashboard:
1. Go to SQL Editor in Supabase Dashboard
2. Execute each file in order:
   - First: `security_fix_critical_rls.sql`
   - Second: `security_fix_views.sql`
   - Third: `security_fix_functions_search_path.sql`
   - Fourth: `security_fix_missing_policies.sql`

### Via CLI:
```bash
# Connect to your database
psql "$DATABASE_URL" -f database/migrations/security_fix_critical_rls.sql
psql "$DATABASE_URL" -f database/migrations/security_fix_views.sql
psql "$DATABASE_URL" -f database/migrations/security_fix_functions_search_path.sql
psql "$DATABASE_URL" -f database/migrations/security_fix_missing_policies.sql
```

## Additional Auth Settings (Manual)

### In Supabase Dashboard > Authentication > Settings:

1. **Reduce OTP Expiry**:
   - Current: >1 hour (security risk)
   - Recommended: 15-30 minutes
   - Location: Auth > Settings > Email > OTP Expiry

2. **Enable Leaked Password Protection**:
   - Current: Disabled
   - Recommended: Enabled
   - Location: Auth > Settings > Security > Leaked Password Protection
   - This checks passwords against HaveIBeenPwned database

## Verification

After applying all migrations, run this verification query:

```sql
-- Check for unprotected tables
SELECT tablename, 
       CASE WHEN rowsecurity THEN 'Protected' ELSE 'EXPOSED' END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = t.schemaname
WHERE t.schemaname = 'public'
ORDER BY status, tablename;

-- Check for SECURITY DEFINER views
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'public'
AND definition LIKE '%SECURITY DEFINER%';

-- Check for functions without search_path
SELECT proname 
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
AND pg_get_functiondef(p.oid) NOT LIKE '%search_path%';
```

## Post-Migration Testing

1. **Test user authentication** - Ensure login still works
2. **Test track upload** - Verify file upload functionality
3. **Test playlist sharing** - Confirm collaboration features work
4. **Test admin functions** - Verify admin panel access
5. **Check application logs** - Look for any permission errors

## Rollback (if needed)

If issues occur, you can disable RLS temporarily:
```sql
-- Emergency rollback (use with caution)
ALTER TABLE public.auth_debug_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_categories DISABLE ROW LEVEL SECURITY;
-- etc...
```

## Security Best Practices Going Forward

1. **Always enable RLS** on new tables:
   ```sql
   CREATE TABLE new_table (...);
   ALTER TABLE new_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "..." ON new_table ...;
   ```

2. **Never use SECURITY DEFINER** unless absolutely necessary

3. **Always set search_path** in functions:
   ```sql
   CREATE FUNCTION my_function()
   RETURNS void
   LANGUAGE plpgsql
   SET search_path = public, pg_catalog
   AS $$ ... $$;
   ```

4. **Regular security audits** - Run Supabase linter monthly

## Contact
If you encounter issues after applying these fixes, check:
- Supabase Dashboard logs
- Application error logs
- Browser console for API errors

Priority: Apply `security_fix_critical_rls.sql` IMMEDIATELY as it addresses the most severe vulnerabilities.