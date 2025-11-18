import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions, Platform, TextInput } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';
import { configLoader } from '../utils/configLoader';
import supabaseApi from '../services/supabaseApi';
import cacheService from '../services/cacheService';

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
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const navigate = useNavigate();
  const {
    identityPhoto,
    setSelectedTransformation,
    cacheMode,
    selectedTestImageId,
    cachedGenerations,
    setCachedGenerations
  } = useAppStore();
  const [transformationOptions, setTransformationOptions] = useState([]);
  const [previewStates, setPreviewStates] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [hasGeneratedPreviews, setHasGeneratedPreviews] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    const editOptions = configLoader.getEditOptions();
    const formattedOptions = editOptions.map(option => ({
      id: option.id,
      name: option.name,
      icon: iconMap[option.id] || '🎭',
      description: option.prompt,
      prompt: option.prompt,
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
    // Only generate once to prevent duplicate requests
    if (identityPhoto && transformationOptions.length > 0 && !hasGeneratedPreviews && !isGenerating) {
      generateAllPreviews();
      setHasGeneratedPreviews(true);
    }
  }, [identityPhoto, transformationOptions]);

  useEffect(() => {
    // Reset generation flag when identity photo changes (user uploads new photo)
    setHasGeneratedPreviews(false);
  }, [identityPhoto]);

  useEffect(() => {
    // Load cached results when cache mode is enabled
    if (cacheMode && transformationOptions.length > 0) {
      loadCachedPreviews();
    }
  }, [cacheMode, transformationOptions]);

  const loadCachedPreviews = async () => {
    try {
      console.log('Loading cached previews for identity photo:', identityPhoto?.id);

      if (!identityPhoto || !identityPhoto.id) {
        console.warn('Identity photo ID not available, cannot load cache');
        return;
      }

      // Try to load user's previously generated results for this photo
      const userResults = await cacheService.getUserCachedResults(identityPhoto.id, 'looking', false);

      // If no user results, try to load admin cache for preview
      const cachedResults = userResults || await cacheService.getUserCachedResults(identityPhoto.id, 'looking', true);

      if (!cachedResults) {
        console.log('No cached results found for this identity photo');
        return;
      }

      // Update preview states with cached results
      const newPreviewStates = {};

      for (const option of transformationOptions) {
        if (cachedResults[option.id]) {
          newPreviewStates[option.id] = {
            loading: false,
            imageUrl: cachedResults[option.id],
            error: null
          };
          console.log(`Loaded cached image for ${option.id}`);
        } else {
          newPreviewStates[option.id] = {
            loading: false,
            imageUrl: null,
            error: 'No cached result available for this option'
          };
        }
      }

      setPreviewStates(newPreviewStates);
      console.log('Loaded cached previews from database');
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
      navigate('/upload');
      return;
    }

    setIsGenerating(true);

    try {
      console.log('Starting batch transformation...');
      console.log('Identity photo URL:', identityPhoto.url);
      console.log('Edit styles:', transformationOptions.map(opt => opt.id));

      // Prepare edit style IDs array (backend will fetch prompts from database)
      const editStyleIds = transformationOptions.map(opt => opt.id);

      console.log('Prepared edit style IDs for batch generation:', editStyleIds);

      // Call Supabase edge function for batch image generation
      // Backend will query the database for prompts based on these IDs
      const result = await supabaseApi.batchGenerateImages(
        identityPhoto.url,
        editStyleIds
      );

      console.log('Batch image generation result:', result);

      if (result.success) {
        // Update preview states with results
        const newPreviewStates = {};
        result.results.forEach(transformResult => {
          newPreviewStates[transformResult.editStyleId] = {
            loading: false,
            imageUrl: transformResult.imageUrl || null,
            error: transformResult.status === 'failed' ? (transformResult.error || 'Generation failed') : null
          };

          // Save user generation to database if successful
          if (transformResult.status !== 'failed' && transformResult.imageUrl) {
            const editOption = transformationOptions.find(opt => opt.id === transformResult.editStyleId);
            if (editOption) {
              cacheService.saveUserGeneration({
                testImageId: identityPhoto.id,
                testImageUrl: identityPhoto.url,
                promptType: 'looking',
                promptId: transformResult.editStyleId,
                promptText: editOption.prompt,
                generatedImageUrls: [transformResult.imageUrl],
                generationSource: 'edit_look'
              }).catch(err => {
                console.error(`Failed to save user generation for ${transformResult.editStyleId}:`, err);
              });
            }
          }
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

  const handleGenerateCustomLook = async () => {
    if (!customPrompt.trim()) {
      alert('Please enter a description for your custom look');
      return;
    }

    if (!identityPhoto) {
      alert('Please upload an identity photo first');
      navigate('/upload');
      return;
    }

    setIsGeneratingCustom(true);

    try {
      console.log('Generating custom look with prompt:', customPrompt);

      // Create a custom transformation option
      const customOption = {
        id: 'custom_' + Date.now(),
        name: 'Custom Look',
        icon: '✨',
        description: customPrompt,
        prompt: customPrompt,
        config: { id: 'custom', name: 'Custom', prompt: customPrompt }
      };

      // Call the transform API
      const result = await supabaseApi.transformImage(
        identityPhoto.url,
        customPrompt
      );

      if (result.success && result.imageUrl) {
        // Add the custom option to transformationOptions
        setTransformationOptions(prev => [...prev, customOption]);

        // Add the preview state
        setPreviewStates(prev => ({
          ...prev,
          [customOption.id]: {
            loading: false,
            imageUrl: result.imageUrl,
            error: null
          }
        }));

        // Save user generation to database
        cacheService.saveUserGeneration({
          testImageId: customOption.id,
          testImageUrl: identityPhoto.url,
          promptType: 'looking',
          promptId: customOption.id,
          promptText: customPrompt,
          generatedImageUrls: [result.imageUrl],
          generationSource: 'edit_look'
        }).catch(err => {
          console.error('Failed to save custom look generation:', err);
        });

        // Scroll to the new custom look
        setTimeout(() => {
          setCurrentIndex(transformationOptions.length);
          if (scrollViewRef.current) {
            scrollViewRef.current.scrollLeft = screenWidth * transformationOptions.length;
          }
        }, 100);

        // Clear the prompt
        setCustomPrompt('');
      } else {
        alert('Failed to generate custom look: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating custom look:', error);
      alert('Failed to generate custom look: ' + error.message);
    }

    setIsGeneratingCustom(false);
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setCurrentIndex(index);
  };

  const handleSelectTransformation = (transformationType) => {
    setSelectedTransformation(transformationType);
    navigate('/templates');
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
      <View style={[styles.carouselItemContainer, { width: screenWidth }]}>
        <View style={[styles.carouselCard, { width: screenWidth - 80 }]}>
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
          onPress={() => navigate('/upload')}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>SELECT YOUR STYLE</Text>
      </View>

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
          {transformationOptions.map((option) => (
            <div
              key={option.id}
              style={{
                scrollSnapAlign: 'center',
                flex: '0 0 100%',
                width: `${screenWidth}px`,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {renderCarouselItem({ item: option })}
            </div>
          ))}
        </div>

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
        <Text style={styles.selectButtonText}>NEXT</Text>
      </TouchableOpacity>

      {/* Edit prompt input - shows when at the last look */}
      {currentIndex === transformationOptions.length - 1 && (
        <View style={styles.editPromptContainer}>
          <View style={styles.editPromptInputWrapper}>
            <TextInput
              style={styles.editPromptInput}
              placeholder="Edit your look by describing..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={customPrompt}
              onChangeText={setCustomPrompt}
              onSubmitEditing={handleGenerateCustomLook}
              returnKeyType="done"
              editable={!isGeneratingCustom}
            />
            {isGeneratingCustom && (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={styles.editPromptLoader}
              />
            )}
          </View>
        </View>
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
    // Note: Linear gradients not supported in React Native StyleSheet
    // Using transparent background instead
    backgroundColor: 'transparent',
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
      web: "'Telka Extended', sans-serif",
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  carouselCard: {
    aspectRatio: 9 / 16,
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
  selectButtonDisabled: {
    opacity: 0.6,
  },
  selectButtonText: {
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
  editPromptContainer: {
    position: 'absolute',
    bottom: 95,
    left: '50%',
    marginLeft: -163.5,
    width: 327,
    zIndex: 2,
  },
  editPromptInputWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 19,
    paddingHorizontal: 16,
    paddingVertical: 15,
    height: 47,
    flexDirection: 'row',
    alignItems: 'center',
  },
  editPromptInput: {
    flex: 1,
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '400',
    fontFamily: Platform.select({
      web: "'Telka', sans-serif",
      default: 'System',
    }),
  },
  editPromptLoader: {
    marginLeft: 12,
  },
});

export default EditLook;
