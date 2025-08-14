# CoreTet BYOS - Complete Development Guide

## 🚀 Project Setup Instructions

### Prerequisites
- Existing `coretet_no_ai` project
- Node.js 18+
- VS Code
- Git
- Supabase account
- Google Cloud Console account (for OAuth)

---

## Step 1: Create New Project Folder

### Terminal Commands (Run These First)
```bash
# Navigate to your projects directory
cd ~/Projects  # or wherever you keep your code

# Create new folder by copying existing project
cp -r coretet_no_ai coretet-byos

# Navigate into new folder
cd coretet-byos

# Clean up copied files
rm -rf node_modules dist .git
rm .env .env.local .env.production 2>/dev/null

# Initialize fresh git repo
git init
git add .
git commit -m "Initial fork from coretet_no_ai for BYOS version"

# Open in VS Code
code .
```

### In VS Code Terminal
```bash
# Install dependencies
npm install

# Test that it still runs
npm run dev
# Visit http://localhost:5173 to confirm it works
# Then stop the server (Ctrl+C)
```

---

## Step 2: Claude Code Prompts

### 📌 Prompt #0: Preserve Current Design
```
I have a CoreTet project with an existing design system. Please help me preserve all current styling while adding BYOS features:

1. Analyze my current theme system in:
   - src/styles/themes.css (CSS variables)
   - tailwind.config.js
   - Current fonts: Anton (headers), Quicksand (body)
   - Color scheme with Forest theme and accent colors

2. Create src/styles/byos-components.css that:
   - Extends existing theme variables
   - Adds new classes only for storage provider UI
   - Uses existing color palette (#0a1612, #c1b659, #d97b73, #7f6e9e, #5ba098)

3. When creating new components, use:
   - Existing button styles from src/components/Forms/Button.tsx
   - Existing modal styles from src/components/Forms/Modal.tsx
   - Existing card styles from throughout the app
   - Current responsive breakpoints (sm: 640px, md: 768px, lg: 1024px)

4. DO NOT change:
   - Any existing component styles
   - Theme colors or CSS variables
   - Font families or sizes
   - Layout structure or spacing

Show me how to apply existing styles to new BYOS components.
```

### 📌 Prompt #1: Initial Setup
```
I'm in a new VS Code project folder called coretet-byos that's a copy of my coretet_no_ai project. Help me set up the BYOS version:

1. Update package.json:
   - Change "name" to "coretet-byos"
   - Change "version" to "2.0.0-alpha"
   - Add these new dependencies:
     "@react-oauth/google": "^0.12.1"
     "dropbox": "^10.34.0"
     "@microsoft/microsoft-graph-client": "^3.0.7"
     "axios": "^1.6.0"

2. Create a new README.md:
   ```markdown
   # CoreTet BYOS - Bring Your Own Storage
   
   Version 2.0 of CoreTet where users connect their own cloud storage.
   
   ## Supported Providers
   - Google Drive
   - Dropbox
   - OneDrive (coming soon)
   
   ## Development
   npm install
   npm run dev
   ```

3. Create .env.example:
   ```
   # Supabase (kept for auth and metadata)
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OAuth Providers
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   VITE_DROPBOX_APP_KEY=your_dropbox_app_key
   VITE_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

4. Update .gitignore to include:
   ```
   .env
   .env.local
   .env.production
   ```

5. Run npm install after making these changes
```

### 📌 Prompt #2: Remove Supabase Storage Dependencies
```
Help me remove direct Supabase storage dependencies while keeping auth and database:

1. Find and comment out all supabase.storage references:
   - src/contexts/LibraryContext.tsx - uploadTrack function
   - src/components/Audio/AudioPlayer.tsx - getPublicUrl calls
   - src/utils/storage.ts - any storage utilities
   
   Add comment: // TODO: BYOS - Replace with provider.getStreamUrl()

2. Create src/types/storage.ts with:
   ```typescript
   export interface StorageProvider {
     name: 'google_drive' | 'dropbox' | 'onedrive' | 'supabase';
     connected: boolean;
     quota?: { used: number; total: number };
   }
   
   export interface FileReference {
     id: string;
     provider: string;
     providerId: string;
     fileName: string;
     fileSize: number;
     mimeType: string;
     url?: string;
   }
   ```

3. Update src/types/index.ts to include the storage types

4. In src/contexts/LibraryContext.tsx, stub the uploadTrack function:
   ```typescript
   const uploadTrack = async (file: File, metadata: any) => {
     console.log('BYOS: Upload will go to selected provider', file, metadata);
     // TODO: Implement provider upload
     return null;
   };
   ```

