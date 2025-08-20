# CORETET Mobile App Development Plan

## Executive Summary

This plan outlines the development strategy for native iOS and Android apps based on the existing CORETET web application. The mobile apps will focus on three core features:
1. High-quality track playback experience
2. Rating and commenting on tracks in shared playlists
3. Future track rearrangement capabilities

## Current State Analysis

### Existing Infrastructure
- **Tech Stack**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Audio**: Web Audio API with secure URL generation
- **Mobile Web**: Responsive PWA with dedicated mobile routes (/mobile/*)

### Key Features Already Implemented
- User authentication (Supabase Auth)
- Playlist management (create, share, collaborate)
- Track upload and storage
- Audio playback with progress tracking
- Rating system (listened/liked/loved)
- Basic notes/comments (stored in track.notes field)
- Responsive mobile UI components

### Current Limitations
- Comments are basic notes, not threaded discussions
- No push notifications
- No offline playback
- Limited native mobile features (background play, lock screen controls)

## Development Approach

### Option 1: React Native (Recommended)
**Pros:**
- Reuse 70-80% of existing React code
- Single codebase for iOS and Android
- Familiar development environment
- Easy integration with existing TypeScript types
- React Native Track Player for native audio

**Cons:**
- Some platform-specific code needed
- Performance slightly lower than pure native

### Option 2: Flutter
**Pros:**
- Excellent performance
- Beautiful UI out of the box
- Strong audio packages

**Cons:**
- Complete rewrite required
- Different language (Dart)
- Team learning curve

### Option 3: Native Development
**Pros:**
- Best performance
- Full platform capabilities

**Cons:**
- Two separate codebases
- Highest development cost
- Longest timeline

## Recommended Architecture (React Native)

### Core Technologies
- **Framework**: React Native 0.73+
- **Navigation**: React Navigation 6
- **State Management**: Reuse existing Context API
- **Audio**: react-native-track-player
- **Storage**: AsyncStorage + MMKV for caching
- **Backend**: Existing Supabase infrastructure

### Project Structure
```
coretet-mobile/
├── src/
│   ├── components/
│   │   ├── common/       # Shared components
│   │   ├── player/       # Audio player UI
│   │   ├── playlists/    # Playlist management
│   │   └── ratings/      # Rating & comments
│   ├── screens/
│   │   ├── Auth/
│   │   ├── Home/
│   │   ├── NowPlaying/
│   │   ├── Playlists/
│   │   └── TrackDetails/
│   ├── services/
│   │   ├── audio/        # Audio playback service
│   │   ├── api/          # Supabase client
│   │   └── offline/      # Offline storage
│   ├── hooks/            # Reuse existing hooks
│   └── types/            # Reuse TypeScript types
├── ios/                  # iOS specific code
└── android/              # Android specific code
```

## Phase 1: MVP (8-10 weeks)

### Core Features
1. **Authentication**
   - Login/logout
   - Session persistence
   - Biometric authentication

2. **Playlist Browsing**
   - View owned playlists
   - View shared playlists
   - Search and filter

3. **Audio Playback**
   - Play/pause/skip
   - Background playback
   - Lock screen controls
   - Progress tracking
   - Volume control

4. **Track Ratings**
   - Listen/like/love buttons
   - View rating counts
   - Sync with web app

5. **Basic Comments**
   - Add notes to tracks
   - View existing notes
   - Timestamp comments

### Technical Implementation

#### Week 1-2: Project Setup
- Initialize React Native project
- Configure build environments
- Set up CI/CD pipeline
- Integrate Supabase SDK
- Port authentication flow

#### Week 3-4: Core UI
- Implement navigation structure
- Port existing mobile components
- Create native-optimized layouts
- Implement pull-to-refresh
- Add loading states

#### Week 5-6: Audio System
- Integrate react-native-track-player
- Implement playback queue
- Add background mode support
- Configure media controls
- Handle interruptions

#### Week 7-8: Features
- Port rating system
- Implement commenting UI
- Add playlist management
- Create track details view
- Implement search/filter

#### Week 9-10: Polish & Testing
- Performance optimization
- Error handling
- Beta testing
- Bug fixes
- App store preparation

## Phase 2: Enhanced Features (6-8 weeks)

### Advanced Comments System
1. **Threaded Comments**
   - Create new comments table
   - Implement reply functionality
   - Real-time updates
   - Mention notifications

2. **Collaboration Features**
   - See who's listening
   - Live activity indicators
   - Collaborative playlists

3. **Offline Mode**
   - Download tracks for offline
   - Sync ratings when online
   - Queue offline actions

### Database Schema Updates
```sql
-- New comments table
CREATE TABLE track_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES tracks(id),
  playlist_id UUID REFERENCES playlists(id),
  user_id UUID REFERENCES auth.users(id),
  parent_id UUID REFERENCES track_comments(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Phase 3: Track Rearrangement (4-6 weeks)

### Features
1. **Drag & Drop**
   - Visual feedback
   - Smooth animations
   - Auto-scroll
   - Undo/redo

2. **Batch Operations**
   - Multi-select
   - Bulk move/delete
   - Smart grouping

3. **Collaborative Editing**
   - Real-time sync
   - Conflict resolution
   - Edit history

## Development Timeline

### Total Timeline: 18-24 weeks

```
Phase 1 (MVP):           [========] 8-10 weeks
Phase 2 (Enhanced):      [======]   6-8 weeks
Phase 3 (Rearrangement): [====]     4-6 weeks
```

## Resource Requirements

### Team Composition
- 1 Lead Developer (React Native expert)
- 1 Mobile Developer (iOS/Android experience)
- 1 Backend Developer (part-time, Supabase)
- 1 UI/UX Designer (part-time)
- 1 QA Tester

### Infrastructure
- Apple Developer Account ($99/year)
- Google Play Developer Account ($25 one-time)
- Testing devices (min 4 iOS, 4 Android)
- CI/CD service (GitHub Actions/Bitrise)
- Crash reporting (Sentry)
- Analytics (Mixpanel/Amplitude)

## Key Decisions Required

1. **Comments Architecture**
   - Extend existing notes system vs. build new commenting system
   - Real-time sync requirements
   - Notification preferences

2. **Offline Strategy**
   - Which tracks to cache
   - Storage limits
   - Sync conflict resolution

3. **Platform Priorities**
   - iOS first vs. simultaneous release
   - Tablet support timeline
   - Web app feature parity

## Risk Mitigation

### Technical Risks
- **Audio Playback Issues**: Extensive testing on various devices
- **Offline Sync Conflicts**: Clear conflict resolution strategy
- **Performance**: Regular profiling and optimization

### Business Risks
- **User Adoption**: Beta testing program
- **App Store Rejection**: Early review of guidelines
- **Feature Creep**: Strict MVP scope

## Success Metrics

### Phase 1
- App store approval
- 90% feature parity with mobile web
- <3s app launch time
- 95% crash-free rate

### Phase 2
- 50% of users engage with comments
- 30% use offline mode
- 4.0+ app store rating

### Phase 3
- 70% of playlist owners use rearrangement
- <100ms drag response time
- Zero data loss incidents

## Next Steps

1. **Immediate Actions**
   - Finalize technology choice
   - Set up development environment
   - Create detailed Phase 1 sprint plan
   - Begin UI/UX mockups

2. **Week 1 Deliverables**
   - Project repository setup
   - CI/CD pipeline
   - Basic app shell
   - Authentication flow

3. **Stakeholder Approval**
   - Review and approve plan
   - Allocate resources
   - Set launch date targets