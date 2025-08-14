# Collection Track Ordering Migration

This migration adds support for reordering tracks within collections (albums).

## Apply the Migration

Run the following SQL in your Supabase SQL editor:

```sql
-- Copy the contents of supabase/migrations/20250724_add_simple_collection_ordering.sql
```

## How it Works

1. **Collections remain string-based**: Unlike playlists which use UUIDs, collections (albums) continue to use string names as identifiers.

2. **Track ordering is stored separately**: The `collection_track_order` table stores the order of tracks for each collection per user.

3. **Drag and drop reordering**: When viewing tracks in a collection, users can drag and drop to reorder them, just like with playlists.

4. **Order persistence**: The track order is saved to the database and will be restored when viewing the collection again.

## Testing

1. Navigate to a collection/album in the sidebar
2. You should see drag handles (⋮⋮) appear next to each track
3. Drag tracks to reorder them
4. The new order is automatically saved
5. Navigate away and back to confirm the order persists