5. List all files that were modified and what still needs implementation
```

### 📌 Prompt #3: Storage Provider Architecture
```
Create a storage provider abstraction system using the existing app's patterns:

1. Create src/services/storage/types.ts:
   ```typescript
   export interface IStorageProvider {
     connect(): Promise<void>;
     disconnect(): Promise<void>;
     isConnected(): boolean;
     uploadFile(file: File, path: string): Promise<FileReference>;
     deleteFile(fileId: string): Promise<void>;
     getStreamUrl(fileId: string): Promise<string>;
     getQuota(): Promise<{ used: number; total: number }>;
     listFiles(path?: string): Promise<FileReference[]>;
   }
   ```

2. Create src/services/storage/providers/GoogleDriveProvider.ts:
   - Implement IStorageProvider interface
   - Use gapi client library for Google Drive API
   - Handle OAuth token refresh

3. Create src/services/storage/providers/MockProvider.ts:
   - For testing without real provider connection
   - Returns fake URLs and simulates uploads

4. Create src/services/storage/StorageManager.ts:
   - Singleton that manages active provider
   - Provider switching logic
   - Fallback handling

5. Create src/contexts/StorageContext.tsx:
   ```typescript
   export const StorageContext = createContext<{
     currentProvider: IStorageProvider | null;
     providers: StorageProvider[];
     connectProvider: (name: string) => Promise<void>;
     switchProvider: (name: string) => void;
     uploadFile: (file: File) => Promise<FileReference>;
   }>({...});
   ```

6. Add to src/App.tsx:
   - Wrap app with StorageProvider
   - Keep all other existing providers
```

### 📌 Prompt #4: Database Schema Updates
```
Create Supabase migration for BYOS support while preserving existing data:

1. Create supabase/migrations/[timestamp]_add_byos_support.sql:
   ```sql
   -- Storage provider connections
   CREATE TABLE IF NOT EXISTS user_storage_providers (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     provider TEXT NOT NULL,
     encrypted_access_token TEXT,
     encrypted_refresh_token TEXT,
     token_expiry TIMESTAMPTZ,
     provider_email TEXT,
     storage_quota BIGINT,
     storage_used BIGINT,
     is_active BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(user_id, provider)
   );

   -- Add provider info to tracks table
   ALTER TABLE tracks 
   ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'supabase',
   ADD COLUMN IF NOT EXISTS provider_file_id TEXT,
   ADD COLUMN IF NOT EXISTS provider_url TEXT;

   -- Create RLS policies
   ALTER TABLE user_storage_providers ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can view own storage providers" 
   ON user_storage_providers FOR SELECT 
   USING (auth.uid() = user_id);
   
   CREATE POLICY "Users can insert own storage providers" 
   ON user_storage_providers FOR INSERT 
   WITH CHECK (auth.uid() = user_id);
   
   CREATE POLICY "Users can update own storage providers" 
   ON user_storage_providers FOR UPDATE 
   USING (auth.uid() = user_id);
   ```

2. Create src/hooks/useStorageProviders.ts:
   - Fetch user's connected providers
   - Add/remove provider connections
   - Update active provider

3. Update src/lib/supabase.ts if needed for new table types
```

### 📌 Prompt #5: Google OAuth Implementation
```
Implement Google Drive OAuth using existing auth patterns:

1. Create src/components/Storage/ProviderCard.tsx:
   - Match existing card styling from app
   - Use existing button components
   - Show provider logo, name, connection status
   - Connect/disconnect buttons

2. Create src/components/Storage/GoogleConnectButton.tsx:
   ```typescript
   import { useGoogleLogin } from '@react-oauth/google';
   
   // Style to match existing buttons in the app
   // Use existing theme colors and hover states
   ```

3. Create src/pages/StorageSettings.tsx:
   - Use existing page layout structure
   - Match settings page styling if one exists
   - Grid of provider cards
   - Current storage usage display

4. Create Supabase Edge Function supabase/functions/google-oauth/index.ts:
   ```typescript
   import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
   
   serve(async (req) => {
     // Handle OAuth token exchange
     // Store encrypted tokens in database
     // Return success to frontend
   })
   ```

5. Add routes in src/App.tsx:
   ```typescript
   <Route path="/settings/storage" element={<StorageSettings />} />
   <Route path="/auth/callback" element={<AuthCallback />} />
   ```

6. Add storage settings link to existing sidebar/navigation
```

### 📌 Prompt #6: Update Upload Component
```
Modify the upload flow to support provider selection while keeping existing UI:

