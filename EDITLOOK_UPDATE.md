EditLook Page Update - Auto-Generate Transformation Previews

## Changes Made

Updated the EditLook page to automatically generate transformation previews for all looking options using the FAL API.

## New Behavior

1. AUTO-GENERATION
   - When the page loads, it automatically generates previews for ALL looking options
   - Uses the "realistic" visual style as the default for previews
   - Each option gets its own API call to FAL nano-banana/edit

2. LOADING STATES
   - Shows loading animation (spinner) for each option while generating
   - Displays "Generating..." text under the spinner
   - Overall progress message shown while any option is loading
   - Cards are disabled (can't click) while loading

3. PREVIEW DISPLAY
   - Generated images are displayed in the option cards
   - Image fills the card with an overlay at the bottom
   - Overlay shows the icon and name of the transformation
   - Users can see the actual transformation before selecting

4. ERROR HANDLING
   - If generation fails, shows warning icon and error message
   - Card remains clickable even if generation fails
   - Falls back to showing the option name and description

## User Flow

Before:
1. User sees option cards with icons and descriptions
2. User clicks an option
3. Goes to templates page

After:
1. User sees their identity photo
2. Page automatically starts generating previews for all options
3. Loading spinners appear in each card
4. As each preview completes, it displays the transformed image
5. User can see all transformations and compare them
6. User clicks their preferred transformation
7. Goes to templates page

## Technical Implementation

### State Management
- `previewStates`: Tracks loading, imageUrl, and error for each option
- `isGenerating`: Global flag for when any preview is generating

### API Calls
- Uses `falApi.transformCharacter()` from src/services/falApi.js
- Default visual style: "realistic" (from config)
- Calls made sequentially to avoid rate limiting
- Each call uses the looking option's prompt_modifier + realistic style

### Components
- ActivityIndicator: React Native loading spinner
- Conditional rendering based on state (loading/imageUrl/error/placeholder)

### Styles
- Cards have minimum height (280px) to accommodate images
- Preview images fill the entire card
- Semi-transparent overlay for option name
- Loading and error states centered in card

## Configuration

The page loads looking options from:
- src/config/transformation_prompts.json (looking section)

Preview generation uses:
- Looking option: User selected (e.g., better_looking)
- Visual style: Fixed to "realistic" for previews
- Combined prompt: "{looking.prompt_modifier}, {realistic.prompt_modifier}"

## Example API Call

For the "Better-Looking" option:

Input:
- Image URL: User's identity photo
- Prompt: "better-looking, enhanced features, more attractive, refined appearance, photorealistic, realistic lighting, high detail, lifelike"
- Options: { numImages: 1, outputFormat: 'jpeg', aspectRatio: '1:1' }

Output:
- Transformed image URL displayed in the card

## Performance Considerations

1. SEQUENTIAL GENERATION
   - Previews generated one at a time
   - Prevents overwhelming the API
   - User sees progressive completion

2. CACHING
   - Could be added to avoid re-generating on page revisit
   - Currently regenerates each time page loads

3. ERROR RESILIENCE
   - Individual failures don't block other options
   - User can still select an option even if preview failed

## Future Enhancements

1. Cache generated previews in localStorage or state
2. Add retry button for failed generations
3. Allow user to start generation manually (button)
4. Show generation progress percentage
5. Allow canceling generation
6. Generate in parallel with rate limiting
7. Add thumbnail optimization for faster loading
8. Store previews in Supabase for reuse

## Testing

To test:
1. Start the app: `npm run dev`
2. Upload an identity photo
3. Navigate to "Choose Your Look Transformation"
4. Watch the loading animations appear
5. Wait for previews to generate (6 API calls)
6. Click on a generated preview
7. Should navigate to templates page

## Notes

- Each page load generates fresh previews (no caching yet)
- FAL API key must be set in .env file
- Preview generation may take 30-60 seconds total (6 options × ~5-10 seconds each)
- The realistic style is hardcoded for previews
- User can't proceed until at least one preview loads or they select a placeholder
