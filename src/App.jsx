import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './stores/appStore';
import Landing from './pages/Landing';
import IdentityUpload from './pages/IdentityUpload';
import EditLook from './pages/EditLook';
import Templates from './pages/Templates';
import FirstPost from './pages/FirstPost';
import CreatePost from './pages/CreatePost';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ConfigAdmin from './pages/ConfigAdmin';
import MobileFrameWrapper from './components/MobileFrameWrapper';
import settingsService from './services/settingsService';

// Error Boundary to catch rendering errors
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#000' }}>
            页面加载出错
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 10, color: '#666' }}>
            {this.state.error?.toString()}
          </Text>
          <Text style={{ fontSize: 14, color: '#999' }}>
            请打开浏览器控制台查看详细错误信息
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function App() {
  const setCacheMode = useAppStore((state) => state.setCacheMode);
  const loadConfigFromSupabase = useAppStore((state) => state.loadConfigFromSupabase);

  useEffect(() => {
    // Load configuration from Supabase on app startup
    const initializeApp = async () => {
      try {
        // Load prompt configuration from Supabase
        console.log('Loading configuration from Supabase...');
        await loadConfigFromSupabase();
        console.log('Configuration loaded successfully');
      } catch (error) {
        console.error('Failed to load configuration:', error);
      }

      // Fetch global cache mode
      try {
        const cacheMode = await settingsService.getGlobalCacheMode();
        console.log('Initial global cache mode:', cacheMode);
        setCacheMode(cacheMode);
      } catch (error) {
        console.error('Failed to fetch global cache mode:', error);
      }
    };

    initializeApp();

    // Subscribe to real-time cache mode changes
    let subscription = null;
    try {
      subscription = settingsService.subscribeToCacheModeChanges((newCacheMode) => {
        console.log('Cache mode changed (real-time):', newCacheMode);
        setCacheMode(newCacheMode);
      });
    } catch (error) {
      console.warn('Real-time subscription failed (non-critical):', error);
    }

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [setCacheMode, loadConfigFromSupabase]);

  return (
    <BrowserRouter>
      <MobileFrameWrapper>
        <Routes>
          <Route path="/" element={<Navigate to="/landing" replace />} />
          <Route path="/landing" element={
            <View style={styles.app}>
              <Landing />
            </View>
          } />
          <Route path="/upload" element={
            <View style={styles.app}>
              <IdentityUpload />
            </View>
          } />
          <Route path="/edit-look" element={
            <View style={styles.app}>
              <EditLook />
            </View>
          } />
          <Route path="/templates" element={
            <View style={styles.app}>
              <Templates />
            </View>
          } />
          <Route path="/1st-post" element={
            <View style={styles.app}>
              <FirstPost />
            </View>
          } />
          <Route path="/create-post" element={
            <View style={styles.app}>
              <CreatePost />
            </View>
          } />
          <Route path="/feed" element={
            <View style={styles.app}>
              <Feed />
            </View>
          } />
          <Route path="/profile" element={
            <View style={styles.app}>
              <Profile />
            </View>
          } />
          <Route path="/admin" element={
            <View style={styles.app}>
              <ErrorBoundary>
                <ConfigAdmin />
              </ErrorBoundary>
            </View>
          } />
        </Routes>
      </MobileFrameWrapper>
    </BrowserRouter>
  );
}

const styles = StyleSheet.create({
  app: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

export default App;
