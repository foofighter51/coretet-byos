#Feedback:
I need to enhance the search functionality in my CoreTet music app to be track-centric. Currently using the forest theme colors

Current search is basic - I need:
1. Expanded search bar with placeholder "Search tracks, artists, notes, lyrics..."
2. Autocomplete dropdown showing recent searches and suggestions
3. Search results highlighting in track list
4. Filter chips that appear after search

Please update the existing search components while maintaining the current forest theme styling. The search should be prominently placed in the header and expand functionality without changing the color scheme.

Files to modify:
- Search component in header
- Track list filtering logic
- Search context/state management

Keep existing Tailwind classes and color variables.

I need to modify the left sidebar in CoreTet to be collapsible and deprioritize collections/playlists in favor of track focus. Current forest theme must be maintained.

Requirements:
1. Add collapse/expand toggle button to sidebar
2. When collapsed, show only icons for main navigation items
3. Move "Collections" and "Playlists" lower in the hierarchy
4. Add "All Tracks" as the primary, most prominent item
5. Maintain current sidebar background and existing spacing

The sidebar should default to expanded on desktop, collapsed on mobile. Use existing CoreTet styling patterns and forest theme colors.

Files likely affected:
- Left sidebar component
- Navigation state management
- Responsive layout adjustments

I need to enhance the track list in CoreTet to be the primary focus with better performance for large libraries. Maintain existing forest theme.

Enhancements needed:
1. Add virtualization for performance with large track lists (1000+ tracks)
2. Expand track rows to show more metadata inline (key, BPM, last updated)
3. Add mini waveform visualization within each track row
4. Add checkbox for bulk selection
5. Improve grid layout to: checkbox | track info + waveform | collection | key | BPM | date | actions

Keep existing track row styling, hover effects, and active states. Use current color scheme and maintain smooth transitions.

Current track list uses grid layout - enhance it while preserving the forest theme visual identity.

I need to add a bulk operations toolbar to CoreTet that appears when tracks are selected. Must use existing forest theme colors and styling patterns.

Requirements:
1. Toolbar slides down from top when tracks are selected
2. Shows "X tracks selected" counter
3. Bulk action buttons: Edit Metadata, Apply Tags, Move to Collection, Export, Delete
4. Uses existing button styles with forest theme 
5. Matches current CoreTet visual design language

The toolbar should:
- Appear smoothly with existing transition styles
- Use current button classes and hover effects
- Include a "Clear Selection" option
- Show/hide based on track selection state

Integrate with existing track list selection logic and maintain current Tailwind styling approach.

I need to expand the track metadata editing in CoreTet's right panel to be more comprehensive while maintaining the forest theme design.

Current metadata editing is basic - enhance to include:
1. Core fields: Title, Artist, Key (dropdown), BPM (number input), Genre, Mood
2. Custom fields section with ability to add new metadata fields
3. Production fields: Instruments Used, Recording Location, Lyrical Theme, Production Status
4. Notes text area for production notes
5. Template system for saving/applying metadata templates

Use existing form styling:
Keep current forest theme throughout

Enhance the existing details panel without changing the core visual design. Add sections with existing section title styling.

I need to implement a version control system for tracks in CoreTet. This is a new feature but must integrate seamlessly with existing forest theme design.

Requirements:
1. Version timeline in track details panel showing all versions of a track
2. Version comparison view with side-by-side waveforms
3. Change log showing what was modified between versions
4. Restore/branch options for each version
5. Visual indicators in main track list for tracks with multiple versions

Design specifications:
- Use existing card styling for version items
- Version timeline with current forest theme colors
- Comparison view using existing two-column grid patterns
- Change indicators: green (+), red (-), yellow (~) for modifications
- Maintain existing button styles for actions

This is entirely new functionality - create the version control components using CoreTet's established design patterns and forest color scheme.

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

For ALL Phases:
- Maintain existing TypeScript strict mode
- Use existing context patterns for state management
- Follow current component composition patterns
- Preserve existing accessibility features
- Keep current error handling approaches
- Use existing utility functions and helpers
- Maintain current testing patterns (if tests exist)

After each phase:
Please test the implementation with:
1. Large track libraries (100+ tracks) for performance
2. Mobile responsiveness on various screen sizes
3. Keyboard navigation and accessibility
4. State persistence across page refreshes
5. Integration with existing Supabase backend

Verify that ALL existing functionality continues to work while new features are added.