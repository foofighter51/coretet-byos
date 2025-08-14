# CoreTet (No AI) - Beta Testing Checklist

## Pre-Testing Setup

### 1. Environment Configuration
- [ ] Clone the repository
- [ ] Copy `.env.example` to `.env`
- [ ] Add your Supabase credentials:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### 2. Installation
- [ ] Run `npm install`
- [ ] Verify no critical errors during installation

### 3. Start Development Server
- [ ] Run `npm run dev`
- [ ] Access the app at http://localhost:5173
- [ ] Verify the app loads without console errors

## Core Functionality Testing

### 1. Authentication
- [ ] **Sign Up Flow**
  - [ ] Create new account with email/password
  - [ ] Verify email confirmation (if enabled)
  - [ ] Check error handling for invalid inputs
  - [ ] Test password requirements
  
- [ ] **Sign In Flow**
  - [ ] Sign in with valid credentials
  - [ ] Test "forgot password" functionality
  - [ ] Verify error messages for incorrect credentials
  - [ ] Test session persistence (refresh page after login)

### 2. Admin Setup (First User)
- [ ] Verify first user gets admin privileges
- [ ] Access admin dashboard
- [ ] Test system stats display

### 3. File Upload
- [ ] **Supported Formats**
  - [ ] Upload MP3 files
  - [ ] Upload WAV files
  - [ ] Upload FLAC files
  - [ ] Upload M4A/AAC files
  - [ ] Test rejection of unsupported formats
  
- [ ] **Upload Process**
  - [ ] Drag and drop functionality
  - [ ] Click to browse functionality
  - [ ] Multiple file upload
  - [ ] Upload progress indication
  - [ ] Error handling for failed uploads

### 4. Track Management
- [ ] **Metadata Editing**
  - [ ] Edit track title
  - [ ] Edit artist name
  - [ ] Edit album
  - [ ] Edit year
  - [ ] Add/remove genre tags
  - [ ] Add/remove mood tags
  - [ ] Add/remove instrument tags
  - [ ] Add custom tags
  - [ ] Save changes successfully
  
- [ ] **Track Organization**
  - [ ] View all tracks in library
  - [ ] Search tracks by title/artist
  - [ ] Filter by tags
  - [ ] Sort tracks (by date, title, artist)

### 5. Audio Playback
- [ ] Play/pause functionality
- [ ] Seek/scrub through track
- [ ] Volume control
- [ ] Next/previous track navigation
- [ ] Track progress display
- [ ] Current track info display

### 6. User Management (Admin Only)
- [ ] View all users
- [ ] Create invite codes
- [ ] Manage user permissions
- [ ] Delete/suspend users

## Performance & Compatibility

### 1. Browser Testing
- [ ] Chrome/Chromium
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### 2. Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### 3. Performance
- [ ] Page load time < 3 seconds
- [ ] Smooth scrolling
- [ ] No UI lag during playback
- [ ] Efficient handling of large libraries (100+ tracks)

## Known Issues to Verify

### Current Limitations
1. **No AI Analysis** - This version has AI features removed
2. **Manual Tagging Only** - All metadata must be entered manually
3. **Local Storage** - Using Supabase storage (no AWS S3 in this version)

### Security Considerations
- [ ] Verify file upload size limits
- [ ] Check authentication token expiry
- [ ] Test unauthorized access attempts
- [ ] Verify CORS configuration

## Bug Reporting Template

When reporting issues, please include:

```markdown
**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14.0]
- Screen size: [e.g., 1920x1080]

**Steps to Reproduce:**
1. [First step]
2. [Second step]
3. [etc.]

**Expected Behavior:**
[What should happen]

**Actual Behavior:**
[What actually happens]

**Screenshots/Console Errors:**
[If applicable]
```

## Post-Testing

### Feedback Areas
1. **User Experience**
   - Intuitiveness of the interface
   - Clarity of features
   - Any confusing elements

2. **Feature Requests**
   - Missing functionality
   - Desired improvements
   - Integration needs

3. **Performance Issues**
   - Slow operations
   - Memory usage concerns
   - Network request delays

### Data Collection
- [ ] Export console logs
- [ ] Note any error messages
- [ ] Document reproduction steps for bugs
- [ ] Capture screenshots of issues

## Contact

For urgent issues during testing:
- Create an issue in the repository
- Include the bug report template information
- Tag as "beta-testing" and appropriate severity

Thank you for helping test CoreTet!