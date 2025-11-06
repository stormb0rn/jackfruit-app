import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';
import supabaseApi from '../services/supabaseApi';
import cacheService from '../services/cacheService';
import { configLoader } from '../utils/configLoader';

function FirstPost() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigate = useNavigate();
  const {
    identityPhoto,
    selectedTransformation,
    selectedTemplate,
    addGeneratedPhoto,
    cacheMode,
    generatedPhotos,
  } = useAppStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [generationError, setGenerationError] = useState(null);
  const [photos, setPhotos] = useState([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Check if we have required data
    if (!identityPhoto || !selectedTransformation || !selectedTemplate) {
      alert('Missing required data. Please start from the beginning.');
      navigate('/edit-look');
      return;
    }

    // Start generation
    generateImages();
  }, []);

  const generateImages = async () => {
    setIsGenerating(true);
    setGenerationError(null);

    try {
      console.log('[FirstPost] Starting image generation...');
      console.log('[FirstPost] Identity photo:', identityPhoto.url);
      console.log('[FirstPost] Transformation:', selectedTransformation);
      console.log('[FirstPost] Template:', selectedTemplate);

      // Build the complete prompts with edit style + template
      const prompts = configLoader.buildCompletePrompt(selectedTransformation, selectedTemplate);
      const promptsArray = Array.isArray(prompts) ? prompts : [prompts];

      console.log('[FirstPost] Generated prompts:', promptsArray);

      // Generate images using all prompts (3 for templates)
      const generatedPhotosLocal = [];

      for (let i = 0; i < promptsArray.length; i++) {
        const prompt = promptsArray[i];
        let imageUrl;

        try {
          console.log(`[FirstPost] Generating image ${i + 1}/${promptsArray.length}...`);

          // Check if cache mode is enabled - use random cached result (demo mode)
          if (cacheMode) {
            console.log(`[FirstPost] Cache mode ON - using random cached result`);
            imageUrl = await cacheService.getRandomCachedResult('templates', selectedTemplate);

            if (!imageUrl) {
              console.warn('[FirstPost] No cached results found, falling back to API call');
              // Fall back to real API if no cached results
              const result = await supabaseApi.transformImage(
                identityPhoto.url,
                prompt,
                selectedTransformation
              );

              if (result.success) {
                imageUrl = result.imageUrl;
              } else {
                throw new Error(result.error || 'Transformation failed');
              }
            }
          } else {
            console.log(`[FirstPost] Cache mode OFF - calling real API`);

            // Call Supabase edge function to transform image
            const result = await supabaseApi.transformImage(
              identityPhoto.url,
              prompt,
              selectedTransformation
            );

            console.log(`[FirstPost] Transformation result (${i + 1}/${promptsArray.length}):`, result);

            if (result.success) {
              imageUrl = result.imageUrl;
            } else {
              throw new Error(result.error || `Transformation ${i + 1} failed`);
            }
          }

          if (imageUrl) {
            const photoObj = {
              id: `transform-${Date.now()}-${i}`,
              url: imageUrl,
              type: selectedTransformation,
              template: selectedTemplate,
              description: `Variant ${i + 1}`,
              promptUsed: prompt
            };

            generatedPhotosLocal.push(photoObj);
            addGeneratedPhoto(photoObj);

            // Update UI immediately to show new image
            setPhotos([...generatedPhotosLocal]);

            console.log(`[FirstPost] Image ${i + 1} generated successfully`);
          }
        } catch (error) {
          console.error(`[FirstPost] Error generating image ${i + 1}:`, error);
          // Continue with next image instead of failing completely
          throw new Error(`Failed to generate variant ${i + 1}: ${error.message}`);
        }
      }

      // Save user generation to database
      if (generatedPhotosLocal.length > 0) {
        const promptTexts = promptsArray.join(' | ');
        const imageUrls = generatedPhotosLocal.map(photo => photo.url);

        cacheService.saveUserGeneration({
          testImageId: `user_template_${Date.now()}_${selectedTemplate}`,
          testImageUrl: identityPhoto.url,
          promptType: 'templates',
          promptId: selectedTemplate,
          promptText: promptTexts,
          generatedImageUrls: imageUrls,
          generationSource: 'template'
        }).catch(err => {
          console.error('[FirstPost] Failed to save generation:', err);
          // Don't block the flow if database save fails
        });

        console.log('[FirstPost] Generation complete:', generatedPhotosLocal.length, 'images');
      } else {
        throw new Error('No images were generated');
      }
    } catch (error) {
      console.error('[FirstPost] Generation failed:', error);
      setGenerationError(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(Math.min(index, photos.length - 1));
  };

  const handleContinue = () => {
    if (photos.length === 0) {
      alert('No photos available. Please try generating again.');
      return;
    }
    navigate('/create-post');
  };

  const handleRetry = () => {
    setPhotos([]);
    setGenerationError(null);
    generateImages();
  };

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {photos.map((_, index) => (
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
        {isGenerating ? (
          // Loading state
          <View style={styles.loadingContainer}>
            {identityPhoto && (
              <Image
                source={{ uri: identityPhoto.url }}
                style={styles.blurredIdentityImage}
                resizeMode="cover"
              />
            )}
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.loadingText}>Generating your transformation...</Text>
              <Text style={styles.loadingSubtext}>This may take a few moments</Text>
            </View>
          </View>
        ) : generationError ? (
          // Error state
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{generationError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              activeOpacity={0.7}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : photos.length > 0 ? (
          // Success state - show carousel
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
              {photos.map((photo, idx) => (
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
            {photos.length > 1 && (
              <Text style={styles.swipeHint}>← Swipe to see variants →</Text>
            )}
          </>
        ) : null}
      </View>

      {/* Bottom Button */}
      {!isGenerating && !generationError && photos.length > 0 && (
        <>
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
              {photos[currentIndex]?.description || 'Photo'}
            </Text>
          </View>
        </>
      )}
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
  loadingContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurredIdentityImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
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
    zIndex: 10,
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    marginBottom: 24,
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  retryButtonText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
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
});

export default FirstPost;
