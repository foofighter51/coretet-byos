# CoreTet Current System Analysis

## 🏗️ Current Architecture

### Database Schema (Simplified)
After the rebuild, we have a clean, minimal structure:

1. **Core Tables**
   - `tracks` - Audio files with metadata
   - `playlists` - User-created playlists
   - `playlist_tracks` - Links tracks to playlists
   - `profiles` - Basic user profiles

2. **Rating Tables**
   - `personal_track_ratings` - Personal library ratings
   - `playlist_track_ratings` - Ratings within playlist context
   - `playlist_track_rating_summary` (view) - Aggregated ratings

3. **Removed Tables**
   - `playlist_shares` - Was causing complexity
   - `collaborators` - Old sharing system
   - Various permission tables

### Current Features Working
✅ User authentication (Supabase Auth)
✅ Track upload to Supabase Storage
✅ Playlist creation and management
✅ Personal track ratings
✅ Secure file access via edge functions
✅ Mobile PWA with offline capability
✅ Audio playback with mobile optimizations

### Current Limitations
❌ No playlist sharing mechanism
❌ No collaborator management
❌ Playlist ratings exist but no sharing context
❌ No real-time updates between users

## 🎯 Your Vision: Mobile-First Collaborative Playlists

### Requirements as I understand them:
1. **Share playlists with collaborators**
   - Simple sharing mechanism (email-based?)
   - Mobile/PWA optimized interface
   
2. **Collaborators can listen to shared playlists**
   - Access control (view-only vs. rate permissions)
   - Smooth mobile playback experience
   
3. **Rating system for shared tracks**
   - All collaborators see aggregated ratings
   - Individual rating privacy options?
   - Real-time or near real-time updates

## 🤔 Implementation Considerations

### Option A: Lightweight Sharing (Recommended)
```sql
-- Single table approach
CREATE TABLE playlist_shares (
  id UUID PRIMARY KEY,
  playlist_id UUID REFERENCES playlists,
  shared_by UUID REFERENCES profiles,
  shared_with_email TEXT,
  permissions TEXT[], -- ['view', 'rate']
  share_token TEXT UNIQUE, -- For link-based sharing
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Pros:**
- Simple to implement
- Works well with existing RLS
- Mobile-friendly (share via link)
- No complex user management

**Cons:**
- Limited to email-based sharing
- No advanced permissions

### Option B: Full Collaboration System
```sql
-- Multiple tables for rich features
CREATE TABLE collaborators (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  avatar_url TEXT
);

CREATE TABLE playlist_collaborators (
  playlist_id UUID,
  collaborator_id UUID,
  role TEXT, -- 'viewer', 'rater', 'editor'
  invited_by UUID,
  accepted_at TIMESTAMPTZ
);
```

**Pros:**
- Rich collaboration features
- Better for future expansion
- Professional feel

**Cons:**
- More complex to build/maintain
- Potential RLS complexity returns
- Heavier for mobile

### Option C: Public Link Sharing (Simplest)
```sql
-- Just add to playlists table
ALTER TABLE playlists ADD COLUMN 
  public_share_id TEXT UNIQUE,
  share_settings JSONB DEFAULT '{"allow_ratings": true}';
```

**Pros:**
- Dead simple
- No user management
- Perfect for mobile PWA
- Easy social sharing

**Cons:**
- Less control over access
- No user attribution for ratings

## 📱 Mobile-First Considerations

### Current Mobile Setup
- PWA manifest configured
- Service worker for offline
- Wake lock for playback
- Media session API
- Touch-optimized UI

### For Sharing Enhancement
1. **Share Flow**
   - Native share API integration
   - QR codes for in-person sharing
   - Deep linking support

2. **Collaborative Features**
   - WebSocket for real-time rating updates
   - Optimistic UI updates
   - Offline rating queue

3. **Performance**
   - Lazy load shared playlists
   - Cache shared playlist data
   - Minimize API calls

## 🔐 Security Considerations

### Current Security
- RLS policies on all tables
- Signed URLs for audio files
- User isolation working well

### For Sharing
- Need to maintain security while enabling access
- Consider token-based access for non-users
- Rate limiting for public shares
- Audit trail for shared content

## 💭 Questions for You

1. **User Management**
   - Do collaborators need accounts?
   - Or is anonymous rating OK?
   - Email verification required?

2. **Sharing Scope**
   - Share entire playlists only?
   - Or individual tracks too?
   - Time-limited shares?

3. **Rating Visibility**
   - Show who rated what?
   - Or just aggregated numbers?
   - Private vs. public ratings?

4. **Mobile Experience**
   - Native app eventual goal?
   - PWA sufficient for now?
   - Offline rating sync important?

5. **Scale Considerations**
   - How many collaborators per playlist?
   - How many shared playlists per user?
   - Real-time updates critical?

## 🚀 Recommended Path Forward

Based on the current clean architecture, I suggest:

1. **Phase 1: Simple Link Sharing**
   - Add public_share_id to playlists
   - Create share links with tokens
   - Anonymous rating with localStorage

2. **Phase 2: Email-Based Sharing**
   - Add lightweight playlist_shares table
   - Send email invites
   - Track who's rating

3. **Phase 3: Real-time Collaboration**
   - Add WebSocket support
   - Live rating updates
   - Presence indicators

This approach:
- Maintains the clean architecture
- Starts simple, evolves naturally
- Mobile-first at each step
- Avoids the RLS complexity we just escaped

What are your thoughts on this analysis? Which direction feels right for your vision?