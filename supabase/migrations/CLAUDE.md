# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **monorepo** containing two applications:

### 1. Character App (`/character-app`)
AI virtual character interaction system:
- View AI characters with dynamic moods/health/statuses
- Video-based character display with smooth clip transitions
- **Onboarding System**: Modular 7-step user identity creation flow (configurable via database)
- Real-time status changes based on mood selection
- Mobile-first TikTok-style vertical video UI
- Framer Motion animations for overlays
- Built with React (traditional web app, not React Native Web)

### 2. Admin Panel (`/admin-app`)
Management interface for Character Status system:
- Create and manage AI characters
- Configure character statuses (mood, health, actions)
- **Onboarding Configuration**: Visual editor for onboarding flows (steps, visual themes, copy)
- 3-step AI content generation workflow (Gemini → FAL SeeDrawm → FAL SeeDance)
- Asset library management (clothing, locations, props)
- System prompt configuration
- Drag-and-drop video playlist ordering
- Built with React + Ant Design

## Quick Commands

### Character App
```bash
cd character-app
npm install
npm run dev              # Runs on configured port
npm run build
```

### Admin Panel
```bash
cd admin-app
npm install
npm run dev              # Runs on different port
npm run build
```

### Supabase (Shared Backend)
```bash
supabase start                          # Start local Supabase
supabase db push                        # Push migrations to remote
supabase functions deploy <name>        # Deploy specific edge function
supabase functions list                 # List all edge functions

# Edge functions for Character system:
# - generate-text-content: Gemini text generation
# - generate-starting-image: FAL SeeDrawm image generation
# - generate-single-video: FAL SeeDance video generation
# - batch-image-generation: Batch image processing
# - voice-chat: Voice chat functionality
```

## Project Structure

```
social-look-monorepo/
├── character-app/ (AI Character Viewer)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Onboarding/          # Modular 7-step onboarding system
│   │   │   ├── CharacterList.jsx    # Character selection screen
│   │   │   └── CharacterView.jsx    # Main character interaction view
│   │   ├── components/character/
│   │   ├── hooks/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── admin-app/ (Character Admin Panel)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── onboarding/          # Onboarding config management
│   │   │   ├── CharacterManagement.jsx
│   │   │   ├── StatusManagement.jsx
│   │   │   └── AssetManagement.jsx
│   │   ├── components/
│   │   └── services/
│   ├── package.json
│   └── vite.config.js
│
├── supabase/ (Shared backend)
│   ├── migrations/
│   │   ├── 20251112_character_status_system.sql
│   │   ├── 20251118000000_create_onboarding_system.sql
│   │   └── ...
│   └── functions/
│       ├── generate-text-content/
│       ├── generate-starting-image/
│       ├── generate-single-video/
│       ├── batch-image-generation/
│       └── voice-chat/
│
└── package.json (Monorepo configuration)
```

## Technology Stack

**Character App:**
- React 19 (traditional web app with HTML elements)
- Framer Motion 12 (animations)
- Vite 7.1 build tool
- No state management library (uses React hooks)
- Video playback with smooth transitions

**Admin Panel:**
- React 19 (traditional web app)
- Ant Design 5.28 (UI components)
- @dnd-kit (drag-and-drop for video ordering)
- React Router DOM 7.9

**Shared Backend:**
- Supabase (PostgreSQL, Storage, Edge Functions)
- AI APIs: FAL (image/video generation), Google Gemini (text generation)
- Storage buckets: videos, character-assets, onboarding-resources

## Environment Variables

Both apps share the same environment variable structure:

```env
# FAL API (image/video generation)
VITE_FAL_API_KEY=your_fal_api_key

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini (text generation)
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## Database Schema (Supabase)

### Character System Tables
- `ai_characters` - Character profiles (name, avatar, description)
- `character_statuses` - Character states with mood/health/actions
- `character_assets` - Asset library (clothing, locations, props)
- `system_prompts` - AI prompts for text/image/video generation
- `onboarding_configs` - Onboarding flow configurations
- `onboarding_sessions` - User onboarding progress tracking

### Storage Buckets
- `videos` - Generated video clips
- `character-assets` - Asset library files
- `onboarding-resources` - Onboarding media (background videos, images, audio)

## Deployment

### Vercel (Separate Projects)

Each app deploys to a separate Vercel project:

**Character App:**
```bash
cd character-app
vercel --prod
# URL: https://character-app.vercel.app
```

**Admin Panel:**
```bash
cd admin-app
vercel --prod
# URL: https://admin-panel.vercel.app
```

Set environment variables in each Vercel project dashboard separately.

### Supabase Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy generate-single-video

# View function logs
supabase functions logs generate-single-video --tail
```

## Key Architecture Decisions

### Why Monorepo?
- Shared Supabase backend across both apps
- Reusable migration scripts and edge functions
- Consistent environment variable management
- Independent deployment for each frontend

### Character System: 3-Step Generation
- **Step 1 (Text):** Gemini generates scene descriptions, overlay text, suggestions
- **Step 2 (Image):** FAL SeeDrawm generates starting image from assets + mood
- **Step 3 (Video):** FAL SeeDance converts image + scene prompts → video clips
- Each step saves results to `character_statuses` table before proceeding
- Allows resuming if any step fails

### Onboarding System: JSONB-Based Configuration
- **Database-driven**: All step configs stored in `onboarding_configs` table as JSONB
- **Modular**: Steps 2-6 are optional; admin enables/disables via null/non-null JSONB
- **Multi-theme support**: Single codebase serves different visual themes
- **No hardcoded flows**: Step routing determined by config presence
- **Session tracking**: `onboarding_sessions` allows resuming incomplete flows

## Development Notes

- Character App and Admin Panel each have their own `package.json` and dependencies
- Both apps use traditional React (HTML elements), not React Native Web
- Supabase is shared between both apps
- Edge functions are deployed once and used by both apps
- Each app has independent deployment pipeline

For detailed information about each app, see their respective README files.
