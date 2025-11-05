# Quick Start Guide - Supabase Integration

## Summary

Successfully integrated Supabase backend with database, edge functions, and storage for the Social Look App. The app now uses Supabase Edge Functions to securely call the FAL.AI API for image transformations.

## What You Have Now

✅ Supabase project initialized
✅ Database schema with tables for profiles, photos, transformations, posts
✅ Storage buckets for identity photos and transformations
✅ Edge functions to call FAL.AI API securely
✅ Frontend integrated with Supabase
✅ Batch transformation via edge functions

## Start Using It

### 1. Start Supabase

```bash
cd /Users/jiajun/social-look-app
supabase start
```

Wait for it to start (~1 minute). You'll see output like:

```
API URL: http://127.0.0.1:54321
Studio URL: http://127.0.0.1:54323
anon key: eyJhbGci...
```

### 2. Update .env with the anon key

Copy the `anon key` from the output and update `.env`:

```bash
# Open .env and replace this line:
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# With the actual key:
VITE_SUPABASE_ANON_KEY=eyJhbGci...  # paste the full key
```

### 3. Run database migrations

```bash
supabase db reset
```

This creates all tables and sets up storage.

### 4. Start your app

```bash
npm run dev
```

### 5. Test it

1. Open http://localhost:5173
2. Upload an identity photo
3. Click "Choose Your Look Transformation"
4. Watch the transformations generate automatically
5. See preview images appear one by one

## How It Works

OLD WAY (Direct FAL API):
```
Frontend → FAL.AI API (exposed key) → Response
```

NEW WAY (Supabase Edge Functions):
```
Frontend → Supabase Edge Function → FAL.AI API (hidden key) → Database → Response
```

Benefits:
- API key is secure (not exposed to frontend)
- All transformations are saved in database
- Can add caching, authentication, etc.

## View Your Data

Open Supabase Studio: http://127.0.0.1:54323

- **Table Editor**: See transformations table
- **Storage**: View uploaded images
- **SQL Editor**: Run custom queries
- **Edge Functions**: View function logs

## Edge Functions

### batch-transform
- Generates ALL 6 looking options at once
- Uses realistic style by default
- Called automatically when EditLook page loads
- Endpoint: `http://127.0.0.1:54321/functions/v1/batch-transform`

### transform-image
- Generates a single transformation
- Can specify any looking type + visual style
- Endpoint: `http://127.0.0.1:54321/functions/v1/transform-image`

## Troubleshooting

**Supabase not starting?**
```bash
supabase stop
supabase start
```

**Frontend can't connect?**
- Check .env has correct VITE_SUPABASE_ANON_KEY
- Restart dev server: `npm run dev`

**Edge function errors?**
```bash
# View function logs
supabase functions logs batch-transform

# Check FAL API key is set
cat supabase/.env
```

**Database errors?**
```bash
# Reset everything
supabase db reset
```

## Files Created

### Backend (Supabase):
- `supabase/migrations/` - Database schema
- `supabase/functions/transform-image/` - Single transform function
- `supabase/functions/batch-transform/` - Batch transform function
- `supabase/.env` - FAL API key for edge functions

### Frontend:
- `src/services/supabaseClient.js` - Supabase client
- `src/services/supabaseApi.js` - API wrapper methods
- Updated `src/pages/EditLook.jsx` - Uses edge functions

### Config:
- `.env` - Added Supabase URL and anon key
- `package.json` - Added @supabase/supabase-js

## Next Steps

### Now You Can:
1. Add user authentication (sign up/sign in)
2. Upload photos to Supabase Storage
3. Save transformations to database
4. Create posts with transformations
5. Build a social feed
6. Add likes and comments

### To Deploy to Production:
1. Create a Supabase project at https://supabase.com
2. Link your project: `supabase link --project-ref your-ref`
3. Push migrations: `supabase db push`
4. Deploy functions: `supabase functions deploy batch-transform`
5. Set secrets: `supabase secrets set FAL_API_KEY=your_key`
6. Update production .env with production Supabase URL and anon key

## Documentation

- Full setup details: `SUPABASE_SETUP.md`
- Implementation summary: `IMPLEMENTATION_SUMMARY.md`
- Transformation config: `README_TRANSFORMATION.md`
- EditLook update: `EDITLOOK_UPDATE.md`

## Commands Reference

```bash
# Start Supabase
supabase start

# Stop Supabase
supabase stop

# Reset database (recreate tables)
supabase db reset

# View function logs
supabase functions logs batch-transform

# Check status
supabase status

# Open Studio
open http://127.0.0.1:54323

# Deploy function (production)
supabase functions deploy batch-transform
```

## Test Edge Functions Directly

```bash
# Get your anon key
supabase status | grep "anon key"

# Test batch-transform
curl -i --location --request POST \
  'http://127.0.0.1:54321/functions/v1/batch-transform' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "identityPhotoUrl": "https://example.com/photo.jpg",
    "visualStyle": "realistic"
  }'
```

## Support

If you encounter issues:
1. Check `SUPABASE_SETUP.md` for detailed troubleshooting
2. View logs: `supabase functions logs batch-transform`
3. Check Studio for database errors: http://127.0.0.1:54323
4. Verify .env has all required variables

---

Everything is set up and ready to use! Start with `supabase start`, then `npm run dev`.