1. Update src/components/Upload/UploadModal.tsx:
   - Add provider selector dropdown at the top
   - Use existing dropdown component styling
   - Show selected provider's quota
   - Keep all existing upload UI elements
   - Only change the upload destination logic

2. Modify upload function to use StorageContext:
   ```typescript
   const { uploadFile, currentProvider } = useStorage();
   
   if (!currentProvider) {
     toast.error('Please connect a storage provider first');
     return;
   }
   
   const fileRef = await uploadFile(file);
   // Save fileRef to database with track metadata
   ```

3. Add provider indicator to file preview

4. Update progress tracking to work with provider uploads

5. Keep existing drag-and-drop functionality
```

### 📌 Prompt #7: Update Audio Player
```
Modify audio player to stream from providers while keeping existing UI:

1. Update src/components/Audio/AudioPlayer.tsx:
   ```typescript
   // Add provider URL resolution
   const getAudioUrl = async (track: Track) => {
     if (track.storage_provider === 'supabase') {
       // Existing Supabase logic
       return supabase.storage.from('audio').getPublicUrl(track.file_path);
     } else {
       // Get URL from provider
       const provider = getProvider(track.storage_provider);
       return await provider.getStreamUrl(track.provider_file_id);
     }
   };
   ```

2. Add provider icon next to track name (small, subtle)

3. Handle provider disconnection gracefully:
   - Show "Reconnect provider" message
   - Disable playback with clear message
   - Keep showing track metadata

4. Keep ALL existing player UI and controls exactly the same

5. Add caching for provider URLs (they expire)
```

### 📌 Prompt #8: Migration Tool for Existing Users
```
Create a migration wizard for the handful of test users:

1. Create src/components/Storage/MigrationWizard.tsx:
   - Use existing modal component style
   - Step 1: Connect a storage provider
   - Step 2: Select tracks to migrate
   - Step 3: Show progress
   - Step 4: Cleanup old files (optional)

2. Simple migration logic:
   ```typescript
   const migrateTrack = async (track: Track) => {
     // Download from Supabase
     const blob = await downloadFromSupabase(track.file_path);
     
     // Upload to provider
     const fileRef = await currentProvider.uploadFile(
       new File([blob], track.file_name),
       `music/${track.file_name}`
     );
     
     // Update database
     await supabase.from('tracks').update({
       storage_provider: currentProvider.name,
       provider_file_id: fileRef.providerId,
       provider_url: fileRef.url
     }).eq('id', track.id);
   };
   ```

3. Add migration button to settings page

4. Show migration status in track list
```

### 📌 Prompt #9: Testing Setup
```
Create a simple testing setup:

1. Create src/services/storage/providers/MockProvider.ts:
   ```typescript
   export class MockProvider implements IStorageProvider {
     async connect() {
       console.log('Mock provider connected');
     }
     
     async uploadFile(file: File) {
       // Simulate upload delay
       await new Promise(r => setTimeout(r, 1000));
       return {
         id: 'mock-' + Date.now(),
         provider: 'mock',
         providerId: 'mock-file-id',
         fileName: file.name,
         fileSize: file.size,
         mimeType: file.type,
         url: URL.createObjectURL(file)
       };
     }
   }
   ```

2. Add development mode toggle in .env:
   ```
   VITE_USE_MOCK_PROVIDER=true
   ```

3. Create test checklist in TESTING.md:
   - [ ] Connect Google Drive
   - [ ] Upload a file
   - [ ] Play uploaded file
   - [ ] Disconnect and reconnect
   - [ ] Upload with no provider connected
   - [ ] Migration from Supabase storage

4. Add npm scripts:
   ```json
   "dev:mock": "VITE_USE_MOCK_PROVIDER=true npm run dev",
   "dev:prod": "VITE_USE_MOCK_PROVIDER=false npm run dev"
   ```
```

### 📌 Prompt #10: Quick MVP Launch
```
Create the minimal viable BYOS version:

1. Create src/config/features.ts:
   ```typescript
   export const FEATURES = {
     GOOGLE_DRIVE: true,
     DROPBOX: false, // Phase 2
     ONEDRIVE: false, // Phase 2
     MIGRATION_WIZARD: false, // Phase 2
     MULTI_PROVIDER: false, // Phase 3
   };
   ```

2. Simplify src/pages/Welcome.tsx for BYOS onboarding:
   - Step 1: Explain BYOS benefits (your storage, your control)
   - Step 2: Connect Google Drive (only option for now)
   - Step 3: Upload first track
   - Step 4: Success! Go to library

3. Update src/components/Layout/Sidebar.tsx:
   - Add storage indicator (green dot if connected)
   - Quick storage stats (X GB used)
   - Link to storage settings

