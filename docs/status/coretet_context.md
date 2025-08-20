 # Coretet - Music Library Management Application
## Comprehensive Context Document for Agent Personas

### Executive Summary
Coretet is a sophisticated web-based music library management application designed for musicians, producers, and audio professionals to organize, categorize, and collaborate on their audio files. Unlike typical music players, Coretet focuses on creative workflow management with features tailored for work-in-progress tracks, demos, and collaborative music production.

### Product Vision & Purpose
- **Primary Goal**: Provide musicians with a centralized platform to manage their creative output across various stages of production
- **Target Users**: Musicians, producers, songwriters, and audio engineers who need to organize large collections of demos, ideas, and finished tracks
- **Unique Value**: Manual, user-driven organization system that respects creative workflows without imposing AI-driven categorization

### Technical Architecture

#### Frontend Stack
- **Framework**: React 18.3.1 with TypeScript 5.5.3
- **Routing**: React Router DOM 7.7.0
- **Styling**: Tailwind CSS 3.4.1 with custom forest theme
- **Build Tool**: Vite 5.4.2
- **Icons**: Lucide React 0.344.0

#### Backend Infrastructure
- **Platform**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Storage**: Supabase Storage (formerly AWS S3, migrated for better integration)
- **Authentication**: Email/password with invite-only registration system
- **Edge Functions**: Custom serverless functions for secure URL generation and email notifications

#### Deployment
- **Hosting**: Netlify (with custom _headers for security)
- **Domain**: coretet.com
- **Environment**: Production with staging capabilities

### Core Features

#### 1. Track Management
- **Upload**: Drag-and-drop interface supporting MP3, WAV, FLAC, M4A, AAC, OGG
- **Categories**: Songs, Demos, Ideas, Voice Memos, Final Versions, Live Performances
- **Metadata**: Manual editing of artist, collection, key, tempo, mood, genre, notes
- **Variations**: Track different versions/takes of the same song
- **Soft Delete**: 30-day recovery period for deleted tracks

#### 2. Organization Systems
- **Tags**: Flexible tagging system with autocomplete
- **Collections**: Group related tracks (albums, projects, sessions)
- **Playlists**: User-created lists with manual ordering capability
- **Smart Filters**: By category, tags, date, metadata fields

#### 3. Audio Playback
- **Player**: Custom audio player with transport controls
- **Waveform Visualization**: Two types:
  - Simple bars visualization for overview
  - Detailed DAW-style waveform for precise navigation
- **Keyboard Shortcuts**: Space to play/pause, arrow keys for navigation
- **Now Playing**: Persistent player bar with track info

#### 4. Collaboration Features
- **Playlist Sharing**: Share playlists via email invites
- **Collaborator Access**: Limited access for non-registered users
- **Shared Ratings**: Collaborative like/love rating system
- **Comments**: Track-level notes and feedback (planned)

#### 5. User Experience
- **Three-Column Layout**:
  - Left: Navigation, search, playlists
  - Center: Track list with sorting/filtering
  - Right: Track details and editing panel
- **Mobile Optimization**: Separate mobile routes with touch-optimized UI
- **Interactive Tutorial**: First-time user onboarding
- **Toast Notifications**: Non-intrusive feedback system

### Design System

#### Color Palette (Forest Theme)
- **Primary Colors**:
  - Dark Forest: #0a1612 (backgrounds)
  - Main Forest: #1a2e26 (panels)
  - Light Forest: #243830 (hover states)
- **Accent Colors**:
  - Yellow: #e4da38 (primary actions, highlights)
  - Coral: #d27556 (playback indicators, warnings)
  - Silver: #ebeae8 (text, borders)

#### Typography
- **Headers**: Anton (bold, impactful)
- **Body Text**: Quicksand (friendly, readable)
- **Monospace**: System mono fonts for technical info

#### UI Patterns
- **Animations**: Smooth transitions (fade, slide, scale)
- **Hover States**: Subtle color shifts and shadows
- **Loading States**: Skeleton screens and spinners
- **Empty States**: Helpful messages and action prompts

