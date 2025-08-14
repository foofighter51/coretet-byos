# CoreTet (No AI Version)

A simplified version of CoreTet without AI integration, focusing on manual track management and organization.

## Overview

CoreTet is a music library management system that allows users to:
- Upload audio files (MP3, WAV, FLAC, M4A)
- Manually tag and organize tracks
- Create playlists and manage metadata
- Share music within teams

## Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn
- Supabase account

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd coretet_no_ai
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run database migrations

Apply the database migrations to your Supabase project:

**Option A: Using Supabase Dashboard**
- Go to your Supabase project dashboard
- Navigate to the SQL Editor
- Run each migration file in order from `supabase/migrations/`

**Option B: Using Supabase CLI**
```bash
supabase db push
```

5. Start the development server
```bash
npm run dev
```

The app will be available at http://localhost:5173

## Features

### Authentication
- Email/password authentication
- Admin setup for first user
- Invite-only registration system

### Track Management
- Drag-and-drop file upload
- Manual metadata editing
- Tag-based organization (genre, mood, instruments)
- Search and filter functionality

### Audio Player
- Built-in audio playback
- Playlist support
- Track queue management

### Admin Features
- User management
- Invite code generation
- System statistics

## Project Structure

```
coretet_no_ai/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── lib/           # Supabase client
│   ├── types/         # TypeScript types
│   └── utils/         # Utility functions
├── supabase/
│   ├── functions/     # Edge functions
│   └── migrations/    # Database migrations
└── public/            # Static assets
```

## Known Issues

1. **npm vulnerabilities**: There are 2 moderate severity vulnerabilities in the esbuild dependency. These don't affect production builds but should be noted.

2. **AI Features Removed**: This version has all AI analysis features removed. All track metadata must be entered manually.

3. **Storage**: Currently uses Supabase storage. AWS S3 configuration is present but not active.

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Testing

See `TESTING_CHECKLIST.md` for comprehensive testing guidelines.

## Deployment

1. Build the application
```bash
npm run build
```

2. Deploy the `dist` folder to your hosting provider

3. Set up Supabase Edge Functions (if needed)
```bash
supabase functions deploy
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

[Add your license information here]

## Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review the testing checklist for common problems