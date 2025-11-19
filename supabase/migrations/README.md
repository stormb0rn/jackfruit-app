# Social Look Monorepo

Monorepo containing Character App and Admin Panel for AI virtual character interaction system.

## Projects

### Character App (`/character-app`)
AI virtual character interaction system with video-based display and modular onboarding.

### Admin Panel (`/admin-app`)
Management interface for character status system and onboarding configuration.

## Quick Start

```bash
# Install dependencies for all projects
npm install

# Start Character App
npm run dev:character

# Start Admin Panel
npm run dev:admin
```

## Project Structure

```
social-look-monorepo/
├── character-app/          # Character viewer app
├── admin-app/              # Admin management panel
├── supabase/               # Shared Supabase backend
│   ├── migrations/         # Database migrations
│   └── functions/          # Edge functions
└── package.json            # Monorepo configuration
```

## Documentation

- **Character App**: See `/character-app/README.md`
- **Admin Panel**: See `/admin-app/README.md`
- **Supabase Setup**: See project-specific documentation

## Deployment

Each app deploys independently:
- Character App: Separate Vercel project
- Admin Panel: Separate Vercel project
- Supabase: Shared backend for both apps

## License

Proprietary - All Rights Reserved
