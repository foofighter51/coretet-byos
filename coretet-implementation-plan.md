# CoreTet Songwriter Platform - Implementation Plan & Claude Code Prompts

## 📋 Project Overview

This document contains a detailed implementation plan to transform CoreTet from a music player into a comprehensive songwriter's creative command center. Each section includes specific Claude Code prompts that can be used directly in VS Code.

**Timeline**: 6-8 months  
**Approach**: Incremental enhancement of existing React/Supabase architecture  
**Priority**: Backward compatibility with zero disruption to current users

---

## 🎯 Phase 1: Project Hierarchy Foundation (Months 1-2)

### 1.1 Database Schema Extension

#### Claude Code Prompt:
```
Create Supabase migration scripts for CoreTet to add songwriter project hierarchy:

Current tables I have:
- profiles (user profiles with storage quotas)
- tracks (audio file metadata)
- playlists (user-created playlists)
- playlist_tracks (many-to-many relationship)
- playlist_shares (collaboration)
- tasks (music-related todos)

Create new tables:
1. projects (songwriter projects/albums)
2. song_versions (major versions of a song)
3. version_iterations (individual attempts/takes)
4. project_collaborators (team members)
5. version_metadata (lyrics, chords, notes)

Requirements:
- Link existing tracks as iteration assets
- Add semantic versioning (Version.Arrangement.Revision)
- Include JSONB fields for flexible metadata
- Maintain backward compatibility with existing playlists
- Add RLS policies matching existing security model
- Create indexes for performance

Include:
- SQL migration file with rollback
- TypeScript interfaces extending existing types
- Supabase client queries for CRUD operations
```

### 1.2 Project Context Provider

#### Claude Code Prompt:
```
Create a ProjectContext provider for CoreTet following the existing context pattern:

Existing contexts to match style:
- AuthContext (user authentication)
- AudioContext (playback control)
- LibraryContext (track library)
- ToastContext (notifications)

Create src/contexts/ProjectContext.tsx with:
1. State management for projects, versions, iterations
2. CRUD operations using Supabase client
3. Real-time subscriptions for collaboration
4. Optimistic updates for UI responsiveness
5. Integration with existing LibraryContext for tracks
6. Error handling using existing ErrorContext
7. Loading states and pagination
8. Caching strategy for performance

Follow existing patterns:
- Use React.createContext with TypeScript
- Include useProject hook
- Handle authentication from AuthContext
- Show notifications via ToastContext
```

### 1.3 Project View Components

#### Claude Code Prompt:
```
Create React components for CoreTet's project hierarchy view:

Build in src/components/Projects/:
1. ProjectList.tsx - Grid/list view of all projects
2. ProjectCard.tsx - Individual project with cover, stats
3. ProjectView.tsx - Detailed project page
4. VersionTimeline.tsx - Visual version history
5. IterationBoard.tsx - Kanban-style iteration management

Requirements:
- Match existing Tailwind CSS classes and Forest theme
- Use existing color scheme (primary: #0a1612, accent: #c1b659)
- Fonts: Anton for headers, Quicksand for body
- Responsive with mobile-first approach
- Integrate with existing Layout components
- Use existing Loading and EmptyState components
- Support existing 6 track types as iteration categories

Include:
- Drag-and-drop for reordering using react-dnd
- Virtual scrolling with react-window (already installed)
- Animations with framer-motion (already installed)
```

### 1.4 Migration Utility

#### Claude Code Prompt:
```
Create a migration utility to transform existing CoreTet playlists into projects:

Create src/utils/projectMigration.ts with:
1. Function to convert playlists to projects
2. Preserve all existing metadata
3. Generate initial version (1.0.0) for each track
4. Maintain playlist_shares as project_collaborators
5. Create backward compatibility layer
6. Batch processing for large libraries
7. Progress tracking and resumability
8. Rollback capability if needed

Include:
- CLI script for admin migration
- User-triggered migration option
- Dry-run mode for testing
- Migration status in profiles table
- Detailed logging for debugging
```

---

## 🎵 Phase 2: Enhanced Collaboration (Months 3-4)

### 2.1 Timestamped Comments System

#### Claude Code Prompt:
```
Implement timestamped audio comments for CoreTet tracks:

Create database tables:
1. track_comments (id, track_id, user_id, timestamp_ms, content, parent_id)
2. comment_reactions (comment_id, user_id, reaction_type)
3. comment_mentions (comment_id, mentioned_user_id)

Build React components in src/components/Comments/:
1. CommentThread.tsx - Nested comment display
2. TimestampedComment.tsx - Individual comment with audio timestamp
3. CommentInput.tsx - Rich text input with @mentions
4. WaveformComments.tsx - Visual comment markers on waveform

Requirements:
- Integrate with existing AudioContext for playback sync
- Jump to timestamp when clicking comment
- Real-time updates via Supabase subscriptions
- @mention autocomplete from profiles
- Markdown support for formatting
- Edit/delete with permissions
- Thread collapsing for long discussions

Style to match existing UI:
- Use existing form components pattern
- Toast notifications for new comments
- Mobile-responsive design
```

