import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAppStore from './stores/appStore';
import Landing from './pages/Landing';
import IdentityUpload from './pages/IdentityUpload';
import EditLook from './pages/EditLook';
import Templates from './pages/Templates';
import CreatePost from './pages/CreatePost';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import ConfigAdmin from './pages/ConfigAdmin';
import MobileFrameWrapper from './components/MobileFrameWrapper';
import settingsService from './services/settingsService';

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
              <ConfigAdmin />
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
