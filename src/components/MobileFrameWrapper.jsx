import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useLocation } from 'react-router-dom';
import useAppStore from '../stores/appStore';

function MobileFrameWrapper({ children }) {
  const { isMobileFrameEnabled, toggleMobileFrame } = useAppStore();
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkViewport = () => {
      setIsDesktop(window.innerWidth > 768);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Admin page always renders full width without frame
  if (location.pathname === '/admin') {
    return <>{children}</>;
  }

  // On mobile devices, always render full width without frame
  if (!isDesktop) {
    return <>{children}</>;
  }

  // On desktop, show toggle button and optionally constrain to mobile frame
  return (
    <View style={styles.desktopContainer}>
      {/* Toggle Button */}
      <TouchableOpacity
        style={styles.toggleButton}
        onPress={toggleMobileFrame}
        activeOpacity={0.8}
      >
        <Text style={styles.toggleButtonText}>
          {isMobileFrameEnabled ? '📱' : '💻'}
        </Text>
      </TouchableOpacity>

      {/* Content Container */}
      <View style={isMobileFrameEnabled ? styles.mobileFrame : styles.fullWidth}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    ...Platform.select({
      web: {
        minHeight: '100vh',
        display: 'flex',
      },
    }),
  },
  toggleButton: {
    position: 'fixed',
    top: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      },
    }),
  },
  toggleButtonText: {
    fontSize: 24,
  },
  mobileFrame: {
    width: 430,
    height: 932,
    backgroundColor: '#000',
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        transition: 'all 0.3s ease',
      },
    }),
  },
  fullWidth: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'all 0.3s ease',
      },
    }),
  },
});

export default MobileFrameWrapper;
