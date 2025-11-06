# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LookGen** is a cross-platform social media application built with React Native Web that enables users to:
1. Upload identity photos
2. Apply AI-powered transformations (5 types: better-looking, Japanese style, more male, more female, fair skin)
3. Choose from style templates
4. Create multi-photo carousel posts
5. Browse social feeds with likes and comments
6. View user profiles with statistics

The application supports web, iOS, and Android through a single codebase using React Native Web.

## Quick Commands

### Development
```bash
npm install              # Install dependencies
npm run dev              # Start dev server (http://localhost:5173)
npm run build            # Build for production
npm run lint             # Run ESLint
npm run preview          # Preview production build locally
npm run clear-cache      # Clear cached transformation results
```

### Supabase
```bash
supabase start           # Start local Supabase instance
supabase functions deploy batch-transform    # Deploy edge function
supabase functions deploy transform-image    # Deploy edge function
supabase db push         # Push migrations to project
```

## Architecture Overview

### Technology Stack
- **Frontend Framework**: React 19 + React Native Web 0.21 (not traditional HTML/React)
- **State Management**: Zustand 5.0 (lightweight, localStorage-compatible)
- **Backend**: Supabase (database, storage, edge functions, authentication)
- **AI Service**: FAL API (image transformations)
- **Build Tool**: Vite 7.1
- **Deployment**: Vercel

### Key Design Principle: React Native Web
This is NOT a traditional React web app. Code uses React Native components (`View`, `Text`, `TouchableOpacity`, `StyleSheet`) instead of HTML DOM elements. This enables:
- Same codebase for web, iOS, and Android
- Mobile-first design by default
- Platform.select() for platform-specific code
- React Native StyleSheet API instead of CSS classes

**Important**: When making UI changes, use React Native components, not HTML elements.

### Project Structure
```
src/
├── pages/                    # Main application views (7 pages)
│   ├── Landing.jsx          # Entry page with background video
│   ├── IdentityUpload.jsx    # Photo upload (identity)
│   ├── EditLook.jsx          # Transformation type selection
│   ├── Templates.jsx         # Style template selection
│   ├── CreatePost.jsx        # Multi-photo carousel creation
│   ├── Feed.jsx              # Social feed with likes/comments
│   ├── Profile.jsx           # User profile with stats
│   └── ConfigAdmin.jsx       # Admin configuration interface
│
├── services/
│   ├── supabaseClient.js     # Supabase client initialization
│   ├── supabaseApi.js        # Supabase edge function calls (transformImage, batchTransform)
│   ├── falApi.js             # FAL API for image transformations (fallback/local)
│   ├── configService.js      # Configuration management
│   ├── cacheService.js       # Cache system for demo mode
│   ├── settingsService.js    # Global settings (cache mode toggles)
│   └── api.js                # Legacy API placeholder
│
├── stores/
│   └── appStore.js           # Global Zustand state (identity, transformations, posts, cache mode)
│
├── utils/
│   ├── configLoader.js       # Load prompts/templates from JSON or Supabase
│   └── mobileStyles.js       # Shared mobile style utilities
│
├── config/
│   ├── style_templates.json  # Template definitions and metadata
│   └── transformation_prompts.json  # Transformation type prompts
│
├── components/
│   ├── LiquidGlass.jsx       # Glass-morphism effect component
│   └── MobileFrameWrapper.jsx  # Desktop mobile frame display (dev only)
│
├── App.jsx                   # Root component with routing
├── main.jsx                  # React entry point
└── index.css                 # Global styles with iOS optimizations

supabase/
├── config.toml              # Local dev configuration
├── migrations/
│   ├── 20251106011710_create_videos_bucket.sql  # Videos storage bucket
│   ├── 20251106091000_update_identity_photos_allow_videos.sql
│   └── (initial schema)
└── functions/
    ├── transform-image/     # Single image transformation edge function
    └── batch-transform/     # Batch transformation edge function

public/
├── videos/                  # Video assets (landing-background.mp4)
├── fonts/                   # Custom fonts
├── admin.html              # Standalone admin panel
└── manifest.json           # PWA manifest
```

## Data Flow

```
User Input (Photo)
  ↓
Zustand Store (appStore.js)
  ↓
Supabase Storage (photos bucket)
  ↓
Supabase Edge Function (transform-image)
  ↓
FAL API (image transformation)
  ↓
Result saved to Supabase
  ↓
Display in UI / Store in Zustand
  ↓
Create Post → Supabase Database
  ↓
Feed shows posts
```

## Global State Management (appStore.js)

Key store properties:
- `identityPhoto` - User's uploaded photo
- `selectedTransformation` - Chosen transformation type (e.g., 'better_looking')
- `selectedTemplate` - Style template ID ('T1'-'T5')
- `generatedPhotos` - Array of AI-transformed results
- `posts` - Social feed posts
- `currentUser` - User profile data
- `cacheMode` - Demo cache toggle (true = use cached results)
- `transformationPrompts` - Loaded from Supabase/JSON fallback
- `styleTemplates` - Loaded from Supabase/JSON fallback

