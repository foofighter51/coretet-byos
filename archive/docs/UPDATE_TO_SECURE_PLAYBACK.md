# Update Components to Use Secure Playback

## Summary
We need to update all components that call `play(trackId, url)` to use the new `playTrack(trackId)` method.

## Components to Update:

1. ✅ **AudioPlayer.tsx** - Updated
2. **PlayerBar.tsx** - 3 instances
3. **NarrowLibraryView.tsx** - 1 instance  
4. **MobileNowPlaying.tsx** - 4 instances
5. **TrackCard.tsx** - 1 instance
6. **TrackListView.tsx** - 1 instance

## Next Steps:

1. Update all these components
2. Test that playback works
3. Run `SECURE_STORAGE_FINAL_V2.sql` to make bucket private
4. Deploy and test with multiple users

## Quick Test Plan:

1. Keep bucket public for now
2. Test that edge function works with public bucket
3. Once confirmed working, make bucket private
4. Test again to ensure secure access works