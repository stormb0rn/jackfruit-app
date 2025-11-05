# iOS Compatible Features

This document outlines all the iOS-specific optimizations and features implemented in the LookGen app.

## iOS Web App Features

### 1. Viewport Configuration
- Proper viewport meta tag with `viewport-fit=cover` for full-screen experience
- Disabled zoom with `maximum-scale=1.0, user-scalable=no`
- Dynamic viewport height support using `100dvh`

### 2. iOS Safe Area Support
- CSS custom properties for safe areas:
  - `--sat`: Safe area inset top
  - `--sar`: Safe area inset right
  - `--sab`: Safe area inset bottom
  - `--sal`: Safe area inset left
- All pages respect iOS notch and bottom bar

### 3. PWA (Progressive Web App) Support
- Manifest file for "Add to Home Screen"
- App name: "LookGen"
- Standalone display mode
- Custom theme color (#007bff)
- App icons support (192x192 and 512x512)

### 4. iOS Web App Capabilities
- `apple-mobile-web-app-capable`: Runs in full-screen mode when added to home screen
- `apple-mobile-web-app-status-bar-style`: Black translucent status bar
- `apple-mobile-web-app-title`: Custom app title
- Apple touch icons for home screen

## Mobile Optimizations

### 1. Touch-Friendly Design
- Minimum touch target size: 44x44px (iOS Human Interface Guidelines)
- All buttons have minimum height and width
- Proper tap highlight removal
- Active state feedback on touch

### 2. Responsive Typography
- Fluid font sizes using `clamp()`:
  - Titles: `clamp(24px, 6vw, 36px)`
  - Subtitles: `clamp(16px, 4vw, 20px)`
  - Body text: `clamp(14px, 3.5vw, 16px)`

### 3. Scrolling Optimizations
- Momentum scrolling: `-webkit-overflow-scrolling: touch`
- Disabled pull-to-refresh: `overscroll-behavior-y: contain`
- Smooth scrolling enabled
- Hidden scrollbars for cleaner UI

### 4. Input Styling
- Removed iOS default input styling
- Custom button appearances
- Proper file input handling
- Touch-optimized form elements

### 5. Performance Optimizations
- Fixed body positioning to prevent iOS bounce
- Hardware-accelerated transitions
- Optimized image rendering
- Efficient carousel scrolling with snap points

## Mobile-First Responsive Design

### Breakpoint Strategy
- Mobile-first approach
- Responsive grids using `repeat(auto-fit, minmax())`
- Flexible gaps and padding
- Adaptive image sizes

### Layout Adjustments
- Container padding: 16px on mobile, 40px on desktop
- Feature grids: min 150px columns on mobile
- Photo carousels: Adaptive heights using clamp
- Profile layout: Column on mobile, row on desktop

## Browser Compatibility

### iOS Safari Specific
- `-webkit-` prefixed properties
- Touch callout disabled
- Text size adjustment prevented
- Appearance properties normalized

### Testing Recommendations
1. Test on actual iOS devices (iPhone, iPad)
2. Test in iOS Safari and Chrome
3. Test "Add to Home Screen" functionality
4. Verify safe area insets on devices with notches
5. Test touch interactions and gestures
6. Verify scrolling behavior

## How to Test on iOS

### Using iOS Simulator (Mac)
```bash
# Open in iOS Simulator
npx serve dist
# Then open Safari on iOS Simulator and navigate to the local URL
```

### Using Physical iOS Device
1. Make sure your device and computer are on the same network
2. Run `npm run dev -- --host`
3. Access the app using your computer's IP address
4. Test "Add to Home Screen" feature

### Add to Home Screen
1. Open the app in Safari on iOS
2. Tap the Share button
3. Tap "Add to Home Screen"
4. The app will launch in standalone mode with custom icon

## Future iOS Enhancements

- [ ] Add iOS share sheet integration
- [ ] Implement haptic feedback for interactions
- [ ] Add iOS-specific gestures (swipe, pinch)
- [ ] Support iOS dark mode
- [ ] Add iOS notifications
- [ ] Implement iOS Face ID / Touch ID for authentication
- [ ] Add iOS camera integration
- [ ] Support iOS photo library access

## Technical Details

### CSS Features Used
- `env(safe-area-inset-*)` for notch support
- `clamp()` for responsive sizing
- `100dvh` for dynamic viewport
- CSS Grid with `auto-fit`
- `touch-action: manipulation`

### JavaScript/React Considerations
- Touch event handling ready
- Gesture detection compatible
- File upload via camera ready
- State management optimized for mobile

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [PWA on iOS](https://developer.apple.com/documentation/webkit/supporting_web_apps)
- [Safe Area](https://webkit.org/blog/7929/designing-websites-for-iphone-x/)
