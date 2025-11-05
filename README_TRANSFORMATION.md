AI Character Transformation Configuration

This document explains how the transformation system works in the Social Look app.

## Architecture

The transformation system consists of several components:

1. Configuration (src/config/transformation_prompts.json)
   - Stores all "looking" and "visual_style" options
   - Each option has an ID, name, and prompt_modifier

2. Config Loader (src/utils/configLoader.js)
   - Utility functions to load and access configuration
   - Builds combined prompts from looking + visual style

3. FAL API Service (src/services/falApi.js)
   - Integrates with fal.ai nano-banana/edit API
   - Handles image transformation requests

4. Admin Interface
   - React Component: src/pages/ConfigAdmin.jsx
   - Standalone HTML: public/admin.html

## Configuration Structure

{
  "config_name": "AI Character Generation",
  "description": "Configuration for generating different AI character variations",
  "looking": {
    "better_looking": {
      "id": "better_looking",
      "name": "Better-Looking",
      "prompt_modifier": "better-looking, enhanced features, more attractive"
    }
  },
  "visual_style": {
    "realistic": {
      "id": "realistic",
      "name": "Realistic",
      "prompt_modifier": "photorealistic, realistic lighting, high detail"
    }
  }
}

## FAL.AI Integration

The app uses the fal.ai nano-banana/edit model:
- Endpoint: https://fal.run/fal-ai/nano-banana/edit
- Model: fal-ai/nano-banana/edit

### API Request Format

{
  "prompt": "combined prompt from looking + visual_style",
  "image_urls": ["url_of_user_photo"],
  "num_images": 1,
  "output_format": "jpeg",
  "aspect_ratio": "1:1"
}

### Response Format

{
  "images": [
    {
      "url": "https://...",
      "content_type": "image/jpeg",
      "width": 1024,
      "height": 1024
    }
  ],
  "description": "Description from AI"
}

## Usage

### 1. Setup Environment

Create a .env file:
VITE_FAL_API_KEY=your_api_key_here

### 2. Using the Config Loader

import { configLoader } from './utils/configLoader';

// Get all looking options
const lookingOptions = configLoader.getLookingOptions();

// Get specific option
const option = configLoader.getLookingById('better_looking');

// Build combined prompt
const prompt = configLoader.buildPrompt('better_looking', 'realistic');

### 3. Calling FAL API

import falApi from './services/falApi';

// Transform image
const result = await falApi.editImage(
  imageUrl,
  'better-looking, photorealistic',
  { numImages: 1, outputFormat: 'jpeg' }
);

// Or use the convenience method
const result = await falApi.transformCharacter(
  imageUrl,
  lookingConfig,
  visualStyleConfig
);

### 4. Admin Interface

Access the config admin in two ways:

a) React Component (in-app):
   - Navigate to config-admin step in the app

b) Standalone HTML:
   - Open public/admin.html in browser
   - Directly edit configuration
   - Export updated JSON file

## Workflow

1. User uploads identity photo (IdentityUpload page)
2. User selects a "looking" option (EditLook page)
3. User selects a "visual style" template (Templates page)
4. System builds combined prompt using configLoader
5. System calls FAL API to transform the image
6. User can create a post with the transformed image

## Admin Operations

### Adding New Looking Option

1. Open ConfigAdmin page or public/admin.html
2. Click "Add New" in the Looking section
3. Enter:
   - ID: unique identifier (e.g., korean_looking)
   - Name: display name (e.g., Korean-Looking)
   - Prompt Modifier: prompt text (e.g., Korean appearance, K-pop style)
4. Save and export configuration

### Adding New Visual Style

Same process as above, but in the Visual Style section.

### Exporting Configuration

1. Make changes in admin interface
2. Click "Export Configuration"
3. Save the JSON file
4. Replace src/config/transformation_prompts.json with the new file
5. Restart the app to load new configuration

## File Locations

- Configuration: src/config/transformation_prompts.json
- Config Loader: src/utils/configLoader.js
- FAL API Service: src/services/falApi.js
- Admin Page (React): src/pages/ConfigAdmin.jsx
- Admin Page (HTML): public/admin.html
- Edit Look Page: src/pages/EditLook.jsx

## Notes

- The EditLook component automatically loads options from the configuration
- Icon mapping for looking options is defined in EditLook.jsx
- The FAL API key must be set in the .env file
- The admin HTML page works standalone and can edit/export the config
