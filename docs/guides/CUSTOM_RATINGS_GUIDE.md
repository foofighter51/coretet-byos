# Custom Section Ratings - User Guide

## Setup Steps

### 1. Run Database Migration (REQUIRED)
```sql
-- Go to Supabase Dashboard > SQL Editor
-- Run the migration from: database/migrations/v1_custom_rating_system.sql
```

This creates:
- 8 default rating categories (vibe, lyrics, melody, progression, rhythm, production, energy, originality)
- All necessary tables for the rating system

### 2. Create Audio Sections First
Since ratings are tied to track sections, you need sections to rate:

1. Open a track in Track Details
2. Look for the "Arrangements" section (currently shows "Coming Soon")
3. You'll need to create audio_sections entries in the database:

```sql
-- Example: Create sections for a track
INSERT INTO audio_sections (track_id, name, start_time, end_time, color, created_by)
VALUES 
  ('your-track-id', 'Intro', 0, 30, '#FF6B6B', 'your-user-id'),
  ('your-track-id', 'Verse 1', 30, 90, '#4ECDC4', 'your-user-id'),
  ('your-track-id', 'Chorus', 90, 120, '#45B7D1', 'your-user-id'),
  ('your-track-id', 'Verse 2', 120, 180, '#4ECDC4', 'your-user-id'),
  ('your-track-id', 'Bridge', 180, 210, '#96CEB4', 'your-user-id'),
  ('your-track-id', 'Outro', 210, 240, '#FFEAA7', 'your-user-id');
```

## Where to Find the Features

### In Track Details Panel:
1. Click on any track in your library
2. The panel opens on the right
3. Scroll down to find **"Section Ratings"** (after Notes & Tasks)
4. You'll see:
   - List of track sections with timestamps
   - Expandable rating interface for each section
   - 8 rating categories with 1-5 star ratings
   - Ability to add notes to ratings
   - Visual indicators for highly-rated sections

### In Library Filters:
1. Click the Filter button in your library
2. Look for **"Section Ratings"** filter (bottom row)
3. Options include:
   - "All Loved Sections" - tracks with any 5-star section
   - "Loved Melodies" - tracks with 5-star melody ratings
   - "Loved Vibes" - tracks with 5-star vibe ratings
   - Custom filtering by minimum rating

### Mobile Interface:
1. Open track on mobile
2. Look for section ratings submenu
3. Swipe between sections
4. Tap to rate categories

## How to Use

### Rating a Section:
1. Open a track with defined sections
2. Click on a section to expand it
3. Rate each category (1-5 stars):
   - ✨ Vibe - Overall feeling
   - 📝 Lyrics - Lyrical quality
   - 🎵 Melody - Melodic composition
   - 🎸 Progression - Chord progression
   - 🥁 Rhythm - Rhythmic feel
   - 🎛️ Production - Production quality
   - ⚡ Energy - Energy level
   - 💡 Originality - Uniqueness

4. Click a star to set rating
5. Click again to remove rating
6. Add notes with the edit icon

### Creating Smart Playlists:
1. Use the Section Rating filter
2. Select criteria:
   - Any loved section
   - Specific category (e.g., "melody") loved
   - Minimum rating threshold
3. Combine with other filters (key, tempo, genre)
4. Save the filter for reuse

## Visual Indicators

- **Yellow border** = Section has 5-star ratings
- **Blue border** = Section has 4+ star ratings  
- **Average rating** = Shown for each section
- **User count** = How many users have rated (for shared tracks)

## Future Features (Foundation Ready)

The system is designed to support:
- Rearranging sections based on ratings
- Creating new arrangements from highly-rated sections
- Comparing sections across different tracks
- Collaborative rating with other users
- Custom rating scales (not just 1-5)
- Time-based playlists of best sections

## Troubleshooting

**"No sections defined"**
- Create audio_sections in the database first
- Sections need start_time and end_time

**"No rating categories"**
- Run the database migration
- Check if rating_categories table has data

**Ratings not saving**
- Check browser console for errors
- Verify user is authenticated
- Check Supabase RLS policies

**Filter not working**
- Ensure sections have ratings first
- Check if section_ratings table has data