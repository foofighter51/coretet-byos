# CoreTet - Project Overview & Technical Documentation

## 📱 Product Overview

### What is CoreTet?
CoreTet is a web-based music organization and playback platform designed for musicians, producers, and music enthusiasts to manage their audio library with advanced categorization, tagging, and collaborative features.

### Core Features
- **Audio Library Management**: Upload, organize, and stream music files
- **Advanced Categorization**: 6 track types (Songs, Final Versions, Live Performances, Demos, Ideas, Voice Memos)
- **Metadata System**: Artist, album, genre (multi-select), key, tempo, time signature
- **Rating System**: Listened/Liked/Loved status tracking
- **Playlist Management**: Create and share playlists
- **Task Tracking**: To-do system for music-related tasks
- **Collaborative Features**: Share playlists with other users
- **PWA Support**: Installable as mobile/desktop app
- **Theme System**: 6 color themes (Forest, Ocean, Sunset, Midnight, Lavender, Coral)

## 🛠 Technical Stack

### Frontend
- **Framework**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 5.4.19
- **Routing**: React Router DOM 7.7.0
- **Styling**: 
  - Tailwind CSS 3.4.15
  - Custom theme system with CSS variables
  - Fonts: Anton (headers), Quicksand (body)

### Backend & Database
- **Backend**: Supabase (PostgreSQL)
  - Authentication (Magic links, password reset)
  - Real-time subscriptions
  - Row Level Security (RLS)
  - Storage buckets for audio files
- **Database Schema**:
  - `profiles`: User profiles with storage quotas
  - `tracks`: Audio file metadata and references
  - `playlists`: User-created playlists
  - `playlist_tracks`: Many-to-many relationship
  - `playlist_shares`: Collaboration features
  - `tasks`: Music-related to-dos

### State Management
- **Context Providers**:
  - `AuthContext`: User authentication state
  - `AudioContext`: Playback control and queue management
  - `LibraryContext`: Track library and data fetching
  - `ToastContext`: Notification system
  - `ErrorContext`: Global error handling

### Audio Handling
- **Supported Formats**: MP3, M4A, WAV, FLAC
- **Max File Size**: 100MB per file
- **Storage**: Supabase Storage buckets
- **Playback**: HTML5 Audio API with custom controls
- **Features**: 
  - Queue management
  - Shuffle/repeat modes
  - Waveform visualization (placeholder)
  - Mini/full player modes

## 📁 Project Structure

```
coretet_no_ai/
├── src/
│   ├── components/
│   │   ├── Admin/          # Admin dashboard
│   │   ├── Audio/          # Audio player components
│   │   ├── Auth/           # Authentication forms
│   │   ├── ErrorHandling/  # Error boundaries & handlers
│   │   ├── Forms/          # Reusable form components
│   │   ├── Layout/         # Header, Sidebar, navigation
│   │   ├── Library/        # Track list, metadata editors
│   │   ├── Player/         # Audio player UI
│   │   ├── Playlists/      # Playlist management
│   │   ├── Tasks/          # Task tracking features
│   │   ├── TrackDetails/   # Detailed track view
│   │   ├── Tutorial/       # Onboarding flow
│   │   └── Upload/         # File upload components
│   ├── contexts/           # React Context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # External service configs
│   ├── pages/              # Page components
│   ├── routes/             # Route definitions
│   ├── styles/             # Global styles & themes
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── database/
│   ├── migrations/         # SQL migration scripts
│   └── scripts/            # Database utilities
├── public/                 # Static assets
└── dist/                   # Production build

```

## 🎨 Design System

