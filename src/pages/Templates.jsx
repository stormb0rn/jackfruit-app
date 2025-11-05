import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import useAppStore from '../stores/appStore';
import supabaseApi from '../services/supabaseApi';
import { configLoader } from '../utils/configLoader';
import { styleTemplateImages } from '../assets/style-templates';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const { identityPhoto, selectedTransformation, setSelectedTemplate, addGeneratedPhoto, setCurrentStep } = useAppStore();

  useEffect(() => {
    loadTemplates();
  }, []);

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

  const handleSelectTemplate = async (template) => {
    if (!identityPhoto || !selectedTransformation) {
      alert('Please complete previous steps first');
      return;
    }

    setGenerating(true);
    try {
      console.log('Generating transformation with:', {
        photoUrl: identityPhoto.url,
        transformation: selectedTransformation,
        visualStyle: template.id
      });

      setSelectedTemplate(template.id);

      // Call Supabase edge function to transform image
      const result = await supabaseApi.transformImage(
        identityPhoto.url,
        selectedTransformation,
        template.id
      );

      console.log('Transformation result:', result);

      if (result.success) {
        addGeneratedPhoto({
          id: result.transformationId || `transform-${Date.now()}`,
          url: result.imageUrl,
          type: selectedTransformation,
          template: template.id,
          description: result.description || '',
        });
        setCurrentStep('create-post');
      } else {
        throw new Error(result.error || 'Transformation failed');
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert(`Failed to generate transformation: ${error.message}. Please try again.`);
    } finally {
      setGenerating(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const handleSelectCurrentTemplate = () => {
    if (templates[currentIndex]) {
      handleSelectTemplate(templates[currentIndex]);
    }
  };

  const renderCarouselItem = ({ item }) => (
    <View style={styles.carouselItemContainer}>
      <View style={styles.carouselCard}>
        <Image source={item.thumbnail} style={styles.carouselImage} resizeMode="cover" />
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {templates.map((_, index) => (
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
        <Text style={styles.title}>SELECT YOUR STYLE</Text>
      </View>

      <View style={styles.carouselSection}>
        <FlatList
          ref={flatListRef}
          data={templates}
          renderItem={renderCarouselItem}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          snapToAlignment="center"
          decelerationRate="fast"
        />

        {renderPaginationDots()}
      </View>

      <TouchableOpacity
        style={[styles.selectButton, generating && styles.selectButtonDisabled]}
        onPress={handleSelectCurrentTemplate}
        disabled={generating}
        activeOpacity={0.8}
      >
        {generating ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Text style={styles.selectButtonText}>SELECT</Text>
        )}
      </TouchableOpacity>

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