### 2.2 Version Comparison UI

#### Claude Code Prompt:
```
Create a version comparison interface for CoreTet songs:

Build src/components/Versions/:
1. VersionCompare.tsx - Side-by-side version comparison
2. VersionDiff.tsx - Highlight changes between versions
3. VersionSelector.tsx - Dropdown matching existing style
4. VersionHistory.tsx - Timeline of all versions
5. VersionMetadata.tsx - Lyrics, chords, notes comparison

Features:
1. A/B playback switching
2. Visual diff for lyrics/chords
3. Metadata change tracking
4. Semantic version display (2.3.1)
5. Branch naming for creative intent
6. Merge suggestions UI
7. Conflict resolution interface

Integration:
- Use existing AudioContext for dual playback
- Match existing dropdown component style
- Use existing Modal component for comparisons
- Integrate with task system for version todos
```

### 2.3 Real-time Presence

#### Claude Code Prompt:
```
Add real-time presence awareness to CoreTet's collaboration:

Implement in src/hooks/usePresence.ts:
1. Track active users per project
2. Show user cursors on shared views
3. Display "X is listening" indicators
4. Show typing indicators in comments
5. Live activity feed per project

Create components:
1. PresenceAvatars.tsx - Active user avatars
2. CursorPresence.tsx - Live cursor positions
3. ActivityFeed.tsx - Real-time activity log
4. ListeningIndicator.tsx - Who's playing what

Use Supabase Realtime:
- Presence channel per project
- Broadcast cursor positions
- Track playback states
- Handle connection/disconnection gracefully
- Optimize for performance (throttle updates)

Style:
- Small avatar bubbles with tooltip names
- Colored cursors per user
- Subtle animations for presence changes
```

### 2.4 Suggestion System

#### Claude Code Prompt:
```
Build a suggestion system for collaborative songwriting in CoreTet:

Database schema:
1. track_suggestions (id, track_id, user_id, type, content, status)
2. suggestion_votes (suggestion_id, user_id, vote)
3. suggestion_comments (suggestion_id, user_id, comment)

Create src/components/Suggestions/:
1. SuggestionPanel.tsx - List of pending suggestions
2. SuggestionCard.tsx - Individual suggestion with voting
3. SuggestionDiff.tsx - Show proposed changes
4. SuggestionInput.tsx - Create new suggestions

Suggestion types:
- Lyrics changes
- Arrangement modifications
- Metadata updates
- Section reordering
- Mix notes

Features:
- Accept/reject with permissions
- Voting system for team decisions
- Discussion threads per suggestion
- Auto-apply approved changes
- History of accepted/rejected

Match existing UI patterns and Forest theme
```

---

## 🤖 Phase 3: Audio Intelligence (Months 5-6)

### 3.1 Client-Side Audio Analysis

#### Claude Code Prompt:
```
Integrate Essentia.js for real-time audio analysis in CoreTet:

Create src/services/audioAnalysis.ts:
1. Load Essentia.js WebAssembly module
2. Analyze uploaded files for tempo, key, time signature
3. Generate actual waveform data (replace placeholder)
4. Extract energy levels and dynamics
5. Detect sections (intro, verse, chorus, etc.)
6. Calculate audio fingerprint for similarity

Update components:
1. Modify Upload component to run analysis
2. Auto-populate existing tempo/key fields
3. Generate and store waveform data
4. Add analysis progress indicator
5. Cache results in IndexedDB

Create src/components/Analysis/:
1. WaveformDisplay.tsx - Real waveform visualization
2. AudioAnalysisPanel.tsx - Show all detected features
3. SectionMarkers.tsx - Visual section indicators
4. TempoTapper.tsx - Manual tempo correction tool

Performance:
- Use Web Workers for processing
- Progressive analysis (basic first, detailed later)
- Handle large files (up to 100MB limit)
```

### 3.2 Smart Search Implementation