4. Create simple error boundary:
   ```typescript
   if (!storageConnected) {
     return <ConnectStoragePrompt />;
   }
   ```

5. Deploy checklist:
   - [ ] Set up Google Cloud Console OAuth
   - [ ] Add production redirect URI
   - [ ] Deploy to new Netlify site (coretet-byos.netlify.app)
   - [ ] Test with one real user
```

---

## 🎯 Execution Order

### Week 1: Core Setup (8 hours)
1. **Prompt #0** - Understand existing styles (30 min)
2. **Prompt #1** - Initial setup (30 min)
3. **Prompt #2** - Remove storage deps (1 hour)
4. **Prompt #3** - Provider architecture (2 hours)
5. **Prompt #4** - Database migration (1 hour)
6. **Prompt #9** - Mock provider testing (1 hour)
7. Test everything works with mock provider (2 hours)

### Week 2: Google Drive Integration (8 hours)
1. **Prompt #5** - Google OAuth (3 hours)
2. **Prompt #6** - Update upload (2 hours)
3. **Prompt #7** - Update player (2 hours)
4. **Prompt #10** - MVP simplification (1 hour)

### Week 3: Polish & Launch (4 hours)
1. **Prompt #8** - Migration tool (2 hours if needed)
2. Testing with real Google account (1 hour)
3. Deploy to production (1 hour)

---

## 🔧 Google Cloud Console Setup

### Before Starting Development

1. Go to https://console.cloud.google.com
2. Create new project: "CoreTet BYOS"
3. Enable Google Drive API:
   - APIs & Services → Library
   - Search "Google Drive API"
   - Click Enable

4. Create OAuth Credentials:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: Web application
   - Name: "CoreTet BYOS Development"
   - Authorized JavaScript origins:
     - http://localhost:5173
     - http://localhost:3000
   - Authorized redirect URIs:
     - http://localhost:5173/auth/callback
   - Save and copy Client ID

5. Configure OAuth Consent Screen:
   - Choose "External" user type
   - App name: "CoreTet BYOS"
   - Support email: your email
   - Scopes: 
     - `drive.file` (only files created by app)
     - `drive.appdata` (app-specific storage)
   - Test users: Add your Gmail

---

## 🚢 Deployment Instructions

### Netlify Deployment

1. Create new Netlify site:
   ```bash
   # Install Netlify CLI if needed
   npm install -g netlify-cli
   
   # Login to Netlify
   netlify login
   
   # Initialize new site
   netlify init
   # Choose "Create & configure a new site"
   # Name: coretet-byos
   ```

2. Set environment variables in Netlify:
   - Go to Site settings → Environment variables
   - Add all variables from .env.example
   - Use production Google OAuth client ID

3. Update Google OAuth for production:
   - Add https://coretet-byos.netlify.app to authorized origins
   - Add https://coretet-byos.netlify.app/auth/callback to redirect URIs

4. Deploy:
   ```bash
   npm run build
   netlify deploy --prod
   ```

---

## 📊 Success Metrics

### MVP Success Criteria
- [ ] 5 test users successfully connect Google Drive
- [ ] 50+ tracks uploaded via BYOS
- [ ] Zero data loss incidents
- [ ] Audio streaming works reliably
- [ ] Upload success rate > 95%

### Performance Targets
- Google Drive connection: < 3 seconds
- File upload: Same speed as direct upload
- Stream start time: < 2 seconds
- Provider switching: < 1 second

---

## 🐛 Common Issues & Solutions

### Issue: Google OAuth not working locally
```bash
# Make sure redirect URI matches exactly
VITE_REDIRECT_URI=http://localhost:5173/auth/callback  # No trailing slash!
```

### Issue: CORS errors with Google Drive
```javascript
// Add to provider implementation
const response = await fetch(url, {
  mode: 'cors',
  credentials: 'omit',  // Don't send cookies
});
```

### Issue: Supabase auth conflicts with OAuth
```javascript
// Keep auth separate
const { user } = useAuth();  // Supabase auth
const { provider } = useStorage();  // Storage provider auth
```

---

## 📚 Resources

- [Google Drive API Docs](https://developers.google.com/drive/api/v3/reference)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [React OAuth Google](https://www.npmjs.com/package/@react-oauth/google)

---

## 💡 Quick Tips

1. **Start with mock provider** - Don't wait for OAuth setup
2. **Test with small files first** - Under 5MB
3. **Use Chrome DevTools** - Network tab for API debugging
4. **Keep existing UI** - Only change what's necessary
5. **Feature flag everything** - Easy rollback if needed

---

*Last Updated: August 2025*
*Version: 1.0.0*