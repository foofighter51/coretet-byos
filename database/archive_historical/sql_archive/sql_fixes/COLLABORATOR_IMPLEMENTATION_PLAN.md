# Collaborator System Implementation Plan

## Overview
A simple, secure system for band members to collaborate on playlists with transparent rating system.

## User Flow

### 1. **Sharing a Playlist (Main User)**
```
Main User → Click "Share" on playlist → Enter collaborator emails → Send invites
```
- Generates unique share tokens for each email
- Sends email with signup/login link
- Shows pending/active status for each share

### 2. **Collaborator Signup/Login**
```
Receives email → Clicks link → Sign up (if new) or Log in → Access playlist
```
- Simple email/password auth (separate from main Supabase auth)
- Lightweight profile (just name for display)
- Automatic playlist access upon signup

### 3. **Collaborator Experience**
```
View shared playlists → Play tracks → Rate (listened/liked/loved) → See all ratings
```
- Read-only playlist access
- Can play all tracks
- Rate with single click
- See who rated what

## Technical Implementation Steps

### Step 1: Database Setup ✅
- Run migration: `20250724_collaborator_system.sql`
- Creates all necessary tables with RLS

### Step 2: Backend APIs (Edge Functions)
```typescript
// 1. collaborator-auth
- POST /signup - Create collaborator account
- POST /login - Authenticate collaborator
- POST /logout - Clear session

// 2. share-playlist  
- POST /share - Send email invites
- GET /validate-token - Check share token

// 3. collaborator-api
- GET /playlists - Get shared playlists
- GET /playlist/:id/tracks - Get tracks with ratings
- POST /rate - Rate a track
```

### Step 3: Frontend Components

#### Main User Components:
1. **SharePlaylistModal**
   - Email input (comma-separated)
   - Show existing shares
   - Revoke access option

2. **PlaylistRatingsView**
   - Show aggregate ratings per track
   - Click to see who rated what

#### Collaborator Components:
1. **CollaboratorAuth**
   - Simple login/signup form
   - Session management

2. **CollaboratorDashboard**
   - List of shared playlists
   - Clean, read-only interface

3. **CollaboratorPlaylistView**
   - Track list with play buttons
   - Rating buttons (3 states)
   - Show all ratings transparently

### Step 4: Email Integration
Use Resend (already set up) for invite emails:
```html
Subject: [Artist Name] shared a playlist with you

Hi [Name],

[Artist Name] has shared the playlist "[Playlist Name]" with you on CoreTet.

Click here to listen and rate tracks:
[Link with share token]

If you're new, you'll need to create a quick account with just your email and a password.
```

### Step 5: Security Measures
1. **Session Management**: 
   - 7-day sessions for collaborators
   - Separate from main user auth

2. **Audio Access**:
   - Generate temporary signed URLs 
   - Valid only for shared playlists

3. **Rate Limiting**:
   - Max 10 invites per playlist per day
   - Max 100 ratings per collaborator per day

## UI/UX Decisions

### For Main Users:
- Add "Share" button next to playlist name
- Show rating counts inline: ❤️ 2 👍 1 👂 3
- Click counts to see details

### For Collaborators:
- Minimal interface - just essentials
- Large, touch-friendly rating buttons
- Clear visual feedback on rating

### Mobile Considerations:
- Responsive design
- Touch-optimized controls
- Works as web app on phones

## Data Structure Example

```typescript
// Playlist with ratings
{
  id: "playlist-123",
  name: "New Album Demos",
  tracks: [
    {
      id: "track-456",
      name: "Song Title",
      ratings: {
        listened: 3,
        liked: 2,
        loved: 1,
        details: [
          { name: "John", rating: "loved", rated_at: "..." },
          { name: "Jane", rating: "liked", rated_at: "..." },
          { name: "Bob", rating: "liked", rated_at: "..." }
        ]
      }
    }
  ]
}
```

## Phase 1 Deliverables
1. ✅ Database schema
2. Collaborator auth system
3. Share playlist functionality  
4. Basic rating system
5. Simple collaborator interface

## Phase 2 (Future)
- Comments on tracks
- Playlist activity feed
- Mobile app
- Download permissions

## Next Steps
1. Implement collaborator auth edge functions
2. Create share playlist UI
3. Build collaborator dashboard
4. Add rating functionality
5. Test with real collaborators