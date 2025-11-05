Setup Guide for AI Character Transformation

## Prerequisites

1. Node.js and npm installed
2. FAL.AI API key (get one at https://fal.ai)

## Installation Steps

1. Install dependencies:
   npm install

2. Set up environment variables:
   - Copy .env.example to .env
   - Add your FAL API key:
     VITE_FAL_API_KEY=your_fal_api_key_here

3. Start the development server:
   npm run dev

## Configuration Management

### Method 1: React Admin Component (In-App)

1. Start the app
2. Navigate to the config-admin page by changing the URL or adding a button
3. Add/Edit/Delete looking and visual style options
4. Export configuration when done
5. Replace src/config/transformation_prompts.json with the exported file

### Method 2: Standalone HTML Admin Page

1. Open public/admin.html in your browser
2. Edit configuration directly
3. Export the JSON file
4. Replace src/config/transformation_prompts.json with the exported file
5. Restart the development server

## Testing the Transformation

1. Go to the app (http://localhost:5173 or your dev server URL)
2. Upload an identity photo
3. Click "Choose Your Look Transformation"
4. Select a looking option (e.g., Better-Looking)
5. Select a visual style template (e.g., Realistic)
6. The app will call the FAL API to transform your image

## File Structure

/social-look-app
├── src/
│   ├── config/
│   │   └── transformation_prompts.json    # Main configuration file
│   ├── services/
│   │   ├── api.js                         # Updated with FAL integration
│   │   └── falApi.js                      # FAL API client
│   ├── utils/
│   │   └── configLoader.js                # Config utility functions
│   └── pages/
│       ├── EditLook.jsx                   # Updated to use config
│       └── ConfigAdmin.jsx                # Admin component
├── public/
│   └── admin.html                         # Standalone admin page
├── .env.example                           # Environment template
└── README_TRANSFORMATION.md               # Detailed documentation

## API Usage

The FAL API is called when:
1. User selects a looking option (e.g., "Better-Looking")
2. User selects a visual style (e.g., "Realistic")
3. System combines prompts: "better-looking, enhanced features, photorealistic, realistic lighting"
4. FAL API transforms the identity photo using the combined prompt

## Troubleshooting

### Config not loading
- Ensure transformation_prompts.json is in src/config/
- Check console for import errors

### FAL API errors
- Verify API key in .env file
- Check that VITE_FAL_API_KEY is set correctly
- Restart dev server after changing .env

### Transformation failing
- Check browser console for errors
- Verify image URL is accessible
- Ensure looking and visual_style IDs match in config

## Development vs Production

Development:
- Uses mock API if FAL fails
- Loads config from src/config/

Production:
- Must have valid FAL API key
- Bundle includes the config file
- Admin page should be protected/removed

## Next Steps

1. Add authentication to ConfigAdmin page
2. Implement template selection with visual style options
3. Add preview functionality before transformation
4. Cache transformed images
5. Add batch transformation support
