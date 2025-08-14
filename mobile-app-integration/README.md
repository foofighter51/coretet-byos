# CoreTet Mobile App Integration Guide

## Overview
This directory contains all the necessary files and documentation to integrate the CoreTet mobile app with the existing web application.

## Directory Structure
```
mobile-app-integration/
├── README.md                 # This file
├── types/                    # TypeScript interfaces and types
├── supabase/                 # Database schema and client setup
├── auth/                     # Authentication implementation details
├── api-patterns/             # Common API patterns and examples
└── color-scheme.md           # UI color scheme reference
```

## Quick Start

1. **Copy TypeScript Types**: All core types are in the `types/` directory
2. **Supabase Setup**: Check `supabase/client.ts` for configuration
3. **Authentication**: See `auth/` for magic link implementation
4. **Database Schema**: Review `supabase/schema.sql` for table structures

## Key Integration Points

### 1. Authentication
- Magic link authentication via Supabase Auth
- Session management with refresh tokens
- User profiles stored in `user_profiles` table

### 2. Core Data Models
- **Tracks**: Audio files with metadata, ratings, and tags
- **Playlists**: User-created collections of tracks
- **Ratings**: Three-tier system (listened, liked, loved)
- **Tags**: Flexible categorization system

### 3. Real-time Features
- Track updates via Supabase subscriptions
- Playlist sharing with real-time sync
- Collaborative features for shared playlists

### 4. File Storage
- Audio files stored in Supabase Storage
- Waveform data cached in database
- File URLs generated with signed tokens

## API Patterns

### Track Operations
- Create/Read/Update/Delete tracks
- Bulk operations for multiple tracks
- Soft delete with 30-day recovery

### Playlist Management
- Create and manage playlists
- Add/remove tracks with order preservation
- Share playlists with other users

### Search and Filtering
- Full-text search across track metadata
- Advanced filtering by BPM, key, tags, etc.
- Saved filter presets

## Mobile-Specific Considerations

1. **Offline Support**: Consider caching strategies for tracks
2. **Audio Playback**: Use native audio APIs for better performance
3. **File Upload**: Implement chunked uploads for large files
4. **Push Notifications**: For playlist shares and updates

## Color Scheme
See `color-scheme.md` for the complete CoreTet color palette and usage guidelines.