#### Claude Code Prompt:
```
Enhance CoreTet's search with natural language queries:

Create src/services/smartSearch.ts:
1. Parse natural language queries
2. Extract musical parameters (key, tempo, mood)
3. Build PostgreSQL full-text search queries
4. Implement fuzzy matching for track names
5. Add similarity search using audio fingerprints

Supported queries:
- "upbeat songs in G major"
- "slow demos from last month"
- "tracks similar to [track name]"
- "collaborations with [username]"
- "unfinished projects"
- "songs needing bass"

Update src/components/Library/SearchBar.tsx:
1. Add natural language input mode
2. Show query interpretation
3. Suggest query completions
4. Display grouped results
5. Add search history

Create search indexes:
- Full-text search on track metadata
- Trigram similarity for fuzzy matching
- Vector embeddings for similarity
- Composite indexes for performance
```

### 3.3 Auto-Tagging System

#### Claude Code Prompt:
```
Build automatic tagging system for CoreTet tracks:

Create src/services/autoTagging.ts:
1. Analyze audio features for genre classification
2. Detect mood from harmonic content
3. Identify instruments present
4. Suggest energy levels (low/medium/high)
5. Determine production quality (demo/rough/polished)
6. Extract song structure patterns

Create UI components:
1. AutoTagSuggestions.tsx - Show suggested tags
2. TagConfirmation.tsx - Accept/reject suggestions
3. TagRefinement.tsx - Train personal preferences
4. BulkTagger.tsx - Apply tags to multiple tracks

Integration:
- Run after upload completion
- Store suggestions in track metadata
- Learn from user corrections
- Batch process existing library
- Show confidence scores

Use existing tag system and multi-select patterns
```

### 3.4 Pattern Detection

#### Claude Code Prompt:
```
Implement musical pattern detection across CoreTet library:

Create src/services/patternDetection.ts:
1. Find similar chord progressions
2. Detect reused melodies
3. Identify matching rhythmic patterns
4. Find songs in same key/tempo
5. Detect potential copyright issues
6. Suggest complementary tracks

Create src/components/Patterns/:
1. SimilarityMatrix.tsx - Visual similarity grid
2. PatternAlert.tsx - Notify of detected patterns
3. RelatedTracks.tsx - Show similar songs
4. AlbumCoherence.tsx - Analyze album consistency
5. ReuseWarning.tsx - Flag potential issues

Features:
- Background analysis of library
- Real-time detection during upload
- Adjustable sensitivity thresholds
- Ignore list for intentional reuse
- Export pattern reports

Store results in JSONB metadata fields
Use Supabase Edge Functions for heavy processing
```

---

## 📱 Phase 4: Enhanced Mobile & Polish (Months 7-8)

### 4.1 Mobile Project Management

#### Claude Code Prompt:
```
Optimize CoreTet mobile experience for songwriter workflows:

Enhance mobile routes in src/pages/mobile/:
1. MobileProjectView.tsx - Swipeable project navigation
2. MobileVersionSwitcher.tsx - Gesture-based version control
3. MobileQuickCapture.tsx - Fast demo recording
4. MobileIterationGrid.tsx - Touch-optimized iteration view
5. MobileLyricEditor.tsx - Full-screen lyric editing

Gestures and interactions:
- Swipe left/right for versions
- Pull down to refresh
- Long press for context menu
- Pinch to zoom waveforms
- Drag to reorder iterations
- Shake to undo

Voice features:
1. Voice memo quick capture button
2. Voice-to-text for lyrics
3. Humming melody detection
4. Voice comments on tracks
5. Hands-free playback controls

Optimize existing Upload component for mobile:
- Camera roll integration
- Voice recorder built-in
- Batch upload from files app
- Background upload support
```

### 4.2 Performance Optimization

#### Claude Code Prompt:
```
Optimize CoreTet performance and reduce bundle size:

Current issue: Bundle size 836KB (warning at 500KB)

Code splitting strategy:
1. Split routes with React.lazy()
2. Lazy load heavy components (audio analysis, visualizations)
3. Dynamic import for feature modules
4. Separate vendor bundles
5. Tree-shake unused imports

Create performance utilities:
1. src/utils/performance.ts - Performance monitoring
2. src/hooks/useIntersectionObserver.ts - Lazy loading
3. src/hooks/useVirtualList.ts - Virtual scrolling
4. src/hooks/useDeferredValue.ts - Defer heavy updates

Optimization tasks:
- Remove unused imports (current issue)
- Convert 'any' types to proper TypeScript
- Implement React.memo for expensive components
- Add useMemo/useCallback where needed
- Optimize re-renders with React DevTools
- Implement progressive image loading
- Add skeleton loaders for better perceived performance

Caching strategy:
- IndexedDB for audio analysis results
- LocalStorage for user preferences
- Service Worker for offline audio
- Memory cache for frequently accessed data
```

### 4.3 Advanced View Modes