### User Workflows

#### 1. Music Producer Workflow
1. Upload session recordings and demos
2. Tag by project, date, collaborators
3. Create playlists for different versions
4. Share with collaborators for feedback
5. Mark final versions when complete

#### 2. Songwriter Workflow
1. Upload voice memos and ideas
2. Organize by song title or concept
3. Track progression from idea to demo
4. Use variations for different arrangements
5. Export finished songs

#### 3. Band/Collaboration Workflow
1. Create shared project playlists
2. Upload rehearsal recordings
3. Rate and comment on takes
4. Track song evolution
5. Maintain version history

### Security & Privacy
- **Row Level Security**: PostgreSQL policies ensure data isolation
- **Invite-Only**: Controlled user registration
- **Secure URLs**: Time-limited signed URLs for audio streaming
- **Admin Controls**: User management and system monitoring

### Performance Considerations
- **Lazy Loading**: Tracks loaded on scroll
- **Waveform Caching**: Generated waveforms stored for reuse
- **Optimized Queries**: Indexed database fields
- **CDN Delivery**: Static assets served via CDN

### Known Limitations & Issues
1. **Waveform Loading**: Can be slow for large files
2. **Mobile Playback**: Some Android devices have streaming issues
3. **Search**: Currently limited to title/artist (full-text search planned)
4. **Offline Mode**: Not currently supported
5. **File Size**: 50MB limit per track (Supabase constraint)

### Future Roadmap

#### High Priority
1. **Arrangements Feature**: Mark and save song sections (verse, chorus, bridge)
2. **Performance Optimization**: Virtual scrolling for large libraries
3. **Advanced Search**: Full-text search across all metadata

#### Medium Priority
1. **Mobile Apps**: Native iOS/Android applications
2. **Batch Operations**: Multi-select for bulk editing
3. **Keyboard Shortcuts**: Power user features
4. **Export Options**: Playlist export, backup/restore

#### Long Term Vision
1. **Plugin Ecosystem**: Third-party integrations
2. **AI Features**: Optional AI-powered features (opt-in only)
3. **Social Features**: Public profiles, track sharing
4. **Analytics**: Listening patterns, creative insights

### Integration Points for Agents

#### Direct Project Access
If you want to provide agents direct access to the project:
1. **Repository**: GitHub repository access (if available)
2. **Read-Only Database**: Supabase read-only credentials
3. **API Access**: RESTful API endpoints via Supabase
4. **Test Account**: Demo account with sample data

#### Context Files
Essential files for understanding the codebase:
- `/src/types/index.ts` - Core data models
- `/src/components/MainApp.tsx` - Application structure
- `/src/contexts/AudioContext.tsx` - Audio playback logic
- `/src/contexts/LibraryContext.tsx` - Data management
- `/context_2025_01_30.md` - Recent development history

### Feedback Areas for Agent Personas

1. **UX/UI Design**: Layout, navigation, visual hierarchy
2. **Feature Prioritization**: What's most valuable for musicians?
3. **Performance**: Loading times, responsiveness
4. **Mobile Experience**: Touch interactions, small screens
5. **Collaboration Tools**: Sharing, permissions, communication
6. **Metadata System**: What fields are missing?
7. **Search & Discovery**: How to find tracks quickly?
8. **Workflow Integration**: DAW integration, file sync?

### Technical Debt & Considerations
- Migration from AWS S3 to Supabase Storage (completed)
- Removal of AI features for simplified, manual approach
- Need for comprehensive test suite
- Documentation improvements needed
- Performance optimization for large libraries (1000+ tracks)

### Contact & Resources
- **Production URL**: https://coretet.com
- **Documentation**: Internal `/docs` folder
- **Support**: Via in-app feedback system
- **Updates**: Version notifications in-app

This context document provides a comprehensive overview of Coretet for agent personas to understand the application's purpose, architecture, features, and future direction. The app represents a thoughtful approach to music library management that prioritizes user control and creative workflows over automated organization.