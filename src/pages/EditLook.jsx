import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import useAppStore from '../stores/appStore';
import { configLoader } from '../utils/configLoader';
import supabaseApi from '../services/supabaseApi';

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

    // Initialize preview states
    const initialStates = {};
    formattedOptions.forEach(option => {
      initialStates[option.id] = {
        loading: false,
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
      // Call Supabase edge function for batch transformation
      const result = await supabaseApi.batchTransform(
        identityPhoto.url,
        'realistic',
        transformationOptions.map(opt => opt.id)
      );

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
        alert('Failed to generate transformations');
      }
    } catch (error) {
      console.error('Error in batch transformation:', error);
      alert('Failed to generate transformations: ' + error.message);

      // Set all to error state
      const errorStates = {};
      transformationOptions.forEach(opt => {
        errorStates[opt.id] = {
          loading: false,
          imageUrl: null,
          error: 'Generation failed'
        };
      });
      setPreviewStates(errorStates);
    }

    setIsGenerating(false);
  };

  const handleSelectTransformation = (transformationType) => {
    setSelectedTransformation(transformationType);
    setCurrentStep('templates');
  };

  const renderOptionCard = (option) => {
    const state = previewStates[option.id] || {};
    const { loading, imageUrl, error } = state;

    return (
      <TouchableOpacity
        key={option.id}
        onPress={() => !loading && handleSelectTransformation(option.id)}
        style={[styles.optionCard, loading && styles.optionCardDisabled]}
        activeOpacity={0.7}
        disabled={loading}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0071e3" />
            <Text style={styles.loadingText}>Generating...</Text>
          </View>
        ) : imageUrl ? (
          <View style={styles.previewContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.previewImage}
              resizeMode="cover"
            />
            <View style={styles.optionOverlay}>
              <Text style={styles.optionIcon}>{option.icon}</Text>
              <Text style={styles.optionName}>{option.name}</Text>
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <Text style={styles.optionName}>{option.name}</Text>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Text style={styles.optionIcon}>{option.icon}</Text>
            <Text style={styles.optionName}>{option.name}</Text>
            <Text style={styles.optionDescription}>{option.description}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setCurrentStep('upload')}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Choose Your Look Transformation</Text>
          <Text style={styles.subtitle}>
            {isGenerating
              ? 'Generating preview transformations...'
              : 'Select your preferred transformation to continue'
            }
          </Text>
        </View>

        {identityPhoto && (
          <View style={styles.identityPreview}>
            <Image
              source={{ uri: identityPhoto.url }}
              style={styles.identityImage}
              resizeMode="cover"
            />
            <Text style={styles.identityLabel}>Your Identity Photo</Text>
          </View>
        )}

        <View style={styles.optionsGrid}>
          {transformationOptions.map(option => renderOptionCard(option))}
        </View>

        {isGenerating && (
          <View style={styles.overallProgress}>
            <Text style={styles.progressText}>
              Generating transformations for all options...
            </Text>
          </View>
        )}
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
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  identityPreview: {
    alignItems: 'center',
    marginBottom: 40,
  },
  identityImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    borderColor: 'white',
  },
  identityLabel: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 40,
  },
  optionCard: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    minWidth: 200,
    minHeight: 280,
    flex: 1,
    flexBasis: '30%',
    overflow: 'hidden',
  },
  optionCardDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  optionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 16,
    alignItems: 'center',
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  optionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#d32f2f',
    marginBottom: 12,
    textAlign: 'center',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionDescription: {
    fontSize: 12,
    color: '#888',
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
  },
  overallProgress: {
    padding: 20,
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  progressText: {
    fontSize: 14,
    color: '#f57c00',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default EditLook;
