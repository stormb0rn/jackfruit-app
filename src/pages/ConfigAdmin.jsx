import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Image, Switch, ActivityIndicator } from 'react-native';
import transformationConfig from '../config/transformation_prompts.json';
import styleTemplatesConfig from '../config/style_templates.json';
import { supabase } from '../services/supabaseClient';
import { falApi } from '../services/falApi';
import { styleTemplateImages } from '../assets/style-templates/index.js';
import cacheService from '../services/cacheService';
import useAppStore from '../stores/appStore';

function ConfigAdmin() {
  const [config, setConfig] = useState({ looking: {}, templates: {} });
  const [modalVisible, setModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    prompt_modifier: '',
    image: '',
    enabled: true
  });

  // Global test images state
  const [testImages, setTestImages] = useState([]);
  const [selectedTestImageIndex, setSelectedTestImageIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Cache mode from store
  const cacheMode = useAppStore((state) => state.cacheMode);
  const setCacheMode = useAppStore((state) => state.setCacheMode);
  const selectedTestImageId = useAppStore((state) => state.selectedTestImageId);
  const setSelectedTestImageId = useAppStore((state) => state.setSelectedTestImageId);

  // Batch generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, item: null });

  // Cached results for display
  const [cachedResults, setCachedResults] = useState({});

  // Test results - keyed by item id
  const [testResults, setTestResults] = useState({});
  const [testingInProgress, setTestingInProgress] = useState({});

  useEffect(() => {
    loadConfig();
    loadExistingTestImages();
  }, []);

  useEffect(() => {
    // Load cached results when test image selection changes
    if (testImages.length > 0 && testImages[selectedTestImageIndex]) {
      const currentImage = testImages[selectedTestImageIndex];
      loadCachedResults(currentImage.id);
      setSelectedTestImageId(currentImage.id);
    }
  }, [selectedTestImageIndex, testImages]);

  const loadConfig = () => {
    // Merge visual_style into looking
    const mergedLooking = {
      ...transformationConfig.looking,
      ...Object.entries(transformationConfig.visual_style).reduce((acc, [key, value]) => {
        acc[key] = { ...value, enabled: true };
        return acc;
      }, {})
    };

    // Add enabled flag to all looking items if not present
    Object.keys(mergedLooking).forEach(key => {
      if (mergedLooking[key].enabled === undefined) {
        mergedLooking[key].enabled = true;
      }
    });

    // Add enabled flag to templates if not present
    const templatesWithEnabled = {};
    Object.entries(styleTemplatesConfig.templates || {}).forEach(([key, value]) => {
      templatesWithEnabled[key] = {
        ...value,
        enabled: value.enabled !== undefined ? value.enabled : true
      };
    });

    setConfig({
      looking: mergedLooking,
      templates: templatesWithEnabled
    });
  };

  const loadCachedResults = async (testImageId) => {
    try {
      const results = await cacheService.getCachedResults(testImageId);
      setCachedResults(results);

      // Check if we have any cached results
      const hasCache = (results.looking && Object.keys(results.looking).length > 0) ||
                       (results.templates && Object.keys(results.templates).length > 0);

      if (!hasCache) {
        console.log('ℹ️  No cached results found for test image:', testImageId);
      } else {
        console.log('✅ Loaded cached results:', {
          looking: Object.keys(results.looking || {}).length,
          templates: Object.keys(results.templates || {}).length
        });
      }
    } catch (error) {
      console.error('❌ Failed to load cached results:', error);

      // Check if it's a table not found error
      if (error.code === 'PGRST205' || error.message?.includes('cached_generations')) {
        alert('⚠️ Database table not found. Please ensure the migration has been applied and the PostgREST schema cache has been refreshed.');
      }

      setCachedResults({ looking: {}, templates: {} });
    }
  };

  const loadExistingTestImages = async () => {
    try {
      console.log('📁 Loading existing test images from Storage...');

      const { data: files, error } = await supabase
        .storage
        .from('identity-photos')
        .list('anonymous/test-images', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        console.error('❌ Failed to load test images:', error);
        return;
      }

      if (!files || files.length === 0) {
        console.log('ℹ️  No existing test images found');
        return;
      }

      console.log(`✅ Found ${files.length} test images`);

      // Convert files to test image objects
      const loadedImages = files.map(file => {
        // Extract timestamp from filename (e.g., "1762393507962-vh5lhk.jpg" -> "1762393507962")
        const timestamp = file.name.split('-')[0];
        const testImageId = `test-${timestamp}`;

        // Generate public URL
        const { data: urlData } = supabase.storage
          .from('identity-photos')
          .getPublicUrl(`anonymous/test-images/${file.name}`);

        return {
          id: testImageId,
          url: urlData.publicUrl,
          publicUrl: urlData.publicUrl,
          filePath: `anonymous/test-images/${file.name}`,
          fileName: file.name,
          createdAt: file.created_at
        };
      });

      // Update state with loaded images
      setTestImages(loadedImages);

      // Auto-select the first (most recent) image
      if (loadedImages.length > 0) {
        setSelectedTestImageIndex(0);
        console.log(`📌 Auto-selected most recent image: ${loadedImages[0].fileName}`);
      }
    } catch (error) {
      console.error('❌ Error loading existing test images:', error);
    }
  };

  const openModal = (type, id = null) => {
    setCurrentType(type);
    setEditingId(id);

    if (id) {
      const item = config[type][id];
      setFormData({
        id: item.id,
        name: item.name,
        prompt_modifier: type === 'templates' ? item.prompt : item.prompt_modifier,
        image: item.image || '',
        enabled: item.enabled !== undefined ? item.enabled : true
      });
    } else {
      setFormData({
        id: '',
        name: '',
        prompt_modifier: '',
        image: '',
        enabled: true
      });
    }

    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({
      id: '',
      name: '',
      prompt_modifier: '',
      image: '',
      enabled: true
    });
    setEditingId(null);
  };

  const saveItem = () => {
    const newConfig = { ...config };

    if (editingId && editingId !== formData.id) {
      delete newConfig[currentType][editingId];
    }

    newConfig[currentType][formData.id] = {
      id: formData.id,
      name: formData.name,
      enabled: formData.enabled,
      ...(currentType === 'templates'
        ? { prompt: formData.prompt_modifier, image: formData.image }
        : { prompt_modifier: formData.prompt_modifier }
      )
    };

    setConfig(newConfig);
    closeModal();
  };

  const deleteItem = (type, id) => {
    const confirmed = window.confirm('Confirm Delete\n\nAre you sure you want to delete this item?');

    if (!confirmed) return;

    const newConfig = { ...config };
    delete newConfig[type][id];
    setConfig(newConfig);
  };

  const toggleEnabled = (type, id) => {
    const newConfig = { ...config };
    newConfig[type][id].enabled = !newConfig[type][id].enabled;
    setConfig(newConfig);
  };

  const handleImagePick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsUploadingImage(true);
        try {
          const { publicUrl, filePath } = await uploadImageToSupabase(file);
          const reader = new FileReader();
          reader.onload = async (event) => {
            const testImageId = `test-${Date.now()}`;
            const newImage = {
              id: testImageId,
              file,
              url: event.target.result,
              publicUrl,
              filePath
            };

            setTestImages([...testImages, newImage]);
            setSelectedTestImageIndex(testImages.length);

            // Auto-generate cache for this test image
            await handleBatchGenerate(newImage);
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Upload error:', error);
          alert(`Upload Failed\n\n${error.message}`);
        } finally {
          setIsUploadingImage(false);
        }
      }
    };
    input.click();
  };

  const handleBatchGenerate = async (testImage) => {
    setIsBatchGenerating(true);
    setBatchProgress({ current: 0, total: 0, item: null });

    try {
      const results = await cacheService.batchGenerateCache(
        testImage.publicUrl,
        testImage.id,
        config,
        (current, total, item) => {
          setBatchProgress({ current, total, item });
        }
      );

      // Show detailed results
      const successCount = results.success.length;
      const failedCount = results.failed.length;

      console.log('✅ Batch generation complete:', { successCount, failedCount });

      if (successCount > 0 || failedCount === 0) {
        alert(`Batch Generation Complete\n\n✅ Successfully generated ${successCount} out of ${results.total} prompts.${failedCount > 0 ? `\n⚠️ Failed: ${failedCount}` : ''}`);
      } else {
        // All failed
        const errorMsg = results.failed[0]?.error || 'Unknown error';
        alert(`Batch Generation Failed\n\n❌ All generations failed.\nError: ${errorMsg}\n\nPlease check console for details.`);
      }

      // Reload cached results
      await loadCachedResults(testImage.id);
    } catch (error) {
      console.error('❌ Batch generation error:', error);

      if (error.code === 'PGRST205' || error.message?.includes('cached_generations')) {
        alert('Database Error\n\n⚠️ The cached_generations table was not found. Please ensure the migration has been applied and wait a moment for the schema cache to refresh, then try again.');
      } else {
        alert(`Batch Generation Failed\n\n${error.message}`);
      }
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress({ current: 0, total: 0, item: null });
    }
  };

  const uploadImageToSupabase = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `anonymous/test-images/${fileName}`;

      const { data, error } = await supabase.storage
        .from('identity-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('identity-photos')
        .getPublicUrl(filePath);

      return { publicUrl, filePath };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const removeTestImage = async (index) => {
    const image = testImages[index];

    // Use window.confirm for web compatibility
    const confirmed = window.confirm(
      'Confirm Delete\n\nThis will also delete all cached generations for this image. Continue?'
    );

    if (!confirmed) return;

    try {
      console.log('🗑️ Deleting test image:', {
        fileName: image.fileName,
        filePath: image.filePath,
        id: image.id
      });

      // Remove from Supabase storage
      console.log('Attempting to delete from storage...');
      const { data, error } = await supabase.storage
        .from('identity-photos')
        .remove([image.filePath]);

      console.log('Storage delete response:', { data, error });

      if (error) {
        console.error('❌ Storage delete error:', error);
        throw new Error(`Storage deletion failed: ${error.message}`);
      }

      // Verify deletion
      const { data: files, error: listError } = await supabase.storage
        .from('identity-photos')
        .list('anonymous/test-images');

      if (!listError) {
        const stillExists = files.some(f => f.name === image.fileName);
        if (stillExists) {
          throw new Error('File still exists after deletion attempt');
        }
      }

      console.log('✅ Deleted from storage and verified');

      // Delete cached generations
      try {
        await cacheService.deleteCacheForTestImage(image.id);
        console.log('✅ Deleted cached generations');
      } catch (cacheError) {
        console.warn('⚠️ Failed to delete cache, but continuing:', cacheError);
      }

      // Remove from local state
      const newImages = testImages.filter((_, i) => i !== index);
      setTestImages(newImages);

      // Adjust selected index if needed
      if (selectedTestImageIndex >= newImages.length) {
        setSelectedTestImageIndex(Math.max(0, newImages.length - 1));
      }

      // Clear cached results if deleted image was selected
      if (selectedTestImageIndex === index) {
        setCachedResults({ looking: {}, templates: {} });
      }

      console.log('✅ Test image removed successfully');
      alert('Test image deleted successfully!');
    } catch (error) {
      console.error('❌ Remove error:', error);
      alert(`Remove Failed\n\n${error.message}\n\nPlease check the console for details.`);
    }
  };

  const handleRegeneratePrompt = async (type, id, item) => {
    const itemKey = `${type}-${id}`;

    if (!testImages.length || selectedTestImageIndex >= testImages.length) {
      alert('Error\n\nPlease upload a test image first');
      return;
    }

    const selectedImage = testImages[selectedTestImageIndex];

    setTestingInProgress(prev => ({ ...prev, [itemKey]: true }));

    try {
      const promptText = type === 'templates' ? item.prompt : item.prompt_modifier;

      const result = await cacheService.regeneratePrompt(
        selectedImage.publicUrl,
        selectedImage.id,
        type,
        id,
        promptText
      );

      // Reload cached results
      await loadCachedResults(selectedImage.id);

      alert('Success\n\nPrompt regenerated successfully!');
    } catch (error) {
      console.error('Regenerate error:', error);
      alert(`Regenerate Failed\n\n${error.message}`);
    } finally {
      setTestingInProgress(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const exportConfig = () => {
    // Separate looking into original categories
    const exportLooking = {};
    const exportVisualStyle = {};

    Object.entries(config.looking).forEach(([key, item]) => {
      // Check if it was originally from visual_style
      if (transformationConfig.visual_style[key]) {
        exportVisualStyle[key] = {
          id: item.id,
          name: item.name,
          prompt_modifier: item.prompt_modifier
        };
      } else {
        exportLooking[key] = {
          id: item.id,
          name: item.name,
          prompt_modifier: item.prompt_modifier,
          enabled: item.enabled
        };
      }
    });

    const transformData = {
      config_name: "AI Character Generation",
      description: "Configuration for generating different AI character variations",
      looking: exportLooking,
      visual_style: exportVisualStyle
    };

    const styleData = {
      config_name: "Style Templates",
      description: "Configuration for different aesthetic style templates",
      templates: config.templates
    };

    // Download files
    downloadJSON(transformData, 'transformation_prompts.json');
    setTimeout(() => downloadJSON(styleData, 'style_templates.json'), 100);

    alert('Success\n\nConfiguration exported successfully!');
  };

  const downloadJSON = (data, filename) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (type, title) => {
    const items = config[type] || {};

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => openModal(type)}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsGrid}>
          {Object.entries(items).map(([key, item]) => {
            const itemKey = `${type}-${key}`;
            const isLoading = testingInProgress[itemKey];
            const cachedResult = cachedResults[type] && cachedResults[type][key];

            return (
              <View key={key} style={styles.itemCard}>
                {item.image && styleTemplateImages[item.image] && (
                  <Image
                    source={{ uri: styleTemplateImages[item.image] }}
                    style={styles.templateImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <View style={styles.itemActions}>
                    <Switch
                      value={item.enabled}
                      onValueChange={() => toggleEnabled(type, key)}
                      trackColor={{ false: '#d2d2d7', true: '#34c759' }}
                      thumbColor="#fff"
                      style={styles.switch}
                    />
                    <TouchableOpacity
                      onPress={() => handleRegeneratePrompt(type, key, item)}
                      style={styles.textButton}
                      activeOpacity={0.7}
                      disabled={isLoading || !testImages.length}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.textButtonText}>Regenerate</Text>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openModal(type, key)}
                      style={styles.textButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.textButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteItem(type, key)}
                      style={[styles.textButton, styles.deleteButton]}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.textButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.itemPrompt}>
                  {type === 'templates' ? item.prompt : item.prompt_modifier}
                </Text>

                <Text style={[styles.enabledStatus, item.enabled ? styles.enabled : styles.disabled]}>
                  {item.enabled ? '● Enabled' : '○ Disabled'}
                </Text>

                {cachedResult && cachedResult.generatedUrl && (
                  <View style={styles.testResultInline}>
                    <Text style={styles.testResultLabel}>Cached Result:</Text>
                    <Image
                      source={{ uri: cachedResult.generatedUrl }}
                      style={styles.resultImageInline}
                      resizeMode="contain"
                    />
                    <Text style={styles.cacheTimestamp}>
                      Updated: {new Date(cachedResult.updatedAt).toLocaleString()}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Admin Settings</Text>
          <Text style={styles.subtitle}>Manage AI character and prompt configurations</Text>
        </View>

        {/* Cache Mode Toggle */}
        <View style={styles.cacheModeSection}>
          <View style={styles.cacheModeHeader}>
            <View>
              <Text style={styles.cacheModeTitle}>Cache Mode</Text>
              <Text style={styles.cacheModeSubtitle}>
                {cacheMode
                  ? 'Using cached results (saves API credits)'
                  : 'Using live API calls'}
              </Text>
            </View>
            <Switch
              value={cacheMode}
              onValueChange={setCacheMode}
              trackColor={{ false: '#d2d2d7', true: '#34c759' }}
              thumbColor="#fff"
              style={styles.cacheModeSwitch}
            />
          </View>
        </View>

        {/* Test Images Section */}
        <View style={styles.testImagesSection}>
          <Text style={styles.sectionTitle}>Test Images (Models)</Text>
          <Text style={styles.sectionSubtitle}>
            Upload test images to pre-generate all looks. Results are cached for faster testing.
          </Text>

          <View style={styles.testImagesControls}>
            <TouchableOpacity
              style={[styles.uploadButton, (isUploadingImage || isBatchGenerating) && styles.disabledButton]}
              onPress={handleImagePick}
              activeOpacity={0.7}
              disabled={isUploadingImage || isBatchGenerating}
            >
              {isUploadingImage ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>📤 Upload Test Image</Text>
              )}
            </TouchableOpacity>

            {testImages.length > 0 && testImages[selectedTestImageIndex] && (
              <TouchableOpacity
                style={[styles.generateCacheButton, isBatchGenerating && styles.disabledButton]}
                onPress={() => handleBatchGenerate(testImages[selectedTestImageIndex])}
                activeOpacity={0.7}
                disabled={isBatchGenerating}
              >
                {isBatchGenerating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.generateCacheButtonText}>🔄 Generate Cache</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {isBatchGenerating && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Generating cache: {batchProgress.current} / {batchProgress.total}
              </Text>
              {batchProgress.item && (
                <Text style={styles.progressItem}>
                  Current: {batchProgress.item.name}
                </Text>
              )}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${(batchProgress.current / batchProgress.total) * 100}%` }
                  ]}
                />
              </View>
            </View>
          )}

          {testImages.length > 0 && (
            <ScrollView horizontal style={styles.testImagesScroll} showsHorizontalScrollIndicator={true}>
              {testImages.map((img, index) => (
                <View key={index} style={styles.testImageItem}>
                  <TouchableOpacity
                    onPress={() => setSelectedTestImageIndex(index)}
                    style={[
                      styles.testImageWrapper,
                      selectedTestImageIndex === index && styles.testImageSelected
                    ]}
                    activeOpacity={0.7}
                  >
                    <Image
                      source={{ uri: img.url }}
                      style={styles.testImageThumb}
                      resizeMode="cover"
                    />
                    {selectedTestImageIndex === index && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeThumbButton}
                    onPress={() => removeTestImage(index)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.removeThumbButtonText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {renderSection('looking', 'Edit look')}
        {renderSection('templates', 'Style Templates')}

        <View style={styles.exportSection}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportConfig}
            activeOpacity={0.7}
          >
            <Text style={styles.exportButtonText}>Export Configuration</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit/Add Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingId ? 'Edit Item' : 'Add New Item'}
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>ID</Text>
              <TextInput
                style={styles.input}
                value={formData.id}
                onChangeText={(text) => setFormData({ ...formData, id: text })}
                placeholder="e.g., better_looking"
                editable={!editingId}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="e.g., Better-Looking"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Prompt Modifier</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.prompt_modifier}
                onChangeText={(text) => setFormData({ ...formData, prompt_modifier: text })}
                placeholder="e.g., better-looking, enhanced features, more attractive"
                multiline
                numberOfLines={4}
              />
            </View>

            {currentType === 'templates' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Image File</Text>
                <TextInput
                  style={styles.input}
                  value={formData.image}
                  onChangeText={(text) => setFormData({ ...formData, image: text })}
                  placeholder="e.g., Cinematic.jpg"
                />
              </View>
            )}

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Enabled in App</Text>
                <Switch
                  value={formData.enabled}
                  onValueChange={(value) => setFormData({ ...formData, enabled: value })}
                  trackColor={{ false: '#d2d2d7', true: '#34c759' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={closeModal}
                activeOpacity={0.7}
              >
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={saveItem}
                activeOpacity={0.7}
              >
                <Text style={styles.addButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
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
  title: {
    fontSize: 48,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 21,
    color: '#6e6e73',
    textAlign: 'center',
  },
  cacheModeSection: {
    backgroundColor: '#fff3cd',
    borderRadius: 18,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#ffc107',
  },
  cacheModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheModeTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  cacheModeSubtitle: {
    fontSize: 14,
    color: '#6e6e73',
  },
  cacheModeSwitch: {
    transform: [{ scaleX: 1.2 }, { scaleY: 1.2 }],
  },
  testImagesSection: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    marginBottom: 24,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6e6e73',
    marginTop: 8,
    marginBottom: 16,
  },
  testImagesControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#0071e3',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  generateCacheButton: {
    backgroundColor: '#34c759',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginLeft: 12,
  },
  generateCacheButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  progressContainer: {
    backgroundColor: '#f5f5f7',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  progressItem: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#d2d2d7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#34c759',
    borderRadius: 4,
  },
  testImagesScroll: {
    marginTop: 12,
  },
  testImageItem: {
    marginRight: 16,
    alignItems: 'center',
  },
  testImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  testImageSelected: {
    borderColor: '#0071e3',
  },
  testImageThumb: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#0071e3',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  removeThumbButton: {
    marginTop: 8,
    backgroundColor: '#ff3b30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  removeThumbButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  addButton: {
    backgroundColor: '#0071e3',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 980,
  },
  addButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 20,
    minWidth: 300,
    flex: 1,
    flexBasis: '30%',
  },
  templateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  iconButton: {
    padding: 4,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  textButton: {
    backgroundColor: '#0071e3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  textButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  itemId: {
    fontSize: 13,
    color: '#6e6e73',
    marginBottom: 8,
  },
  itemPrompt: {
    fontSize: 14,
    color: '#1d1d1f',
    lineHeight: 21,
  },
  enabledStatus: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
  },
  enabled: {
    color: '#34c759',
  },
  disabled: {
    color: '#8e8e93',
  },
  testResultInline: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  testResultLabel: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 8,
    fontWeight: '500',
  },
  resultImageInline: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
  },
  cacheTimestamp: {
    fontSize: 11,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  exportSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  exportButton: {
    backgroundColor: '#1d1d1f',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 980,
  },
  exportButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    color: '#1d1d1f',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6e6e73',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d2d2d7',
    borderRadius: 8,
    fontSize: 15,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  secondaryButton: {
    backgroundColor: '#e8e8ed',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 980,
  },
  secondaryButtonText: {
    color: '#1d1d1f',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default ConfigAdmin;
