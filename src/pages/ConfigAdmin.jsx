import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Modal, Image, Switch, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabaseClient';
import cacheService from '../services/cacheService';
import settingsService from '../services/settingsService';
import configService from '../services/configService';
import useAppStore from '../stores/appStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Get template image URL from relative path
const getTemplateImageUrl = (imagePath) => {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from('identity-photos')
    .getPublicUrl(imagePath);

  return data.publicUrl;
};

// Sortable Item Component for drag-and-drop
function SortableItemCard({ id, item, type, onDelete, onEdit, onToggle, onRegenerate, onRestore, isLoading, cachedResult, isDeleted }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isTemplate = type === 'templates';

  return (
    <View ref={setNodeRef} style={[styles.itemCard, isTemplate && styles.itemCardTemplate, isDeleted && styles.itemCardDeleted, style]}>
      {/* Drag handle - hidden for deleted items */}
      {!isDeleted && (
        <View {...listeners} {...attributes} style={styles.dragHandle}>
          <Text style={styles.dragHandleIcon}>⋮⋮</Text>
        </View>
      )}

      {item.image_path && (
        <Image
          source={{ uri: getTemplateImageUrl(item.image_path) }}
          style={isTemplate ? styles.templateImageVertical : styles.templateImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.itemHeader}>
        <Text style={styles.itemName}>{item.name}</Text>
        <View style={styles.itemActions}>
          {isDeleted ? (
            <TouchableOpacity
              onPress={() => onRestore(id)}
              style={[styles.textButton, styles.restoreButton]}
              activeOpacity={0.7}
            >
              <Text style={styles.textButtonText}>Restore</Text>
            </TouchableOpacity>
          ) : (
            <>
              <Switch
                value={item.enabled}
                onValueChange={() => onToggle(type, id)}
                trackColor={{ false: '#d2d2d7', true: '#34c759' }}
                thumbColor="#fff"
                style={styles.switch}
              />
              <TouchableOpacity
                onPress={() => onRegenerate(type, id, item)}
                style={styles.textButton}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.textButtonText}>Regenerate</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onEdit(type, id)}
                style={styles.textButton}
                activeOpacity={0.7}
              >
                <Text style={styles.textButtonText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(type, id)}
                style={[styles.textButton, styles.deleteButton]}
                activeOpacity={0.7}
              >
                <Text style={styles.textButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      <Text style={styles.itemPrompt}>
        {isTemplate && item.prompts ? item.prompts[0] : item.prompts?.[0] || ''}
      </Text>

      {!isDeleted && (
        <Text style={[styles.enabledStatus, item.enabled ? styles.enabled : styles.disabled]}>
          {item.enabled ? '● Enabled' : '○ Disabled'}
        </Text>
      )}

      {isDeleted && (
        <Text style={styles.deletedBadge}>Deleted</Text>
      )}

      {cachedResult && cachedResult.generatedUrl && !isDeleted && (
        <View style={styles.testResultInline}>
          <Text style={styles.testResultLabel}>Cached Result:</Text>
          <Image
            source={{ uri: cachedResult.generatedUrl }}
            style={isTemplate ? styles.resultImageInlineVertical : styles.resultImageInline}
            resizeMode="contain"
          />
          <Text style={styles.cacheTimestamp}>
            Updated: {new Date(cachedResult.updatedAt).toLocaleString()}
          </Text>
        </View>
      )}
    </View>
  );
}

function ConfigAdmin() {
  const [config, setConfig] = useState({ looking: {}, templates: {} });
  const [activeTab, setActiveTab] = useState('looking'); // 'looking', 'templates'
  const [modalVisible, setModalVisible] = useState(false);
  const [currentType, setCurrentType] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    prompts: ['', '', ''],
    image_path: '',
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
  const refreshConfig = useAppStore((state) => state.refreshConfig);

  // Batch generation state
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, item: null });

  // Cached results for display
  const [cachedResults, setCachedResults] = useState({});

  // Selected Edit Look for template testing
  const [selectedEditLookId, setSelectedEditLookId] = useState(null);
  const [selectedEditLookUrl, setSelectedEditLookUrl] = useState(null);

  // Template image upload state
  const [isUploadingTemplateImage, setIsUploadingTemplateImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);

  // Test results - keyed by item id
  const [testingInProgress, setTestingInProgress] = useState({});

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const loadConfig = async () => {
    try {
      // Load from Supabase using new API
      const [lookingData, templatesData] = await Promise.all([
        configService.loadItems('looking'),
        configService.loadItems('templates')
      ]);

      setConfig({
        looking: lookingData,
        templates: templatesData
      });

      console.log('✅ Configuration loaded from Supabase');
    } catch (error) {
      console.error('Failed to load config from Supabase:', error);
    }
  };

  const loadCachedResults = async (testImageId) => {
    try {
      const results = await cacheService.getCachedResults(testImageId);
      setCachedResults(results);

      // Auto-select the first Edit Look for template testing
      const lookingResults = results.looking || {};
      const lookingIds = Object.keys(lookingResults);
      if (lookingIds.length > 0) {
        const firstEditLookId = lookingIds[0];
        const firstEditLookData = lookingResults[firstEditLookId];
        setSelectedEditLookId(firstEditLookId);
        setSelectedEditLookUrl(firstEditLookData.generatedUrl);
        console.log('📌 Auto-selected Edit Look for templates:', firstEditLookId);
      } else {
        setSelectedEditLookId(null);
        setSelectedEditLookUrl(null);
      }

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

      if (error.code === 'PGRST205' || error.message?.includes('cached_generations')) {
        alert('⚠️ Database table not found. Please ensure the migration has been applied and the PostgREST schema cache has been refreshed.');
      }

      setCachedResults({ looking: {}, templates: {} });
      setSelectedEditLookId(null);
      setSelectedEditLookUrl(null);
    }
  };

  const handleCacheModeToggle = async (enabled) => {
    try {
      const success = await settingsService.setGlobalCacheMode(enabled);

      if (success) {
        setCacheMode(enabled);
        console.log('✅ Global cache mode updated:', enabled);
      } else {
        alert('Failed to update cache mode. Please try again.');
      }
    } catch (error) {
      console.error('❌ Failed to toggle cache mode:', error);
      alert('Failed to update cache mode. Please try again.');
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

      const loadedImages = files.map(file => {
        const timestamp = file.name.split('-')[0];
        const testImageId = `test-${timestamp}`;

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

      setTestImages(loadedImages);

      if (loadedImages.length > 0) {
        setSelectedTestImageIndex(0);
        console.log(`📌 Auto-selected most recent image: ${loadedImages[0].fileName}`);
      }
    } catch (error) {
      console.error('❌ Error loading existing test images:', error);
    }
  };

  const generateNextStyleId = (type) => {
    const existingIds = Object.keys(config[type] || {});

    if (type === 'looking') {
      const numbers = existingIds
        .filter(id => id.startsWith('style_id_'))
        .map(id => {
          const match = id.match(/style_id_(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      const nextNumber = maxNumber + 1;

      return `style_id_${String(nextNumber).padStart(3, '0')}`;
    }

    if (type === 'templates') {
      const numbers = existingIds
        .filter(id => id.startsWith('template_id_'))
        .map(id => {
          const match = id.match(/template_id_(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => !isNaN(num));

      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      const nextNumber = maxNumber + 1;

      return `template_id_${String(nextNumber).padStart(3, '0')}`;
    }

    return '';
  };

  const openModal = (type, id = null) => {
    setCurrentType(type);
    setEditingId(id);

    if (id) {
      const item = config[type][id];
      setFormData({
        id: item.id,
        name: item.name,
        prompts: item.prompts || ['', '', ''],
        image_path: item.image_path || '',
        enabled: item.enabled !== undefined ? item.enabled : true
      });
    } else {
      const autoId = generateNextStyleId(type);

      setFormData({
        id: autoId,
        name: '',
        prompts: ['', '', ''],
        image_path: '',
        enabled: true
      });
    }

    setUploadedImagePreview(null);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setFormData({
      id: '',
      name: '',
      prompts: ['', '', ''],
      image_path: '',
      enabled: true
    });
    setEditingId(null);
    setUploadedImagePreview(null);
  };

  const saveItem = async () => {
    // Prepare prompts array
    const cleanedPrompts = currentType === 'templates'
      ? formData.prompts.filter(p => p.trim() !== '')
      : [formData.prompts[0]]; // Edit Look only uses first prompt

    const itemData = {
      name: formData.name,
      prompts: cleanedPrompts,
      image_path: currentType === 'templates' ? formData.image_path : null,
      enabled: formData.enabled,
      display_order: config[currentType][formData.id]?.display_order || Object.keys(config[currentType]).length
    };

    // Save to Supabase
    const success = await configService.saveItem(currentType, formData.id, itemData);

    if (!success) {
      alert('Warning: Failed to save configuration to database. Please try again.');
      return;
    }

    // Refresh local config
    await loadConfig();
    await refreshConfig();

    closeModal();
  };

  const deleteItem = async (type, id) => {
    const confirmed = window.confirm('Confirm Delete\n\nAre you sure you want to delete this item?');

    if (!confirmed) return;

    const success = await configService.deleteItem(id);

    if (!success) {
      alert('Failed to delete item. Please try again.');
      return;
    }

    // Refresh local config
    await loadConfig();
    await refreshConfig();
  };

  const restoreItem = async (id) => {
    const success = await configService.restoreItem(id);

    if (!success) {
      alert('Failed to restore item. Please try again.');
      return;
    }

    // Refresh configs
    await loadConfig();
    await loadDeletedItems();
    await refreshConfig();
  };

  const toggleEnabled = async (type, id) => {
    const item = config[type][id];
    const updatedItem = {
      ...item,
      enabled: !item.enabled
    };

    const success = await configService.saveItem(type, id, updatedItem);

    if (!success) {
      alert('Failed to toggle enabled status. Please try again.');
      return;
    }

    // Refresh local config
    await loadConfig();
    await refreshConfig();
  };

  const handleDragEnd = async (event, type) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const items = Object.entries(config[type]);
    const sortedItems = items.sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0));

    const oldIndex = sortedItems.findIndex(([key]) => key === active.id);
    const newIndex = sortedItems.findIndex(([key]) => key === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const reorderedItems = arrayMove(sortedItems, oldIndex, newIndex);

    // Update display_order for all items
    const itemsWithNewOrder = reorderedItems.map(([key, value], index) => ({
      id: key,
      ...value,
      display_order: index
    }));

    // Save order to Supabase
    const success = await configService.updateOrder(type, itemsWithNewOrder);

    if (!success) {
      alert('Failed to update order. Please try again.');
      return;
    }

    // Refresh local config
    await loadConfig();
    await refreshConfig();
    console.log(`✅ Updated order for ${type}`);
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

      const successCount = results.success.length;
      const failedCount = results.failed.length;

      console.log('✅ Batch generation complete:', { successCount, failedCount });

      if (successCount > 0 || failedCount === 0) {
        alert(`Batch Generation Complete\n\n✅ Successfully generated ${successCount} out of ${results.total} prompts.${failedCount > 0 ? `\n⚠️ Failed: ${failedCount}` : ''}`);
      } else {
        const errorMsg = results.failed[0]?.error || 'Unknown error';
        alert(`Batch Generation Failed\n\n❌ All generations failed.\nError: ${errorMsg}\n\nPlease check console for details.`);
      }

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

      const { data, error } = await supabase.storage
        .from('identity-photos')
        .remove([image.filePath]);

      console.log('Storage delete response:', { data, error });

      if (error) {
        console.error('❌ Storage delete error:', error);
        throw new Error(`Storage deletion failed: ${error.message}`);
      }

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

      try {
        await cacheService.deleteCacheForTestImage(image.id);
        console.log('✅ Deleted cached generations');
      } catch (cacheError) {
        console.warn('⚠️ Failed to delete cache, but continuing:', cacheError);
      }

      const newImages = testImages.filter((_, i) => i !== index);
      setTestImages(newImages);

      if (selectedTestImageIndex >= newImages.length) {
        setSelectedTestImageIndex(Math.max(0, newImages.length - 1));
      }

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
      const promptText = item.prompts?.[0] || '';

      if (type === 'templates') {
        if (!selectedEditLookUrl) {
          alert('Error\n\nPlease generate Edit Look cache first or select an Edit Look');
          setTestingInProgress(prev => ({ ...prev, [itemKey]: false }));
          return;
        }

        console.log('📸 Regenerating template using Edit Look image:', {
          editLookUrl: selectedEditLookUrl,
          editLookId: selectedEditLookId
        });

        await cacheService.regeneratePromptWithEditLook(
          selectedEditLookUrl,
          selectedImage.id,
          id,
          promptText
        );

        await loadCachedResults(selectedImage.id);

        alert('Success\n\nTemplate regenerated using Edit Look image!');
      } else {
        await cacheService.regeneratePrompt(
          selectedImage.publicUrl,
          selectedImage.id,
          type,
          id,
          promptText
        );

        await loadCachedResults(selectedImage.id);

        alert('Success\n\nPrompt regenerated successfully!');
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      alert(`Regenerate Failed\n\n${error.message}`);
    } finally {
      setTestingInProgress(prev => ({ ...prev, [itemKey]: false }));
    }
  };

  const handleEditLookSelection = (editLookId) => {
    setSelectedEditLookId(editLookId);
    const cachedLooking = cachedResults.looking || {};
    if (cachedLooking[editLookId]) {
      setSelectedEditLookUrl(cachedLooking[editLookId].generatedUrl);
      console.log('✅ Selected Edit Look for templates:', editLookId);
    }
  };

  const handleTemplateImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/jpeg,image/png,image/webp';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        alert('File too large. Maximum size is 5MB.');
        return;
      }

      setIsUploadingTemplateImage(true);

      try {
        const fileExt = file.name.split('.').pop().toLowerCase();
        const baseName = file.name
          .replace(/\.[^/.]+$/, '')
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '');

        const fileName = `${baseName}.${fileExt}`;
        const filePath = `anonymous/style-templates/${fileName}`;

        const { data, error } = await supabase.storage
          .from('identity-photos')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true
          });

        if (error) throw error;

        setFormData({ ...formData, image_path: filePath });

        const reader = new FileReader();
        reader.onload = (e) => setUploadedImagePreview(e.target.result);
        reader.readAsDataURL(file);

        console.log('✅ Image uploaded:', filePath);
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Upload failed: ${error.message}`);
      } finally {
        setIsUploadingTemplateImage(false);
      }
    };
    input.click();
  };

  const renderEditLookSelector = () => {
    const cachedLooking = cachedResults.looking || {};
    const lookingItems = Object.entries(config.looking || {});

    if (lookingItems.length === 0) {
      return null;
    }

    return (
      <View style={styles.editLookSelectorSection}>
        <Text style={styles.sectionTitle}>Select Edit Look for Templates</Text>
        <Text style={styles.sectionSubtitle}>
          Choose which Edit Look result to use as input for Aesthetic Templates
        </Text>

        <View style={styles.editLookOptionsContainer}>
          {lookingItems
            .sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0))
            .map(([key, item]) => {
              const cachedResult = cachedLooking[key];
              const isSelected = selectedEditLookId === key;

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.editLookOption,
                    isSelected && styles.editLookOptionSelected
                  ]}
                  onPress={() => handleEditLookSelection(key)}
                  activeOpacity={0.7}
                >
                  {cachedResult && cachedResult.generatedUrl && (
                    <Image
                      source={{ uri: cachedResult.generatedUrl }}
                      style={styles.editLookThumbnail}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={[
                    styles.editLookOptionName,
                    isSelected && styles.editLookOptionNameSelected
                  ]}>
                    {item.name}
                  </Text>
                  {isSelected && (
                    <View style={styles.editLookCheckmark}>
                      <Text style={styles.editLookCheckmarkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
        </View>
      </View>
    );
  };

  const renderSection = (type, title) => {
    const items = config[type] || {};
    const itemsArray = Object.entries(items);
    const sortedItems = itemsArray.sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0));
    const itemIds = sortedItems.map(([key]) => key);

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

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(event, type)}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <View style={styles.itemsGrid}>
              {sortedItems.map(([key, item]) => {
                const itemKey = `${type}-${key}`;
                const isLoading = testingInProgress[itemKey];
                const cachedResult = cachedResults[type] && cachedResults[type][key];

                return (
                  <SortableItemCard
                    key={key}
                    id={key}
                    item={item}
                    type={type}
                    onDelete={deleteItem}
                    onEdit={openModal}
                    onToggle={toggleEnabled}
                    onRegenerate={handleRegeneratePrompt}
                    onRestore={restoreItem}
                    isLoading={isLoading || !testImages.length}
                    cachedResult={cachedResult}
                    isDeleted={false}
                  />
                );
              })}
            </View>
          </SortableContext>
        </DndContext>
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
              onValueChange={handleCacheModeToggle}
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

        {/* Tab Navigation */}
        <View style={styles.tabNavigation}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'looking' && styles.tabButtonActive]}
            onPress={() => setActiveTab('looking')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'looking' && styles.tabButtonTextActive]}>
              Edit Look
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'templates' && styles.tabButtonActive]}
            onPress={() => setActiveTab('templates')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabButtonText, activeTab === 'templates' && styles.tabButtonTextActive]}>
              Templates
            </Text>
          </TouchableOpacity>
        </View>

        {/* Render content based on active tab */}
        {activeTab === 'looking' && renderSection('looking', 'Edit Look')}
        {activeTab === 'looking' && renderEditLookSelector()}
        {activeTab === 'templates' && (
          <>
            {renderEditLookSelector()}
            {renderSection('templates', 'Aesthetic Templates')}
          </>
        )}
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
            <ScrollView style={styles.modalScrollContent}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Item' : 'Add New Item'}
              </Text>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  ID {!editingId && '(Auto-generated)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formData.id}
                  onChangeText={(text) => setFormData({ ...formData, id: text })}
                  placeholder="Auto-generated"
                  editable={false}
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

              {/* Prompt inputs - 1 for Edit Look, 3 for Templates */}
              {currentType === 'templates' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Prompt 1 (Required)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.prompts[0]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[0] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="First prompt..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Prompt 2 (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.prompts[1]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[1] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="Second prompt..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>Prompt 3 (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.prompts[2]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[2] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="Third prompt..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Prompt</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.prompts[0]}
                    onChangeText={(text) => {
                      const newPrompts = [...formData.prompts];
                      newPrompts[0] = text;
                      setFormData({ ...formData, prompts: newPrompts });
                    }}
                    placeholder="e.g., better-looking, enhanced features, more attractive, photorealistic, realistic lighting, high detail, lifelike"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {currentType === 'templates' && (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Template Image</Text>
                  <View style={styles.imageUploadContainer}>
                    <TextInput
                      style={[styles.input, styles.inputDisabled]}
                      value={formData.image_path}
                      placeholder="Upload an image..."
                      editable={false}
                    />
                    <TouchableOpacity
                      style={[styles.uploadButton, isUploadingTemplateImage && styles.disabledButton]}
                      onPress={handleTemplateImageUpload}
                      disabled={isUploadingTemplateImage}
                      activeOpacity={0.7}
                    >
                      {isUploadingTemplateImage ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.uploadButtonText}>Upload</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {(formData.image_path || uploadedImagePreview) && (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{
                          uri: uploadedImagePreview || getTemplateImageUrl(formData.image_path)
                        }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                    </View>
                  )}
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
            </ScrollView>

            <View style={styles.modalFooter}>
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  uploadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
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
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#0071e3',
  },
  tabButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6e6e73',
  },
  tabButtonTextActive: {
    color: 'white',
  },
  editLookSelectorSection: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 32,
    marginBottom: 24,
  },
  editLookOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 16,
  },
  editLookOption: {
    flex: 1,
    flexBasis: '20%',
    minWidth: 140,
    backgroundColor: '#f5f5f7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e5e7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLookOptionSelected: {
    borderColor: '#0071e3',
    backgroundColor: '#e3f2ff',
  },
  editLookThumbnail: {
    width: 80,
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  editLookOptionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  editLookOptionNameSelected: {
    color: '#0071e3',
  },
  editLookCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#0071e3',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editLookCheckmarkText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
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
    position: 'relative',
  },
  itemCardTemplate: {
    flexBasis: '48%',
    minWidth: 280,
  },
  itemCardDeleted: {
    opacity: 0.6,
    backgroundColor: '#ffe5e5',
  },
  dragHandle: {
    position: 'absolute',
    top: 8,
    left: 8,
    padding: 8,
    cursor: 'grab',
    zIndex: 10,
  },
  dragHandleIcon: {
    fontSize: 20,
    color: '#8e8e93',
    fontWeight: 'bold',
    userSelect: 'none',
  },
  templateImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 12,
  },
  templateImageVertical: {
    width: '25%',
    aspectRatio: 9 / 16,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'center',
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
  restoreButton: {
    backgroundColor: '#34c759',
  },
  textButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
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
  deletedBadge: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: '500',
    color: '#ff3b30',
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
  resultImageInlineVertical: {
    width: '25%',
    aspectRatio: 9 / 16,
    borderRadius: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  cacheTimestamp: {
    fontSize: 11,
    color: '#8e8e93',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 16,
    color: '#6e6e73',
    textAlign: 'center',
    paddingVertical: 40,
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
    width: '95%',
    maxWidth: 900,
    height: '95%',
    maxHeight: '95vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalScrollContent: {
    flex: 1,
    padding: 32,
    paddingBottom: 20,
    overflowY: 'auto',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 20,
    paddingRight: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
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
  inputDisabled: {
    backgroundColor: '#f5f5f7',
    color: '#8e8e93',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    // Removed - using modalFooter instead
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
  imageUploadContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imagePreviewContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  imagePreview: {
    width: 100,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e7',
  },
});

export default ConfigAdmin;