### Theme Colors
- **Primary**: Forest (dark green - #0a1612)
- **Accent Colors**:
  - Yellow (#c1b659)
  - Coral (#d97b73)
  - Purple (#7f6e9e)
  - Teal (#5ba098)
- **Neutral**: Silver (#e5e5e5)

### Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Separate mobile routes for optimized experience
- Touch-optimized controls

### UI Components
- Custom dropdowns with multi-select
- Tag-based selection system
- Modal overlays for forms
- Toast notifications
- Animated transitions (Framer Motion)

## 🔐 Security & Performance

### Security Features
- Row Level Security (RLS) on all tables
- User authentication via Supabase Auth
- Secure file uploads with user isolation
- API key management via environment variables

### Performance Optimizations
- Lazy loading of components
- Virtual scrolling for large lists (react-window)
- Service Worker for offline caching
- Optimistic UI updates
- Debounced search/filter operations

### Current Performance Metrics
- Bundle size: 836KB (needs optimization)
- Lighthouse scores: TBD
- Initial load time: ~2-3s

## 🚀 Deployment & Infrastructure

### Hosting
- **Frontend**: Netlify (automatic deploys from GitHub)
- **Backend**: Supabase cloud
- **Domain**: coretet.app
- **SSL**: Automatic via Netlify

### Build Process
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 18+
- Auto-versioning on build

### Environment Variables
Required in `.env`:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 📊 Current Statistics

### Database
- **Users**: Test environment
- **Storage**: Audio files in Supabase Storage
- **Limits**: 
  - Free tier: 10GB storage
  - Premium tier: 100GB storage
  - Admin: Unlimited

### Feature Usage
- Track categorization by type
- Multi-genre support (26 genres)
- Musical key tracking (24 keys)
- Collaborative playlists
- Task management integration

## 🐛 Known Issues & Limitations

### Current Issues
1. Bundle size warning (>500KB)
2. Waveform visualization is placeholder
3. No real audio analysis (tempo/key detection)
4. Limited mobile gesture support

### Technical Debt
1. Unused imports need cleanup
2. Test coverage minimal
3. Some debug utilities in production
4. TypeScript 'any' types used for Supabase workarounds

## 🎯 Potential Improvements

### High Impact
1. **Audio Analysis**: Integrate actual tempo/key detection
2. **Real Waveforms**: Generate actual audio waveforms
3. **Offline Mode**: Full offline playback support
4. **Mobile App**: Native iOS/Android apps
5. **Social Features**: User profiles, following, sharing

### Performance
1. **Code Splitting**: Reduce initial bundle size
2. **Image Optimization**: Lazy load album art
3. **CDN Integration**: Serve audio via CDN
4. **Database Indexing**: Optimize query performance

### User Experience
1. **Drag & Drop**: Reorder playlists/queue
2. **Batch Operations**: Multi-select actions
3. **Keyboard Shortcuts**: Power user features
4. **Advanced Search**: Filter combinations
5. **Auto-tagging**: AI-suggested tags

### Developer Experience
1. **Testing Suite**: Comprehensive test coverage
2. **Documentation**: API documentation
3. **CI/CD Pipeline**: Automated testing
4. **Error Monitoring**: Sentry integration
5. **Analytics**: Usage tracking

## 🔄 Recent Updates (August 2025)

### Latest Features
- Multi-genre selection
- Musical key dropdown (all major/minor keys)
- 7 new genres added
- Password reset flow
- Fixed Supabase schema cache issues

### Infrastructure Changes
- Migrated to new development machine
- Reconnected Netlify deployment
- Created RPC functions for upload bypass

## 📚 Dependencies

### Major Libraries
- react: 18.3.1
- @supabase/supabase-js: 2.52.0
- tailwindcss: 3.4.15
- framer-motion: 11.15.0
- date-fns: 4.1.0
- lucide-react: 0.344.0
- react-dropzone: 14.3.8

### Development Tools
- vite: 5.4.19
- typescript: 5.5.4
- eslint: 9.9.1
- vitest: 3.2.4
- netlify-cli: (global)

## 🤝 Integration Points

### External Services
- **Supabase**: Database, Auth, Storage
- **Netlify**: Hosting, CDN, Functions
- **GitHub**: Version control, CI/CD trigger

### Potential Integrations
- Spotify API for metadata
- Last.fm for scrobbling
- Discord for notifications
- Webhooks for automation
- AI services for analysis

## 📞 Support & Maintenance

### Monitoring
- Build status via Netlify dashboard
- Database metrics via Supabase dashboard
- Error tracking (to be implemented)

### Backup Strategy
- Database: Supabase automatic backups
- Code: GitHub repository
- Audio files: Supabase Storage

### Update Cycle
- Frontend: Deploy on push to main
- Database: Manual migrations
- Dependencies: Monthly review

---

*Document Version: 1.0*
*Last Updated: August 8, 2025*
*Next Review: September 2025*