Store methods:
- `loadConfigFromSupabase()` - Loads config from Supabase (fallback to JSON)
- `refreshConfig()` - Refresh config when admin updates it
- `setCacheMode()` - Toggle demo cache mode
- `toggleMobileFrame()` - Toggle desktop mobile frame (dev only)

## Configuration System

### Hierarchical Loading
1. Supabase config tables (prompt_configs)
2. Fallback to local JSON files (src/config/)
3. Error handling with console logs

### Config Files
- `transformation_prompts.json`: Defines the 5 transformation types with AI prompts
- `style_templates.json`: Defines the 5-10 style templates with metadata

### Admin Interface
- Path: `/admin`
- Allows editing transformations and templates
- Syncs to Supabase (if enabled)

## Cache Mode System (Demo Feature)

- Controlled by global `cacheMode` setting in appStore
- Real-time sync via Supabase subscription (settingsService.js)
- When enabled: Uses pre-generated cached images instead of calling FAL API
- Useful for demos and testing without API costs

## Video Resources

The landing page uses a background video:
- File: `public/videos/landing-background.mp4`
- Size: 31MB
- Upload to Supabase: `supabase storage cp public/videos/landing-background.mp4 gs://social-look-app/videos/landing-background.mp4 --recursive`
- Frontend reference: `src/pages/Landing.jsx` line 42 uses `/videos/landing-background.mp4`

## Important Code Patterns

### Using Zustand Store
```javascript
import useAppStore from '../stores/appStore';

const Component = () => {
  const identityPhoto = useAppStore((state) => state.identityPhoto);
  const setIdentityPhoto = useAppStore((state) => state.setIdentityPhoto);

  return (...);
};
```

### React Native Web Components (DO NOT use HTML)
```javascript
// ✅ Correct
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const MyComponent = () => (
  <View style={styles.container}>
    <Text style={styles.title}>Hello</Text>
    <TouchableOpacity style={styles.button}>
      <Text>Click me</Text>
    </TouchableOpacity>
  </View>
);

// ❌ Wrong - don't do this
const MyComponent = () => (
  <div className="container">
    <h1>Hello</h1>
    <button>Click me</button>
  </div>
);
```

### Platform-Specific Code
```javascript
import { Platform, StyleSheet } from 'react-native';

// In styles
const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      web: { minHeight: '100vh' },
      ios: { marginTop: 20 },
      default: {},
    }),
  },
});

// In component logic
if (Platform.OS === 'web') {
  // Web-specific code
}
```

### Mobile-First Responsive Design
- Use flexbox for layouts
- Minimum touch targets: 44x44px
- Safe area support via Platform.select()
- Test at multiple viewport sizes

## Environment Variables

Required in `.env`:
```
VITE_FAL_API_KEY=your_fal_api_key
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Common Development Tasks

### Adding a New Transformation Type
1. Add entry to `src/config/transformation_prompts.json`
2. Update AI prompt accordingly
3. Reload app or admin panel
4. Test on EditLook.jsx page

### Adding a New Style Template
1. Add template object to `src/config/style_templates.json`
2. Add corresponding image to assets
3. Update Templates.jsx if UI changes needed
4. Test in app flow

### Testing Supabase Integration
1. `supabase start` - Start local Supabase
2. Check migrations are applied: `supabase db show`
3. View data: `supabase functions list`
4. Deploy functions: `supabase functions deploy [function-name]`

### Building for Production
```bash
npm run build              # Creates dist/
npm run preview            # Test production build locally
```

Deploy to Vercel:
- Set environment variables in Vercel dashboard
- Push to GitHub - auto-deploys
- Access admin at: `https://your-app.vercel.app/admin`

## Debugging Tips

### Console Logging
Services use `console.log()` with prefixes:
- `[appStore]` - State management
- `[supabaseApi]` - Supabase calls
- `[falApi]` - FAL API calls
- Search these prefixes to trace data flow

### Config Loading Issues
- Check console for Supabase connection errors
- Falls back to JSON if Supabase unavailable
- Verify JSON files exist in `src/config/`

### Image Transformation Failures
- Check FAL API key in .env
- Verify Supabase edge functions deployed
- Check browser console for specific errors
- Test with valid image URL format

### State Issues
- Open browser DevTools → Application → LocalStorage
- Check `appStore` keys for state persistence
- Use React DevTools to inspect Zustand store

## Testing Strategy

The project uses:
- ESLint for code quality
- Manual testing in dev server
- Cache mode for testing without API calls

## Mobile Optimization Considerations

- iOS safe area support (notch, Home indicator)
- 100dvh viewport height for mobile browsers
- -webkit-overflow-scrolling for iOS momentum scrolling
- Touch targets minimum 44x44px (iOS guideline)
- Platform-specific font configurations
- WebKit font smoothing for crisp text

## File Size Notes

- supabaseApi.js: ~10KB (core transformation logic)
- Landing video: 31MB (lazy-loaded)

## Notes for Future Development

- Replace mock API calls in api.js if traditional REST layer needed
- Implement persistent user authentication (currently anonymous)
- Add image caching strategy for mobile
- Consider offline support with service workers (PWA)
- Optimize video delivery (current 31MB landing video should be compressed)
