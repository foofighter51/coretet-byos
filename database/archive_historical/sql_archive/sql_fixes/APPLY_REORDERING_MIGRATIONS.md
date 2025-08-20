# Apply Track Reordering Migrations

To enable track reordering for playlists and collections, you need to apply the following migrations in order:

## 1. Apply the Reorder Function Migration

This creates the core function for updating track positions.

Run in Supabase SQL Editor:
```sql
-- Copy all contents from: supabase/migrations/20250724_add_reorder_function.sql
```

This migration creates:
- `update_track_positions()` function for bulk position updates
- Security checks to ensure users can only reorder their own playlists/collections

## 2. Apply the Collection Ordering Migration

This adds support for collection/album track ordering.

Run in Supabase SQL Editor:
```sql
-- Copy all contents from: supabase/migrations/20250724_add_simple_collection_ordering.sql
```

This migration creates:
- `collection_track_order` table for storing collection track order
- `update_collection_track_order()` function
- `get_collection_track_order()` function
- RLS policies for security

## Testing

After applying both migrations:

1. **Test Playlist Reordering:**
   - Navigate to a playlist
   - Drag tracks using the drag handles (⋮⋮)
   - Verify the order persists after refresh

2. **Test Collection Reordering:**
   - Navigate to a collection/album
   - Drag tracks using the drag handles
   - Verify the order persists after refresh

## Troubleshooting

If you get errors like "function not found":
1. Make sure you've applied the migrations in the correct order
2. Check that the migrations ran without errors
3. Try refreshing your browser to clear any cached schema