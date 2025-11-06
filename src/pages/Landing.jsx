import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import { useResponsiveLayout } from '../utils/responsive';

function Landing() {
  const navigate = useNavigate();
  const { scaleSize } = useResponsiveLayout();
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && document.fonts) {
      document.fonts.ready.then(() => {
        setFontsReady(true);
        console.log('[Landing] Fonts ready');
      });
    } else {
      setFontsReady(true);
    }
  }, []);

  const handleCreateProfile = () => {
    navigate('/upload');
  };

  // Create responsive styles based on screen size
  const responsiveStyles = useMemo(() => ({
    content: {
      ...styles.content,
      paddingHorizontal: scaleSize(40),
      paddingTop: scaleSize(200),
      paddingBottom: scaleSize(75),
    },
    button: {
      ...styles.button,
      width: scaleSize(247),
      minHeight: scaleSize(56),
      borderRadius: scaleSize(30),
      paddingVertical: scaleSize(10),
      paddingHorizontal: scaleSize(10),
    },
    title: {
      ...styles.title,
      fontSize: scaleSize(20),
      lineHeight: scaleSize(24),
    },
    buttonText: {
      ...styles.buttonText,
      fontSize: scaleSize(18),
    },
  }), [scaleSize]);

  return (
    <View style={styles.container}>
      {/* Background Video */}
      {Platform.OS === 'web' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          overflow: 'hidden',
        }}>
          <video
            autoPlay
            loop
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          >
            <source src="https://fwytawawmtenhbnwhunc.supabase.co/storage/v1/object/public/videos/landing-background.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
          {/* Base purple tint overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(194, 190, 255, 0.26)',
            zIndex: 1,
          }} />

          {/* Top gradient overlay */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '40%',
            background: 'linear-gradient(0deg, rgba(194, 190, 255, 0) 0%, rgba(194, 190, 255, 0.76) 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }} />

          {/* Bottom gradient overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '40%',
            background: 'linear-gradient(180deg, rgba(194, 190, 255, 0) 0%, rgba(194, 190, 255, 0.76) 100%)',
            pointerEvents: 'none',
            zIndex: 2,
          }} />

          {/* Subtle dark overlay for text readability */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.15)',
            zIndex: 3,
          }} />
        </div>
      )}

      {/* Content */}
      <View style={responsiveStyles.content}>
        <View style={styles.topSection}>
          <Text style={responsiveStyles.title}>YOU CAN ONLY LIVE{'\n'}MANY LIVES</Text>
        </View>

        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={responsiveStyles.button}
            onPress={handleCreateProfile}
            activeOpacity={0.7}
          >
            <Text style={responsiveStyles.buttonText}>CREATE A PROFILE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 200,
    paddingBottom: 75,
    zIndex: 4,
    ...Platform.select({
      web: {
        display: 'flex',
        minHeight: '100vh',
      },
    }),
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: 0,
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
    lineHeight: 24,
    ...Platform.select({
      web: {
        WebkitFontSmoothing: 'antialiased',
        textShadow: '0px 3px 4px #d9d9d9',
      },
    }),
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    width: 247,
    ...Platform.select({
      web: {
        boxShadow: '0px 5px 12.3px 0px rgba(0,0,0,0.25)',
      },
    }),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 12.3,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#fff',
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Bebas Neue', 'Archivo Black', 'Anton', 'Impact', 'Arial Black', sans-serif",
      default: 'System',
    }),
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
});

export default Landing;
