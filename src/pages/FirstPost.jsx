import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';

function FirstPost() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigate = useNavigate();
  const {
    generatedPhotos,
    identityPhoto,
    selectedTemplate,
  } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  // Combine identity photo and generated photos for carousel
  const carouselPhotos = [
    ...(identityPhoto ? [{ ...identityPhoto, type: 'identity', description: 'Your Identity' }] : []),
    ...generatedPhotos.map((photo, idx) => ({
      ...photo,
      description: `Variant ${idx + 1}`
    }))
  ];

  useEffect(() => {
    // If no photos available, redirect back
    if (carouselPhotos.length === 0) {
      alert('No photos available. Please go back and select a template first.');
      navigate('/templates');
    }
  }, [carouselPhotos]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(Math.min(index, carouselPhotos.length - 1));
  };

  const handleContinue = () => {
    // Save selected photo and navigate to create-post
    navigate('/create-post');
  };

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {carouselPhotos.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            currentIndex === index && styles.paginationDotActive
          ]}
        />
      ))}
    </View>
  );

  if (carouselPhotos.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientOverlay} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigate('/templates')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>WELCOME TO PIKAVERSE</Text>
      </View>

      {/* Carousel Section */}
      <View style={styles.carouselSection}>
        <style>{`
          .carousel-container::-webkit-scrollbar {
            display: none;
          }
          .carousel-container {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div
          ref={scrollViewRef}
          className="carousel-container"
          onScroll={(e) => handleScroll({ nativeEvent: { contentOffset: { x: e.target.scrollLeft } } })}
          style={{
            display: 'flex',
            overflowX: 'scroll',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch',
            width: '100%',
            height: '100%',
            cursor: 'grab',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.cursor = 'grabbing';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.cursor = 'grab';
          }}
        >
          {carouselPhotos.map((photo, idx) => (
            <div
              key={photo.id || idx}
              style={{
                scrollSnapAlign: 'center',
                flex: '0 0 100%',
                width: `${screenWidth}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                paddingHorizontal: 40,
              }}
            >
              <View style={[styles.carouselCard, { width: screenWidth - 80 }]}>
                <Image
                  source={{ uri: photo.url }}
                  style={styles.carouselImage}
                  resizeMode="cover"
                />
                {/* Gradient overlay for text readability */}
                <View style={styles.cardOverlay} />
              </View>
            </div>
          ))}
        </div>

        {/* Pagination Dots */}
        {renderPaginationDots()}

        {/* Swipe hint */}
        {carouselPhotos.length > 1 && (
          <Text style={styles.swipeHint}>← Swipe to see variants →</Text>
        )}
      </View>

      {/* Bottom Button */}
      <TouchableOpacity
        style={styles.continueButton}
        onPress={handleContinue}
        activeOpacity={0.8}
      >
        <Text style={styles.continueButtonText}>NEXT</Text>
      </TouchableOpacity>

      {/* Photo Info */}
      <View style={styles.photoInfo}>
        <Text style={styles.photoDescription}>
          {carouselPhotos[currentIndex]?.description || 'Photo'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    background: 'linear-gradient(180deg, rgba(194, 190, 255, 0) 61.963%, rgba(194, 190, 255, 0.76) 100%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 40,
    zIndex: 1,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 60,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 6.5,
    fontFamily: Platform.select({
      web: "'Telka Extended', sans-serif",
      default: 'System',
    }),
    textTransform: 'uppercase',
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  carouselCard: {
    aspectRatio: 9 / 16,
    borderRadius: 56,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: 'rgba(194, 190, 255, 0.76)',
    shadowOffset: { width: 8, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4.5,
    elevation: 10,
    ...Platform.select({
      web: {
        boxShadow: '8px 4px 4.5px rgba(194, 190, 255, 0.76)',
      },
    }),
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.4) 100%)',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
    paddingVertical: 20,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#ffffff',
    width: 24,
  },
  swipeHint: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  continueButton: {
    position: 'absolute',
    bottom: 95,
    left: '50%',
    marginLeft: -80.5,
    width: 161,
    height: 47,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      },
    }),
  },
  continueButtonText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: 26,
    fontFamily: Platform.select({
      web: "'Telka Extended', sans-serif",
      default: 'System',
    }),
  },
  photoInfo: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
  },
  photoDescription: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
  },
});

export default FirstPost;
