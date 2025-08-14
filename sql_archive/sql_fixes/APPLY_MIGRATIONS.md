# Apply Database Migrations

The playlist functionality requires database tables that haven't been created yet. Follow these steps to apply the migrations:

## Quick Start

### 1. Using Supabase Dashboard (Easiest)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New query**
5. Copy and paste the contents of `supabase/migrations/20250723_create_playlists_table.sql`
6. Click **Run** to execute the migration
7. Refresh your CoreTet app - playlists should now work!

### 2. Using Supabase CLI (Recommended for developers)

```bash
# Navigate to your project directory
cd /Users/ericexley/Downloads/coretet_no_ai

# Apply all pending migrations
supabase db push

# Or apply a specific migration
supabase db push --include-all
```

## Verify Tables Were Created

After running the migration, verify the tables exist:

1. In Supabase Dashboard, go to **Table Editor**
2. You should see two new tables:
   - `playlists` - Stores playlist information
   - `playlist_tracks` - Links tracks to playlists

## Troubleshooting

### "Playlists table not found" error
This means the migration hasn't been applied yet. Follow the steps above.

### "Authentication error" when creating playlists
Make sure you're logged in. Try refreshing the page and logging in again.

### Tracks not adding to playlists
- Check if you're logged in
- Verify the playlist exists
- Make sure the track isn't already in the playlist

## Migration Details

The playlist migration creates:
- **playlists** table with user ownership
- **playlist_tracks** junction table for many-to-many relationships
- Proper indexes for performance
- Row Level Security (RLS) policies ensuring users can only access their own playlists

## Next Steps

After applying the migration:
1. Create your first playlist using the "+" button
2. Drag tracks from your library to add them to playlists
3. Click on a playlist to view its contents