# Asset Setup Guide

To complete the introduction page design, you need to add one file:

## 1. Background Image

**File**: `/Users/jiajun/social-look-app/public/holographic-bg.jpg`

**Instructions**:
1. Save the holographic background image you provided
2. Name it `holographic-bg.jpg`
3. Place it in `/Users/jiajun/social-look-app/public/` directory

## 2. Fonts (✓ Complete)

The app now uses Google Fonts which are loaded automatically from the web:
- **Title font**: Bebas Neue (primary), with Archivo Black and Anton as fallbacks, size 24px
- **Button font**: Space Mono (already loaded from Google Fonts)

**Google Fonts Used**:
- **Bebas Neue** - Bold, condensed display font perfect for impactful titles
- **Archivo Black** - Extra bold display font as first fallback
- **Anton** - Heavy weight sans-serif as second fallback
- **Space Mono** - Monospace font for buttons and UI elements

These fonts are loaded directly from Google Fonts CDN, so no local font files are needed!

## Current Setup

The code is already configured to use:
- **Title font**: Bebas Neue / Archivo Black / Anton from Google Fonts, size 24px
- **Button font**: Space Mono (from Google Fonts)
- **Background**: holographic-bg.jpg as full-screen cover

## Verification

After adding the background image, refresh the page at http://localhost:5173/ to see:
- Beautiful holographic background
- Bold display fonts from Google Fonts rendering properly
- All styling matching the Figma design

## Folder Structure

```
social-look-app/
├── public/
│   └── holographic-bg.jpg          ← Add this
```

## Font Fallback Chain

The title font uses this fallback chain:
1. **Bebas Neue** (Google Fonts - primary)
2. **Archivo Black** (Google Fonts - fallback 1)
3. **Anton** (Google Fonts - fallback 2)
4. **Impact** (system font - fallback 3)
5. **Arial Black** (system font - fallback 4)
6. **sans-serif** (system default)

The page will look great with any of these fonts!
