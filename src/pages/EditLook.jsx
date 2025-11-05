import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import useAppStore from '../stores/appStore';
import { configLoader } from '../utils/configLoader';
import supabaseApi from '../services/supabaseApi';

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
  const { identityPhoto, setSelectedTransformation, setCurrentStep } = useAppStore();
  const [transformationOptions, setTransformationOptions] = useState([]);
  const [previewStates, setPreviewStates] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

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

  const generateAllPreviews = async () => {
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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

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
        <Text style={styles.title}>SELECT YOUR STYLE</Text>
      </View>

      <View style={styles.carouselSection}>
        <FlatList
          ref={flatListRef}
          data={transformationOptions}
          renderItem={renderCarouselItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToAlignment="center"
          decelerationRate="fast"
          scrollEnabled={true}
        />

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
    bottom: 0,
    height: '50%',
    backgroundColor: '#1a0a2e',
    opacity: 0.6,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 2,
  },
  carouselSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
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
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
    backgroundColor: '#ffffff',
    marginHorizontal: 40,
    marginBottom: 50,
    paddingVertical: 20,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 1,
  },
  selectButtonDisabled: {
    opacity: 0.6,
  },
  selectButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    letterSpacing: 2,
  },
});

export default EditLook;
