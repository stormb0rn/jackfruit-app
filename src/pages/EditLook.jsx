import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions, Platform } from 'react-native';
import useAppStore from '../stores/appStore';
import { configLoader } from '../utils/configLoader';
import supabaseApi from '../services/supabaseApi';
import cacheService from '../services/cacheService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Icon mapping for looking options
const iconMap = {
  'better_looking': '✨',
  'japanese_looking': '🗾',
  'more_male': '👨',
  'more_female': '👩',
  'white_skinned': '🌟',
  'dark_skinned': '🌙',
};

function EditLook() {
  const {
    identityPhoto,
    setSelectedTransformation,
    setCurrentStep,
    cacheMode,
    selectedTestImageId,
    cachedGenerations,
    setCachedGenerations
  } = useAppStore();
  const [transformationOptions, setTransformationOptions] = useState([]);
  const [previewStates, setPreviewStates] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const lookingOptions = configLoader.getLookingOptions();
    const formattedOptions = lookingOptions.map(option => ({
      id: option.id,
      name: option.name,
      icon: iconMap[option.id] || '🎭',
      description: option.prompt_modifier,
      config: option
    }));
    setTransformationOptions(formattedOptions);

    // Initialize preview states with loading true
    const initialStates = {};
    formattedOptions.forEach(option => {
      initialStates[option.id] = {
        loading: true,
        imageUrl: null,
        error: null
      };
    });
    setPreviewStates(initialStates);
  }, []);

  useEffect(() => {
    // Auto-generate previews when page loads and identity photo exists
    if (identityPhoto && transformationOptions.length > 0 && !isGenerating) {
      generateAllPreviews();
    }
  }, [identityPhoto, transformationOptions]);

  useEffect(() => {
    // Load cached results when cache mode is enabled
    if (cacheMode && transformationOptions.length > 0) {
      loadCachedPreviews();
    }
  }, [cacheMode, transformationOptions]);

  const loadCachedPreviews = async () => {
    try {
      console.log('Cache mode ON - loading random cached results for preview...');

      // Update preview states with random cached results
      const newPreviewStates = {};

      for (const option of transformationOptions) {
        try {
          const cachedUrl = await cacheService.getRandomCachedResult('looking', option.id);
          if (cachedUrl) {
            newPreviewStates[option.id] = {
              loading: false,
              imageUrl: cachedUrl,
              error: null
            };
          } else {
            newPreviewStates[option.id] = {
              loading: false,
              imageUrl: null,
              error: 'No cached results available'
            };
          }
        } catch (error) {
          console.error(`Failed to load cached preview for ${option.id}:`, error);
          newPreviewStates[option.id] = {
            loading: false,
            imageUrl: null,
            error: 'Failed to load cached result'
          };
        }
      }

      setPreviewStates(newPreviewStates);
      console.log('Loaded random cached previews');
    } catch (error) {
      console.error('Failed to load cached previews:', error);
    }
  };

  const generateAllPreviews = async () => {
    // If cache mode is enabled, load random cached results instead
    if (cacheMode) {
      loadCachedPreviews();
      return;
    }

    if (!identityPhoto) {
      alert('Please upload an identity photo first');
      setCurrentStep('upload');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Starting batch transformation...');
      console.log('Identity photo URL:', identityPhoto.url);
      console.log('Looking types:', transformationOptions.map(opt => opt.id));

      // Call Supabase edge function for batch transformation
      const result = await supabaseApi.batchTransform(
        identityPhoto.url,
        'realistic',
        transformationOptions.map(opt => opt.id)
      );

      console.log('Batch transform result:', result);

      if (result.success) {
        // Update preview states with results
        const newPreviewStates = {};
        result.results.forEach(transformResult => {
          newPreviewStates[transformResult.lookingType] = {
            loading: false,
            imageUrl: transformResult.imageUrl || null,
            error: transformResult.status === 'failed' ? (transformResult.error || 'Generation failed') : null
          };
        });
        setPreviewStates(newPreviewStates);
      } else {
        console.error('Batch transform failed:', result);
        alert('Failed to generate transformations: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error in batch transformation:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      let errorMessage = 'Failed to generate transformations';

      // Provide more specific error messages
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error: Cannot connect to Supabase. Please check your internet connection.';
      } else if (error.message.includes('Edge Function')) {
        errorMessage = 'Edge function error: The batch-transform function may not be deployed.';
      } else if (error.message.includes('auth')) {
        errorMessage = 'Authentication error: Please ensure you are logged in.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      alert(errorMessage);

      // Set all to error state
      const errorStates = {};
      transformationOptions.forEach(opt => {
        errorStates[opt.id] = {
          loading: false,
          imageUrl: null,
          error: error.message || 'Generation failed'
        };
      });
      setPreviewStates(errorStates);
    }

    setIsGenerating(false);
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);
  };

  const handleSelectTransformation = (transformationType) => {
    setSelectedTransformation(transformationType);
    setCurrentStep('templates');
  };

  const handleSelectCurrentTransformation = () => {
    if (transformationOptions[currentIndex]) {
      const option = transformationOptions[currentIndex];
      const state = previewStates[option.id] || {};

      // Allow selection even if loading (will just proceed with the transformation type)
      if (!state.error) {
        handleSelectTransformation(option.id);
      } else {
        alert('This transformation failed to generate. Please try another option.');
      }
    }
  };

  const renderCarouselItem = ({ item: option }) => {
    const state = previewStates[option.id] || {};
    const { loading, imageUrl, error } = state;

    return (
      <View style={styles.carouselItemContainer}>
        <View style={styles.carouselCard}>
          {loading ? (
            <View style={styles.carouselLoadingContainer}>
              {identityPhoto && (
                <Image
                  source={{ uri: identityPhoto.url }}
                  style={styles.blurredIdentityImage}
                  resizeMode="cover"
                  blurRadius={10}
                />
              )}
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.carouselLoadingText}>Generating {option.name}...</Text>
              </View>
            </View>
          ) : imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.carouselImage}
              resizeMode="cover"
            />
          ) : error ? (
            <View style={styles.carouselErrorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.carouselErrorText}>{error}</Text>
              <Text style={styles.optionName}>{option.name}</Text>
            </View>
          ) : (
            <View style={styles.carouselPlaceholderContainer}>
              {identityPhoto && (
                <Image
                  source={{ uri: identityPhoto.url }}
                  style={styles.blurredIdentityImage}
                  resizeMode="cover"
                  blurRadius={20}
                />
              )}
              <View style={styles.placeholderOverlay}>
                <Text style={styles.optionIcon}>{option.icon}</Text>
                <Text style={styles.optionName}>{option.name}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {transformationOptions.map((_, index) => (
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

  return (
    <View style={styles.container}>
      <View style={styles.gradientOverlay} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => setCurrentStep('upload')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Choose Style</Text>
      </View>

      <View style={styles.carouselSection}>
        {Platform.OS === 'web' ? (
          <>
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
              {transformationOptions.map((option) => (
                <div
                  key={option.id}
                  style={{
                    scrollSnapAlign: 'center',
                    flex: '0 0 100%',
                    width: '100vw',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  {renderCarouselItem({ item: option })}
                </div>
              ))}
            </div>
          </>
        ) : null}

        {renderPaginationDots()}

        {isGenerating && (
          <Text style={styles.swipeHint}>← Swipe to preview other styles →</Text>
        )}
      </View>

      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleSelectCurrentTransformation}
        activeOpacity={0.8}
      >
        <Text style={styles.selectButtonText}>SELECT</Text>
      </TouchableOpacity>
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
    background: 'linear-gradient(180deg, rgba(194, 190, 255, 0) 0%, rgba(194, 190, 255, 0.76) 100%)',
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
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 1,
    fontFamily: Platform.select({
      web: "'Helvetica Neue', 'Arial Black', sans-serif",
      default: 'System',
    }),
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  scrollViewContent: {
    alignItems: 'center',
  },
  carouselItemContainer: {
    width: screenWidth,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  carouselCard: {
    width: screenWidth - 80,
    height: screenHeight * 0.55,
    borderRadius: 19,
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
  carouselLoadingContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  blurredIdentityImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselLoadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '500',
  },
  carouselErrorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1a1a1a',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  carouselErrorText: {
    fontSize: 14,
    color: '#ff6b6b',
    marginBottom: 12,
    textAlign: 'center',
  },
  carouselPlaceholderContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  placeholderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  optionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
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
  selectButton: {
    backgroundColor: '#000000',
    marginHorizontal: 116,
    marginBottom: 50,
    paddingVertical: 18,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(30px)',
        WebkitBackdropFilter: 'blur(30px)',
      },
    }),
  },
  selectButtonDisabled: {
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 31.02,
    fontFamily: Platform.select({
      web: "'Helvetica Neue', 'Arial Black', sans-serif",
      default: 'System',
    }),
  },
});

export default EditLook;
