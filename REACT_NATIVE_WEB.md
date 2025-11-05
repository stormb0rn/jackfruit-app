# React Native Web Implementation

The LookGen app has been fully refactored to use **React Native Web** - a mobile-first UI framework that allows you to write React Native components that work on the web.

## What is React Native Web?

React Native Web makes it possible to run React Native components and APIs on the web using React DOM. This provides:

- **Write Once, Run Anywhere**: Same codebase can be used for web, iOS, and Android
- **Mobile-First Design**: Built-in mobile optimizations and touch interactions
- **Familiar API**: Use React Native's component library (View, Text, TouchableOpacity, etc.)
- **Performance**: Optimized for mobile web performance

## Architecture Changes

### 1. Entry Point (main.jsx)
**Before (React DOM):**
```javascript
import { createRoot } from 'react-dom/client'
createRoot(document.getElementById('root')).render(<App />)
```

**After (React Native Web):**
```javascript
import { AppRegistry } from 'react-native';
AppRegistry.registerComponent('LookGen', () => App);
AppRegistry.runApplication('LookGen', {
  rootTag: document.getElementById('root'),
});
```

### 2. Component Structure
**Before (HTML/CSS):**
```javascript
<div style={{ padding: 20 }}>
  <h1>Title</h1>
  <button onClick={handleClick}>Click</button>
</div>
```

**After (React Native):**
```javascript
<View style={styles.container}>
  <Text style={styles.title}>Title</Text>
  <TouchableOpacity onPress={handleClick} style={styles.button}>
    <Text>Click</Text>
  </TouchableOpacity>
</View>
```

### 3. Styling
**Before (Inline CSS Objects):**
```javascript
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#fff'
  }
}
```

**After (StyleSheet API):**
```javascript
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff'
  }
});
```

## React Native Components Used

### Core Components
- **View**: Replaces `<div>` - the fundamental container component
- **Text**: Replaces `<p>`, `<span>`, `<h1>`, etc. - for displaying text
- **Image**: Replaces `<img>` - optimized image component
- **ScrollView**: Replaces scrollable `<div>` - provides smooth scrolling
- **TouchableOpacity**: Replaces `<button>` - touch-optimized button with opacity feedback
- **TextInput**: Replaces `<input>` and `<textarea>` - text input with mobile keyboard support
- **ActivityIndicator**: Loading spinner component

### Key Differences

1. **No HTML Tags**: All components use React Native primitives
2. **StyleSheet API**: Styles defined using `StyleSheet.create()`
3. **Touch Events**: Uses `onPress` instead of `onClick`
4. **Flexbox by Default**: All layouts use flexbox
5. **No CSS Units**: Uses numbers (not px, em, etc.) for most values

## Mobile-First Features

### 1. Responsive Units
- Uses numeric values for sizing (20 instead of '20px')
- Percentages for responsive widths
- `flex` for flexible layouts

### 2. Touch Interactions
- `TouchableOpacity`: Provides visual feedback on touch
- `activeOpacity`: Controls opacity when pressed
- Minimum 44x44 touch targets (iOS guidelines)

### 3. ScrollView Optimization
- `contentContainerStyle`: Styles for scroll content
- Native momentum scrolling
- Better performance than CSS overflow

### 4. Image Handling
- `source={{ uri: url }}`: Image source prop
- `resizeMode`: Controls how image fits (cover, contain, stretch)
- Optimized image loading

## Page Structure

All pages follow this pattern:

```javascript
import { View, Text, ScrollView, StyleSheet } from 'react-native';

function PageName() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        {/* Page content */}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  content: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
});
```

## Refactored Pages

All 6 pages have been converted to React Native Web:

1. **IdentityUpload.jsx** - Photo upload with file input
2. **EditLook.jsx** - Transformation options grid
3. **Templates.jsx** - Template selection with loading states
4. **CreatePost.jsx** - Multi-photo selection with TextInput
5. **Feed.jsx** - Post feed with image cards
6. **Profile.jsx** - User profile with stats and grid

## Configuration

### Vite Config (vite.config.js)
```javascript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    include: ['react-native-web'],
  },
});
```

## Benefits

### 1. Mobile-First by Design
- Touch-optimized interactions
- Smooth scrolling
- Responsive layouts
- Mobile keyboard handling

### 2. Performance
- Optimized rendering
- Native-like scrolling
- Efficient image loading
- Hardware-accelerated animations

### 3. Consistency
- Same components across all platforms
- Predictable behavior
- Unified styling approach

### 4. Future-Proof
- Easy to add iOS/Android apps later
- Code reusability across platforms
- Active community and ecosystem

## Development

### Running the App
```bash
npm run dev
```

### Building for Production
```bash
npm run build
```

### Adding New Components
Always use React Native components:
```javascript
import { View, Text, TouchableOpacity } from 'react-native';
```

## Styling Guidelines

### 1. Use StyleSheet.create()
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  }
});
```

### 2. Flexbox Layouts
```javascript
{
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
}
```

### 3. Responsive Sizing
```javascript
{
  width: '100%',
  maxWidth: 800,
  alignSelf: 'center',
}
```

### 4. Touch Targets
Minimum 44x44 for iOS compliance:
```javascript
{
  minHeight: 44,
  minWidth: 44,
  paddingVertical: 14,
  paddingHorizontal: 24,
}
```

## Common Patterns

### Button with Text
```javascript
<TouchableOpacity onPress={handlePress} style={styles.button} activeOpacity={0.7}>
  <Text style={styles.buttonText}>Click Me</Text>
</TouchableOpacity>
```

### Image with Fallback
```javascript
<Image
  source={{ uri: imageUrl }}
  style={styles.image}
  resizeMode="cover"
/>
```

### Conditional Rendering
```javascript
{isLoading ? (
  <ActivityIndicator size="large" color="#007bff" />
) : (
  <View>{content}</View>
)}
```

### Grid Layout
```javascript
<View style={styles.grid}>
  {items.map(item => (
    <View key={item.id} style={styles.gridItem}>
      {/* Item content */}
    </View>
  ))}
</View>

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  gridItem: {
    width: '30%',
    aspectRatio: 1,
  },
});
```

## iOS Compatibility

React Native Web works seamlessly with iOS:
- Touch gestures work natively
- Smooth scrolling on iOS devices
- Respects iOS safe areas (when configured)
- Home screen PWA support

## Next Steps

1. **Add Platform-Specific Code** (if needed):
```javascript
import { Platform } from 'react-native';

if (Platform.OS === 'web') {
  // Web-specific code
}
```

2. **Add Animations**:
```javascript
import { Animated } from 'react-native';
```

3. **Add Gestures**:
```javascript
import { PanResponder } from 'react-native';
```

4. **Prepare for Native Apps**:
The codebase is now ready to be used in React Native iOS/Android apps with minimal changes!

## Resources

- [React Native Web Documentation](https://necolas.github.io/react-native-web/)
- [React Native Documentation](https://reactnative.dev/)
- [React Native Components](https://reactnative.dev/docs/components-and-apis)
- [StyleSheet API](https://reactnative.dev/docs/stylesheet)

## Summary

The app is now built with React Native Web, providing:
- Mobile-first design patterns
- Touch-optimized interactions
- Cross-platform compatibility
- Modern React Native component architecture
- iOS and Android ready codebase