#### Claude Code Prompt:
```
Create multiple view modes for CoreTet projects:

Build view components in src/components/Views/:
1. KanbanView.tsx - Drag & drop between stages (Demo → Final)
2. TimelineView.tsx - Calendar-based release planning
3. GalleryView.tsx - Visual grid with album art
4. TableView.tsx - Detailed spreadsheet view
5. GraphView.tsx - Relationship network visualization

Features per view:
- Kanban: Custom columns, WIP limits, automation rules
- Timeline: Gantt chart, milestones, deadlines
- Gallery: Mood boards, visual inspiration, cover art
- Table: Inline editing, sorting, filtering, export
- Graph: Connection visualization, collaboration network

View persistence:
- Save view preference per user
- Custom view configurations
- Shareable view templates
- Quick view switcher
- Mobile-optimized versions

Use existing react-window for performance
Integrate with existing filter system
```

### 4.4 Onboarding & Documentation

#### Claude Code Prompt:
```
Create comprehensive onboarding for new CoreTet features:

Enhance src/components/Tutorial/:
1. InteractiveTour.tsx - Step-by-step feature guide
2. TooltipSystem.tsx - Contextual help tooltips
3. VideoTutorials.tsx - Embedded how-to videos
4. FeatureHighlight.tsx - Spotlight new features
5. OnboardingFlow.tsx - Progressive disclosure

Documentation system:
1. In-app help center
2. Keyboard shortcuts overlay
3. Feature announcement modals
4. Progress tracking for onboarding
5. Skip options for experienced users

Create feature flags:
- Gradual rollout system
- A/B testing framework
- User preference for classic vs new UI
- Beta feature opt-in
- Rollback capabilities

Help content:
- "What's New" changelog
- Best practices guide
- Collaboration etiquette
- Workflow templates
- FAQ section

Store onboarding progress in profiles table
```

---

## 🚀 Implementation Guidelines

### Development Workflow

1. **Branch Strategy**
   - Feature branches: `feature/project-hierarchy`
   - Release branches: `release/phase-1`
   - Hotfix branches: `hotfix/critical-bug`

2. **Testing Approach**
   - Unit tests for utilities
   - Integration tests for API calls
   - E2E tests for critical paths
   - Manual testing on multiple devices

3. **Deployment Process**
   - Staging environment for testing
   - Feature flags for gradual rollout
   - Automated deployment via Netlify
   - Database migrations with rollback plans

### Code Standards

1. **TypeScript Usage**
   - Strict mode enabled
   - No `any` types (fix existing issues)
   - Interfaces for all data structures
   - Proper error handling types

2. **Component Patterns**
   - Functional components with hooks
   - Proper prop typing
   - Memoization where appropriate
   - Error boundaries for stability

3. **Performance Standards**
   - Initial load < 3 seconds
   - Time to interactive < 5 seconds
   - 60fps scrolling and animations
   - Lighthouse score > 90

### Monitoring & Analytics

1. **Error Tracking**
   - Sentry integration
   - Custom error boundaries
   - User feedback collection
   - Crash reporting

2. **Usage Analytics**
   - Feature adoption rates
   - User flow analysis
   - Performance metrics
   - A/B test results

3. **Infrastructure Monitoring**
   - Supabase dashboard metrics
   - Netlify build status
   - Storage usage tracking
   - API rate limiting

---

## 📅 Timeline & Milestones

### Month 1-2: Foundation
- ✅ Database schema migration
- ✅ Project hierarchy implementation
- ✅ Basic project views
- ✅ Backward compatibility

### Month 3-4: Collaboration
- ✅ Timestamped comments
- ✅ Version comparison
- ✅ Real-time presence
- ✅ Suggestion system

### Month 5-6: Intelligence
- ✅ Audio analysis integration
- ✅ Smart search
- ✅ Auto-tagging
- ✅ Pattern detection

### Month 7-8: Polish
- ✅ Mobile optimization
- ✅ Performance improvements
- ✅ Multiple view modes
- ✅ Onboarding flow

---

## 🎯 Success Metrics

### Technical Metrics
- Bundle size < 500KB
- Lighthouse score > 90
- 99.9% uptime
- < 100ms API response time

### User Metrics
- 50% adoption of project features
- 30% increase in collaboration
- 25% reduction in version confusion
- 40% faster project completion

### Business Metrics
- 20% increase in user retention
- 30% increase in premium conversions
- 50% reduction in support tickets
- 25% increase in user referrals

---

## 📝 Notes for Implementation

1. **Start Small**: Begin with Phase 1 project hierarchy, test thoroughly
2. **User Feedback**: Launch features to beta users first
3. **Performance First**: Monitor bundle size and performance metrics
4. **Backward Compatible**: Never break existing functionality
5. **Documentation**: Keep this document updated with implementation details

---

*Last Updated: August 2025*  
*Version: 1.0*  
*Status: Ready for Implementation*