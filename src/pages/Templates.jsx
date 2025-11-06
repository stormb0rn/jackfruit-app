import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { useNavigate } from 'react-router-dom';
import useAppStore from '../stores/appStore';
import { supabase } from '../services/supabaseClient';
import supabaseApi from '../services/supabaseApi';
import cacheService from '../services/cacheService';
import { configLoader } from '../utils/configLoader';

function Templates() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const navigate = useNavigate();
  const {
    identityPhoto,
    selectedTransformation,
    setSelectedTemplate,
    addGeneratedPhoto,
    cacheMode,
    selectedTestImageId,
    cachedGenerations,
    setCachedGenerations
  } = useAppStore();

  // Get template image URL from relative path
  const getTemplateImageUrl = (imagePath) => {
    if (!imagePath) return null;

    const { data } = supabase.storage
      .from('identity-photos')
      .getPublicUrl(imagePath);

    return data.publicUrl;
  };

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

      // Map templates to include image URLs from Supabase
      const templatesWithImages = styleTemplates.map(template => ({
        ...template,
        thumbnail: getTemplateImageUrl(template.image)
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

      // Build the complete prompts with edit style + template
      // For templates, returns array of 3 prompts; for edit look, returns single string
      const prompts = configLoader.buildCompletePrompt(selectedTransformation, template.id);
      const promptsArray = Array.isArray(prompts) ? prompts : [prompts];

      console.log('Generated prompts:', promptsArray);

      // Generate images using all prompts (3 for templates, 1 for edit look)
      const generatedPhotos = [];

      for (let i = 0; i < promptsArray.length; i++) {
        const prompt = promptsArray[i];
        let imageUrl;

        // Check if cache mode is enabled - use random cached result (demo mode)
        if (cacheMode) {
          console.log(`Cache mode ON - using random cached result for template ${i + 1}/${promptsArray.length}:`, template.id);
          imageUrl = await cacheService.getRandomCachedResult('templates', template.id);

          if (!imageUrl) {
            console.warn('No cached results found, falling back to API call');
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
          console.log(`Cache mode OFF - calling real API (${i + 1}/${promptsArray.length}) with:`, {
            photoUrl: identityPhoto.url,
            editStyleId: selectedTransformation,
            templateId: template.id,
            prompt: prompt
          });

          // Call Supabase edge function to transform image
          const result = await supabaseApi.transformImage(
            identityPhoto.url,
            prompt,
            selectedTransformation
          );

          console.log(`Transformation result (${i + 1}/${promptsArray.length}):`, result);

          if (result.success) {
            imageUrl = result.imageUrl;
          } else {
            throw new Error(result.error || `Transformation ${i + 1} failed`);
          }
        }

        if (imageUrl) {
          generatedPhotos.push({
            id: `transform-${Date.now()}-${i}`,
            url: imageUrl,
            type: selectedTransformation,
            template: template.id,
            description: `Variant ${i + 1}`,
            promptUsed: prompt
          });
        }
      }

      // Add all generated photos and navigate
      if (generatedPhotos.length > 0) {
        generatedPhotos.forEach(photo => addGeneratedPhoto(photo));
        navigate('/create-post');
      } else {
        throw new Error('No images were generated');
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
        <TouchableOpacity onPress={() => navigate('/edit-look')} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Select Aesthetic</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {/* Create your style card - first item */}
          <TouchableOpacity
            style={[styles.gridCard, styles.createCard, { width: (screenWidth - 66 - 17) / 2 }]}
            activeOpacity={0.9}
            onPress={() => navigate('/upload')}
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
                { width: (screenWidth - 66 - 17) / 2 },
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
    zIndex: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      },
    }),
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
    paddingTop: 130,
    paddingBottom: 100,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 17,
    justifyContent: 'flex-start',
  },
  gridCard: {
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
    position: 'fixed',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
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
