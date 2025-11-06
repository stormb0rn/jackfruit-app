import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Dimensions, Platform } from 'react-native';
import useAppStore from '../stores/appStore';
import supabaseApi from '../services/supabaseApi';
import cacheService from '../services/cacheService';
import { configLoader } from '../utils/configLoader';
import { styleTemplateImages } from '../assets/style-templates';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const {
    identityPhoto,
    selectedTransformation,
    setSelectedTemplate,
    addGeneratedPhoto,
    setCurrentStep,
    cacheMode,
    selectedTestImageId,
    cachedGenerations,
    setCachedGenerations
  } = useAppStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    // Load cached results when cache mode is enabled and test image is selected
    if (cacheMode && selectedTestImageId) {
      loadCachedResults();
    }
  }, [cacheMode, selectedTestImageId]);

  const loadTemplates = async () => {
    try {
      // Load style templates from config
      const styleTemplates = configLoader.getStyleTemplates();

      // Map templates to include imported image references
      const templatesWithImages = styleTemplates.map(template => ({
        ...template,
        thumbnail: styleTemplateImages[template.image]
      }));

      setTemplates(templatesWithImages);
      console.log('Loaded templates:', templatesWithImages.length);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCachedResults = async () => {
    try {
      const cached = await cacheService.getCachedResults(selectedTestImageId);
      setCachedGenerations(cached);
      console.log('Loaded cached results for test image:', selectedTestImageId);
    } catch (error) {
      console.error('Failed to load cached results:', error);
    }
  };

  const handleSelectTemplate = async (index, template) => {
    if (!identityPhoto || !selectedTransformation) {
      alert('Please complete previous steps first');
      return;
    }

    setSelectedIndex(index);
    setGenerating(true);
    try {
      setSelectedTemplate(template.id);

      let imageUrl;

      // Check if cache mode is enabled
      if (cacheMode && selectedTestImageId && cachedGenerations?.templates?.[template.id]) {
        console.log('Using cached template result:', template.id);
        imageUrl = cachedGenerations.templates[template.id].generatedUrl;
      } else {
        console.log('Generating transformation with:', {
          photoUrl: identityPhoto.url,
          transformation: selectedTransformation,
          visualStyle: template.id
        });

        // Call Supabase edge function to transform image
        const result = await supabaseApi.transformImage(
          identityPhoto.url,
          selectedTransformation,
          template.id
        );

        console.log('Transformation result:', result);

        if (result.success) {
          imageUrl = result.imageUrl;
        } else {
          throw new Error(result.error || 'Transformation failed');
        }
      }

      if (imageUrl) {
        addGeneratedPhoto({
          id: `transform-${Date.now()}`,
          url: imageUrl,
          type: selectedTransformation,
          template: template.id,
          description: '',
        });
        setCurrentStep('create-post');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Failed to generate transformation: ${error.message}. Please try again.`);
      setSelectedIndex(null);
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectCurrentTemplate = () => {
    if (selectedIndex !== null && templates[selectedIndex]) {
      handleSelectTemplate(selectedIndex, templates[selectedIndex]);
    } else {
      alert('Please select a template first');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.gradientOverlay} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentStep('edit-look')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Template</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {/* Create your style card - first item */}
          <TouchableOpacity
            style={[styles.gridCard, styles.createCard]}
            activeOpacity={0.9}
            onPress={() => setCurrentStep('upload')}
          >
            <View style={styles.createCardOverlay}>
              <Text style={styles.createCardText}>create your style</Text>
            </View>
          </TouchableOpacity>

          {/* Template cards */}
          {templates.map((template, index) => (
            <TouchableOpacity
              key={template.id}
              style={[
                styles.gridCard,
                selectedIndex === index && styles.gridCardSelected
              ]}
              onPress={() => setSelectedIndex(index)}
              activeOpacity={0.8}
            >
              <Image
                source={template.thumbnail}
                style={styles.gridCardImage}
                resizeMode="cover"
              />
              {selectedIndex === index && (
                <View style={styles.selectedOverlay}>
                  <View style={styles.selectedCheckmark}>
                    <Text style={styles.selectedCheckmarkText}>✓</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={[styles.selectButton, (generating || selectedIndex === null) && styles.selectButtonDisabled]}
          onPress={handleSelectCurrentTemplate}
          disabled={generating || selectedIndex === null}
          activeOpacity={0.8}
        >
          {generating ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.selectButtonText}>SELECT</Text>
          )}
        </TouchableOpacity>
      </View>

      {generating && (
        <View style={styles.generatingOverlay}>
          <View style={styles.generatingBox}>
            <ActivityIndicator size="large" color="#007bff" />
            <Text style={styles.generatingText}>Generating your transformation...</Text>
            <Text style={styles.generatingSubtext}>This may take a few moments</Text>
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
    background: 'linear-gradient(180deg, rgba(194, 190, 255, 0) 61.96%, rgba(194, 190, 255, 0.76) 99.96%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
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
    letterSpacing: -0.4,
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Archivo Black', 'Helvetica Neue', 'Arial Black', sans-serif",
      default: 'System',
    }),
  },
  scrollView: {
    flex: 1,
    zIndex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 33,
    paddingTop: 10,
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 17,
    justifyContent: 'flex-start',
  },
  gridCard: {
    width: (screenWidth - 66 - 17) / 2,
    height: 227,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
  },
  gridCardSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  gridCardImage: {
    width: '100%',
    height: '100%',
  },
  createCard: {
    backgroundColor: 'rgba(40, 40, 40, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(5.588px)',
        WebkitBackdropFilter: 'blur(5.588px)',
      },
    }),
  },
  createCardOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  createCardText: {
    fontSize: 15,
    color: 'rgba(252, 250, 247, 0.7)',
    fontFamily: Platform.select({
      web: "'SF Pro', -apple-system, BlinkMacSystemFont, sans-serif",
      default: 'System',
    }),
    fontWeight: '400',
    textAlign: 'center',
  },
  selectedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmark: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCheckmarkText: {
    fontSize: 24,
    color: '#000000',
    fontWeight: 'bold',
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  selectButton: {
    backgroundColor: '#000000',
    width: 161,
    height: 63,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
    pointerEvents: 'auto',
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
    letterSpacing: 0,
    textTransform: 'uppercase',
    lineHeight: 31,
    fontFamily: Platform.select({
      web: "'Telka Extended', 'Archivo Black', 'Helvetica Neue', 'Arial Black', sans-serif",
      default: 'System',
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    color: '#ffffff',
  },
  generatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  generatingBox: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 40,
  },
  generatingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  generatingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
});

export default Templates;
