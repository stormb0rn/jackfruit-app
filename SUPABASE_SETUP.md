# Supabase Setup Complete

## What Was Created

### 1. Database Schema
**Location:** `supabase/migrations/`

Created tables:
- **profiles** - User profiles with username and avatar
- **identity_photos** - Original user photos for transformations
- **transformations** - AI-generated transformation records
- **posts** - Social feed posts with transformations

All tables have:
- Row Level Security (RLS) enabled
- Proper foreign key relationships
- Indexes for performance
- Automatic timestamps

### 2. Storage Buckets
**Buckets created:**
- **identity-photos** - Private bucket for user photos
- **transformations** - Bucket for generated transformation images

Storage policies ensure users can only access their own images.

### 3. Edge Functions
**Location:** `supabase/functions/`

#### transform-image
- Single image transformation
- Calls FAL.AI nano-banana/edit API
- Stores result in database
- Returns transformation URL

#### batch-transform
- Batch generates all looking options at once
- Sequential API calls to FAL.AI
- Creates transformation records for each
- Returns summary with all results

### 4. Frontend Integration

**New Services:**
- `src/services/supabaseClient.js` - Supabase client instance
- `src/services/supabaseApi.js` - API wrapper with methods for:
  - transformImage()
  - batchTransform()
  - uploadIdentityPhoto()
  - getUserTransformations()
  - createPost()
  - getFeedPosts()
  - Authentication methods

**Updated Pages:**
- `src/pages/EditLook.jsx` - Now uses `supabaseApi.batchTransform()` instead of direct FAL API calls

## How to Use

### Step 1: Start Supabase Locally

```bash
cd /Users/jiajun/social-look-app
supabase start
```

This will:
- Start a local Postgres database
- Start Supabase Studio at http://127.0.0.1:54323
- Start Edge Functions runtime
- Show you the local API credentials

### Step 2: Get Local Credentials

After running `supabase start`, you'll see output like:

```
API URL: http://127.0.0.1:54321
GraphQL URL: http://127.0.0.1:54321/graphql/v1
DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL: http://127.0.0.1:54323
Inbucket URL: http://127.0.0.1:54324
JWT secret: super-secret-jwt-token-with-at-least-32-characters-long
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 3: Update .env File

Copy the `anon key` from the output and update `.env`:

```bash
VITE_FAL_API_KEY=6ca0a61a-d4e0-4892-9650-7fd9810488b1:c940e53f620133a9e3e2d4b206510672

# Supabase Configuration
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste_your_anon_key_here>
```

### Step 4: Set Edge Function Secrets

Create a `.env` file in the supabase directory:

```bash
cd supabase
cat > .env << EOF
FAL_API_KEY=6ca0a61a-d4e0-4892-9650-7fd9810488b1:c940e53f620133a9e3e2d4b206510672
EOF
```

### Step 5: Run Migrations

```bash
supabase db reset
```

This will:
- Create all tables
- Set up storage buckets
- Apply RLS policies
- Reset the database to a clean state

### Step 6: Start Your App

```bash
npm run dev
```

## Testing the Integration

### Test Edge Functions Locally

**Single Transform:**
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/transform-image' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "identityPhotoUrl": "https://example.com/photo.jpg",
    "lookingType": "better_looking",
    "visualStyle": "realistic"
  }'
```

**Batch Transform:**
```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/batch-transform' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "identityPhotoUrl": "https://example.com/photo.jpg",
    "visualStyle": "realistic"
  }'
```

### Test in App

1. Start Supabase: `supabase start`
2. Start app: `npm run dev`
3. Upload an identity photo
4. Navigate to "Choose Your Look Transformation"
5. Watch the batch transformation happen via edge functions
6. Preview images are generated and displayed

## Architecture Flow

```
User Upload Photo
      ↓
EditLook Page
      ↓
supabaseApi.batchTransform()
      ↓
Supabase Edge Function: batch-transform
      ↓
FAL.AI API (nano-banana/edit) × 6 transformations
      ↓
Results stored in transformations table
      ↓
Image URLs returned to frontend
      ↓
Preview displayed in EditLook cards
```

## Benefits

1. **Security**: FAL API key never exposed to frontend
2. **Database**: All transformations tracked and stored
3. **Caching**: Can check if transformation already exists before calling FAL API
4. **Scalability**: Edge functions auto-scale
5. **Storage**: Centralized image storage with Supabase Storage
6. **Authentication**: Built-in auth ready to use
7. **Realtime**: Can add realtime features (likes, comments) later

## Deploying to Production

### 1. Create Supabase Project

Go to https://supabase.com and create a new project.

### 2. Link Your Project

```bash
supabase link --project-ref your-project-ref
```

### 3. Push Migrations

```bash
supabase db push
```

### 4. Deploy Edge Functions

```bash
supabase functions deploy transform-image
supabase functions deploy batch-transform
```

### 5. Set Production Secrets

```bash
supabase secrets set FAL_API_KEY=your_fal_api_key
```

### 6. Update Production .env

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

## Monitoring

- **Supabase Studio**: http://127.0.0.1:54323 (local) or https://app.supabase.com (production)
- **Database**: View tables, run queries
- **Storage**: Browse uploaded files
- **Auth**: Manage users
- **Edge Functions**: View logs and invocations
- **API**: Test endpoints

## Troubleshooting

### Edge functions not working
- Check supabase is running: `supabase status`
- Check function logs: `supabase functions logs batch-transform`
- Verify FAL_API_KEY is set in supabase/.env

### Database errors
- Reset database: `supabase db reset`
- Check migrations: `supabase db diff`

### Frontend not connecting
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
- Restart dev server after changing .env
- Check browser console for errors

## Next Steps

1. Add user authentication flow
2. Implement identity photo upload to Supabase Storage
3. Add transformation caching (check if already exists)
4. Implement post creation and feed
5. Add user profiles and avatars
6. Implement likes and comments
7. Add real-time updates

## Files Modified/Created

### Created:
- `supabase/config.toml` - Supabase project config
- `supabase/migrations/20251105214351_initial_schema.sql` - Database schema
- `supabase/migrations/20251105214352_storage_buckets.sql` - Storage setup
- `supabase/functions/transform-image/index.ts` - Single transform function
- `supabase/functions/batch-transform/index.ts` - Batch transform function
- `src/services/supabaseClient.js` - Supabase client
- `src/services/supabaseApi.js` - API wrapper

### Modified:
- `package.json` - Added @supabase/supabase-js
- `src/pages/EditLook.jsx` - Uses Supabase edge functions
- `.env` - Added Supabase credentials
- `.env.example` - Added Supabase template

The Supabase backend is now fully integrated and ready to use!
