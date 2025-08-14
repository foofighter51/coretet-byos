# CoreTet (No AI) - Setup Guide for New Computer

This guide provides comprehensive instructions for setting up the CoreTet project on a new computer.

## Prerequisites

### 1. Core Software Requirements
- **Node.js 20+** - JavaScript runtime (download from [nodejs.org](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn** - Package manager
- **Git** - Version control system (download from [git-scm.com](https://git-scm.com/))

### 2. Database & Backend Services
- **Supabase Account** - Required for authentication, database, and file storage
  - Sign up at [supabase.com](https://supabase.com)
  - Create a new project and save your credentials
- **Supabase CLI** (optional but recommended) - For database migrations
  - Install instructions at [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)

### 3. Development Environment
- **Visual Studio Code** (recommended) or your preferred code editor
  - Download from [code.visualstudio.com](https://code.visualstudio.com/)
- **TypeScript 5.5.3** - Will be installed with project dependencies
- **Vite 5.4.2** - Build tool (installed with project)
- **ESLint** - Code linting (installed with project)
- **Vitest** - Testing framework (installed with project)

## Installation Steps

### Step 1: Clone the Repository
```bash
git clone [repository-url]
cd coretet_no_ai
```

### Step 2: Install Node.js Dependencies
```bash
npm install
```

This will install all required dependencies including:
- **React 18.3.1** with TypeScript support
- **TailwindCSS** - Utility-first CSS framework
- **Supabase JS Client** - Database and auth client
- **React Router** - Client-side routing
- **UI Libraries**:
  - lucide-react - Icon library
  - @dnd-kit - Drag and drop functionality
  - react-dropzone - File upload component
  - react-window - Virtual scrolling for performance

### Step 3: Configure Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   
   # Optional: AWS configuration (for future S3 storage)
   AWS_ACCESS_KEY_ID=your-aws-access-key
   AWS_SECRET_ACCESS_KEY=your-aws-secret-key
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=coretet-audio-files
   
   # App URL
   APP_URL=http://localhost:5173
   ```

### Step 4: Set Up Database

#### Option A: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run each migration file from `supabase/migrations/` in chronological order

#### Option B: Using Supabase CLI
```bash
supabase db push
```

### Step 5: Verify Setup
```bash
npm run dev
```

The application should now be running at `http://localhost:5173`

## Recommended VS Code Extensions

Install these extensions for the best development experience:

1. **ESLint** - Integrates ESLint JavaScript linting
2. **Prettier - Code formatter** - Code formatting
3. **Tailwind CSS IntelliSense** - Autocomplete for Tailwind classes
4. **TypeScript Vue Plugin (Volar)** - Enhanced TypeScript support
5. **GitLens** - Git supercharged
6. **Error Lens** - Show errors inline

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:only` - Build without version update
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint to check code quality
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI interface
- `npm run test:coverage` - Generate test coverage report

## Project Structure

```
coretet_no_ai/
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts for state management
│   ├── lib/           # Supabase client configuration
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions
├── supabase/
│   ├── functions/     # Supabase Edge Functions
│   └── migrations/    # Database migration files
├── public/            # Static assets
├── scripts/           # Build scripts
└── Configuration files:
    ├── .env.example   # Environment variables template
    ├── eslint.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── vite.config.ts
    └── postcss.config.js
```

## Troubleshooting

### Common Issues

1. **npm install fails**
   - Ensure Node.js 20+ is installed: `node --version`
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and `package-lock.json`, then reinstall

2. **Supabase connection errors**
   - Verify your Supabase URL and anon key in `.env`
   - Check if your Supabase project is active
   - Ensure migrations have been applied

3. **Build errors**
   - Run `npm run lint` to check for linting issues
   - Check TypeScript errors with `npx tsc --noEmit`
   - Ensure all environment variables are set

4. **Port already in use**
   - The dev server runs on port 5173 by default
   - Kill the process using the port or change it in `vite.config.ts`

## Additional Notes

- **Audio File Support**: MP3, WAV, FLAC, M4A formats
- **Authentication**: Email/password with invite-only registration
- **Storage**: Currently uses Supabase Storage (AWS S3 config available but inactive)
- **Known Issues**: 2 moderate npm vulnerabilities in esbuild (doesn't affect production)

## Support

For issues and questions:
- Check the README.md for basic information
- Review TESTING_CHECKLIST.md for testing guidelines
- Create an issue in the repository
- Check Supabase documentation for database-related issues