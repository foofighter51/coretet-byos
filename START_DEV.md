# Starting CoreTet Development Server

## Quick Start (Recommended - Use Terminal)

Open a terminal in the project directory and run:

```bash
# Make sure you're in the correct directory
cd /Users/exleymini/Apps/coretet_no_ai

# Install dependencies if needed
npm install

# Start the development server
npm run dev
```

The app should start on http://localhost:5173/

## Troubleshooting

### If you get "Invalid URL" error:

1. **Check environment variables are set:**
```bash
cat .env | grep VITE_
```

You should see:
- VITE_SUPABASE_URL=https://...
- VITE_SUPABASE_ANON_KEY=eyJ...

2. **If .env file is missing or incorrect:**
```bash
# Copy from example
cp .env.example .env
# Then edit .env with your Supabase credentials
```

3. **Clear any cached builds:**
```bash
rm -rf node_modules/.vite
rm -rf dist
npm install
```

### If port 5173 is in use:

```bash
# Kill any existing vite processes
pkill -f vite

# Or run on a different port
npm run dev -- --port 3000
```

### For production build testing:

```bash
# Build the app
npm run build

# Serve the built files
npm run preview
```

## Environment Variables Required

The app needs these in your `.env` file:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## VS Code Integration Issues

If you're having issues with Claude Code in VS Code running builds:

1. **Use Terminal Instead**: Open a separate terminal window and run commands there
2. **Check for multiple Node processes**: Sometimes VS Code spawns multiple processes
3. **Restart VS Code**: If builds are failing consistently

## Verify Everything is Working

Once running, you should:
1. See "VITE v5.x.x ready" in terminal
2. Be able to access http://localhost:5173/
3. See the CoreTet login page
4. Check browser console for any errors (F12)

## Database Migration for Custom Ratings

After the app is running, don't forget to run the custom rating system migration in Supabase:
1. Go to Supabase Dashboard > SQL Editor
2. Run the migration from: `database/migrations/v1_custom_rating_system.sql`