# Supabase Setup for CoreTet BYOS

## Create New Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New project"
3. **Organization**: Select your existing organization
4. **Name**: `coretet-byos`
5. **Database Password**: Generate strong password (save it!)
6. **Region**: Same as your current CoreTet project for consistency
7. **Pricing Plan**: Free tier (can upgrade later)

## Get Project Credentials

After project is created:

1. Go to **Settings** → **API**
2. Copy these values to update your `.env` file:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon Key**: `eyJ...` (public anonymous key)

## Update Environment Variables

Replace in your `.env` file:
```env
VITE_SUPABASE_URL=https://your-new-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key
```

## Initial Database Setup

Once credentials are updated, we'll run:

1. **Copy V1 Schema**: Import essential tables from your existing CoreTet
2. **Add BYOS Tables**: Create storage provider tables
3. **Set Up Auth**: Configure authentication settings
4. **Create Policies**: Set up Row Level Security

## Storage Buckets

We'll create these buckets:
- `audio-files` (for migration/backup purposes)
- `feedback-attachments` (for user feedback)

## Next Steps

1. Complete Supabase project creation
2. Update `.env` with new credentials  
3. Run `npm run dev` to test connection
4. Proceed with database schema setup

---

**Important**: Keep your existing CoreTet Supabase project untouched. This new project is completely separate for BYOS development.