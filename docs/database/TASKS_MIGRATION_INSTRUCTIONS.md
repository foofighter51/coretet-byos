# Tasks Feature - Database Migration Instructions

The Tasks feature is fully implemented in the code, but you need to create the database tables in Supabase.

## Quick Setup

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/chynnmeidbcqsnswlxmt/sql/new

2. Copy and paste the entire contents of `apply_tasks_migration.sql` into the SQL editor

3. Click "Run" to execute the migration

## What This Creates

- `tasks` table - Stores all tasks with track references
- `task_categories` table - Predefined task categories (Lyrics, Arrangement, Recording, etc.)
- RLS policies for security
- Helper functions for drag-and-drop reordering

## Verification

After running the migration, you should see:
- Two new tables in your database: `tasks` and `task_categories`
- The 404 errors in the console should disappear
- You can start creating tasks in the track details panel

## Troubleshooting

If you still see 404 errors after running the migration:
1. Check that you're logged in to Supabase
2. Verify the tables were created in the Table Editor
3. Try refreshing the app

The Tasks feature is now ready to use!