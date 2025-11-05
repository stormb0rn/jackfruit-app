# LookGen - Social Appearance Transformation App

A React-based social media application that allows users to upload their identity photos, apply AI transformations to create different versions of themselves, and share these transformations with others.

## Features

### 1. Identity Upload
- Welcome page with identity-building concept
- Photo upload with preview
- User-friendly interface with feature highlights

### 2. Look Transformation
Choose from 5 transformation types:
- Enhanced Look (better-looking version)
- Japanese Style (cultural aesthetic)
- More Male (masculine features)
- More Female (feminine features)
- Fair Skin (lighter skin tone)

### 3. Style Templates
- 5 distinct style templates (T1-T5)
- Visual selection interface
- Real-time generation feedback

### 4. Multi-Photo Posts
- Instagram-style carousel posts
- Select multiple photos (identity + transformations)
- Add captions
- Post preview before sharing

### 5. Social Feed
- Scrollable timeline of posts
- Multi-photo carousel navigation
- Like and comment functionality
- Time-based post display

### 6. User Profile
- Profile overview with stats
- Grid view of user posts
- Quick access to create new posts

## Tech Stack

- **React Native Web** - Mobile-first UI framework
- React 18 with Vite
- Zustand for state management
- Placeholder REST API layer
- Supabase-ready architecture (backend integration pending)
- iOS and Android ready architecture

## Project Structure

```
src/
├── pages/           # Main application pages
│   ├── IdentityUpload.jsx
│   ├── EditLook.jsx
│   ├── Templates.jsx
│   ├── CreatePost.jsx
│   ├── Feed.jsx
│   └── Profile.jsx
├── stores/          # Zustand state management
│   └── appStore.js
├── services/        # API service layer
│   └── api.js
├── components/      # Reusable components (future)
└── utils/          # Utility functions (future)
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:5173/

### Build

```bash
npm run build
```

## User Flow

1. Upload Identity Photo → Welcome page with photo upload
2. Choose Transformation → Select transformation type (enhanced, Japanese, male/female, skin tone)
3. Select Template → Choose from T1-T5 style templates
4. Create Post → Select photos and add caption
5. View Feed → Browse posts with carousel navigation
6. Profile → View user-specific posts

## State Management

The app uses Zustand with the following state structure:

- Identity photo
- Selected transformation type
- Selected template
- Generated photos array
- Posts array
- Current user profile
- UI navigation state

## API Integration (Ready for Backend)

The app includes a placeholder API service layer in `src/services/api.js`:

- uploadIdentityPhoto()
- generateTransformation()
- createPost()
- getFeed()
- getUserProfile()
- getTemplates()

To integrate with Supabase:
1. Set up Supabase project
2. Configure storage buckets for photos
3. Create database tables for users and posts
4. Replace mock API calls with actual Supabase calls
5. Add authentication

## Design Philosophy

- Clean, simple UI (ready for custom design system)
- Mobile-first responsive design
- Smooth transitions and interactions
- Placeholder imagery for development

## Future Enhancements

- [ ] Supabase backend integration
- [ ] Real AI transformation API
- [ ] User authentication
- [ ] Comments system
- [ ] Like functionality
- [ ] Follow/unfollow users
- [ ] Search and discovery
- [ ] Notifications
- [ ] Direct messaging
- [ ] Custom design system implementation

## Notes

- Currently uses placeholder images for templates
- Mock delays simulate API calls
- All data is stored in memory (refreshing resets state)
- Ready for Supabase storage and database integration

## React Native Web

This app is built with React Native Web, providing:

- **Mobile-First Design**: All components optimized for touch and mobile interactions
- **Cross-Platform Ready**: Same codebase works on web, iOS, and Android
- **Native Components**: Uses React Native primitives (View, Text, TouchableOpacity, ScrollView, Image)
- **StyleSheet API**: Consistent styling across platforms
- **Touch Optimized**: All buttons meet 44x44px minimum touch target (iOS guidelines)
- **Responsive**: Flexbox layouts adapt to any screen size

See [REACT_NATIVE_WEB.md](./REACT_NATIVE_WEB.md) for detailed documentation.

## Mobile-First Features

- Touch-optimized interactions with visual feedback
- Smooth native scrolling with momentum
- Responsive layouts using flexbox
- Minimum 44x44px touch targets
- Mobile keyboard optimization
- iOS safe area support
- PWA ready for home screen installation

## Development Status

Frontend MVP complete with React Native Web. Backend integration pending.
Ready for iOS/Android native app development.
