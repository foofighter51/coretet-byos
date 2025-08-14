I need to add advanced filtering and sorting capabilities to the CoreTet track list while maintaining the existing forest theme design.

Add these features:
1. Sort dropdown in track toolbar with options: Recent, Title, Artist, BPM, Key, Duration
2. Filter panel with checkboxes for: Category, Key, BPM Range, Date Range, Has Versions
3. Saved searches functionality
4. "Smart collections" that auto-update based on criteria

Visual requirements:
- Use existing dropdown/select styling
- Filter panel should slide out from toolbar using current transition patterns
- Maintain forest theme colors throughout 
- Use existing chip/tag styling for active filters
- Keep current button and input styling

Integrate with existing track list and search functionality. Follow current CoreTet component patterns.

I need to optimize CoreTet's track management for mobile while preserving the forest theme design and functionality.

Mobile-specific requirements:
1. Track list becomes card-based layout on mobile (< 768px)
2. Each track card shows: title, artist, mini waveform, key/BPM, play button
3. Sidebar becomes bottom navigation on mobile
4. Track details become full-screen modal on mobile
5. Touch-friendly bulk selection with swipe gestures

Design constraints:
- Maintain forest theme colors on all screen sizes
- Use existing card styling patterns for track cards
- Keep current transition animations
- Preserve accessibility with existing focus states
- Use current mobile breakpoint patterns

Enhance existing responsive design without changing the color scheme or core visual identity. Focus on touch-friendly interactions using current design language.

I need to optimize CoreTet's performance for large music libraries while maintaining existing functionality and design.

Performance improvements needed:
1. Implement React.memo for track list items to prevent unnecessary re-renders
2. Add intersection observer for lazy loading track waveforms
3. Optimize metadata search with debounced input
4. Add virtualized scrolling for track lists over 100 items
5. Implement smart caching for frequently accessed track data

Technical requirements:
- Don't change existing component APIs or styling
- Maintain current forest theme and visual behavior
- Keep existing loading states and transitions
- Preserve all current functionality while improving speed
- Use existing loading spinner and skeleton patterns

Focus on under-the-hood optimizations that don't affect the user interface but significantly improve performance with large track libraries (1000+ tracks).

I need to update the CoreTet database schema to support track-centric architecture with Supabase PostgreSQL.

Current schema needs these enhancements:
1. Add version tracking to tracks table
2. Create track_versions table for storing multiple versions
3. Add custom metadata JSONB field to tracks
4. Create indexes for performance on track searches
5. Update RLS policies to be track-focused

Schema changes needed:
- tracks table: add metadata JSONB, version_count INTEGER
- track_versions table: track_id, version_name, file_path, created_at
- track_collaborators table: track-level permissions
- Indexes on: user_id + title, metadata JSONB fields, updated_at
- RLS policies for track access control

Provide SQL migration scripts that I can run in Supabase. Include rollback scripts and consider existing data preservation.

I need to update CoreTet's API layer to support track-centric operations while maintaining existing Supabase integration.

New API endpoints needed:
1. Bulk track operations (update metadata for multiple tracks)
2. Track version management (create, compare, restore versions)
3. Advanced search with metadata filtering
4. Track analytics and statistics
5. Custom metadata field management

Technical requirements:
- Use existing Supabase client patterns
- Maintain current error handling approaches
- Keep existing authentication/authorization
- Add proper TypeScript types for new operations
- Use existing caching strategies where applicable

Update the existing API service layer to support new track-centric features while preserving all current functionality. Focus on extending existing patterns rather than rewriting.

- Maintain existing TypeScript strict mode
- Use existing context patterns for state management
- Follow current component composition patterns
- Preserve existing accessibility features
- Keep current error handling approaches
- Use existing utility functions and helpers
- Maintain current testing patterns (if tests exist)

Please test the implementation with:
1. Large track libraries (100+ tracks) for performance
2. Mobile responsiveness on various screen sizes
3. Keyboard navigation and accessibility
4. State persistence across page refreshes
5. Integration with existing Supabase backend

Verify that ALL existing functionality continues to work while new features are added.