import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Image,
  Alert,
  Platform
} from 'react-native';
import { supabase } from '../services/supabaseClient';
import configService from '../services/configService';
import settingsService from '../services/settingsService';
import cacheService from '../services/cacheService';
import useAppStore from '../stores/appStore';

function ConfigAdmin() {
  console.log('[ConfigAdmin] Component rendering...');

  const [config, setConfig] = useState({ looking: {}, templates: {} });
  const [activeTab, setActiveTab] = useState('looking');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentType, setCurrentType] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    prompts: ['', '', ''],
    image_path: '',
    enabled: true
  });

  // Test images states
  const [testImages, setTestImages] = useState([]);
  const [selectedTestImageIndex, setSelectedTestImageIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Batch generation states
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, item: null });

  // Regeneration states
  const [regeneratingItems, setRegeneratingItems] = useState({});

  const cacheMode = useAppStore((state) => state.cacheMode);
  const setCacheMode = useAppStore((state) => state.setCacheMode);
  const refreshConfig = useAppStore((state) => state.refreshConfig);
  const selectedTestImageId = useAppStore((state) => state.selectedTestImageId);
  const setSelectedTestImageId = useAppStore((state) => state.setSelectedTestImageId);

  useEffect(() => {
    console.log('[ConfigAdmin] useEffect running...');
    loadConfig();
    loadExistingTestImages();
  }, []);

  const loadConfig = async () => {
    try {
      console.log('[ConfigAdmin] Loading config...');
      setLoading(true);
      setError(null);

      const [lookingData, templatesData] = await Promise.all([
        configService.loadItems('looking'),
        configService.loadItems('templates')
      ]);

      console.log('[ConfigAdmin] Config loaded:', {
        looking: Object.keys(lookingData || {}).length,
        templates: Object.keys(templatesData || {}).length
      });

      setConfig({
        looking: lookingData || {},
        templates: templatesData || {}
      });
    } catch (err) {
      console.error('[ConfigAdmin] Failed to load config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
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
        setSelectedTestImageId(loadedImages[0].id);
        console.log(`📌 Auto-selected most recent image: ${loadedImages[0].fileName}`);
      }
    } catch (error) {
      console.error('❌ Error loading existing test images:', error);
    }
  };

  const handleCacheModeToggle = async () => {
    try {
      const newMode = !cacheMode;
      const success = await settingsService.setGlobalCacheMode(newMode);

      if (success) {
        setCacheMode(newMode);
        console.log('✅ Global cache mode updated:', newMode);
      } else {
        Alert.alert('错误', '更新缓存模式失败，请重试');
      }
    } catch (err) {
      console.error('❌ Failed to toggle cache mode:', err);
      Alert.alert('错误', '更新缓存模式失败');
    }
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
              filePath,
              fileName: filePath.split('/').pop()
            };

            setTestImages([newImage, ...testImages]);
            setSelectedTestImageIndex(0);
            setSelectedTestImageId(testImageId);

            // Auto batch generate
            await handleBatchGenerate(newImage);
          };
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Upload error:', error);
          Alert.alert('上传失败', error.message);
        } finally {
          setIsUploadingImage(false);
        }
      }
    };
    input.click();
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
        Alert.alert(
          '批量生成完成',
          `✅ 成功生成 ${successCount} / ${results.total} 个提示词。${failedCount > 0 ? `\n⚠️ 失败: ${failedCount}` : ''}`
        );
      } else {
        const errorMsg = results.failed[0]?.error || 'Unknown error';
        Alert.alert(
          '批量生成失败',
          `❌ 所有生成都失败了。\n错误: ${errorMsg}\n\n请查看控制台了解详情。`
        );
      }
    } catch (error) {
      console.error('❌ Batch generation error:', error);
      Alert.alert('批量生成失败', error.message);
    } finally {
      setIsBatchGenerating(false);
      setBatchProgress({ current: 0, total: 0, item: null });
    }
  };

  const removeTestImage = async (index) => {
    const image = testImages[index];

    if (Platform.OS === 'web') {
      if (!window.confirm('确认删除\n\n这也将删除此图片的所有缓存生成。是否继续？')) return;
    } else {
      Alert.alert(
        '确认删除',
        '这也将删除此图片的所有缓存生成。是否继续？',
        [
          { text: '取消', style: 'cancel' },
          { text: '删除', style: 'destructive', onPress: async () => {
            await performRemoveTestImage(image, index);
          }}
        ]
      );
      return;
    }

    await performRemoveTestImage(image, index);
  };

  const performRemoveTestImage = async (image, index) => {
    try {
      console.log('🗑️ Deleting test image:', {
        fileName: image.fileName,
        filePath: image.filePath,
        id: image.id
      });

      const { error } = await supabase.storage
        .from('identity-photos')
        .remove([image.filePath]);

      if (error) {
        throw new Error(`Storage deletion failed: ${error.message}`);
      }

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

      if (newImages.length > 0) {
        setSelectedTestImageId(newImages[selectedTestImageIndex === index ? 0 : selectedTestImageIndex].id);
      }

      console.log('✅ Test image removed successfully');
      Alert.alert('成功', '测试图片删除成功！');
    } catch (error) {
      console.error('❌ Remove error:', error);
      Alert.alert('删除失败', error.message);
    }
  };

  const handleRegeneratePrompt = async (type, id, item) => {
    const itemKey = `${type}-${id}`;

    if (!testImages.length || selectedTestImageIndex >= testImages.length) {
      Alert.alert('错误', '请先上传测试图片');
      return;
    }

    const selectedImage = testImages[selectedTestImageIndex];

    setRegeneratingItems(prev => ({ ...prev, [itemKey]: true }));

    try {
      const promptText = item.prompts?.[0] || '';

      await cacheService.regeneratePrompt(
        selectedImage.publicUrl,
        selectedImage.id,
        type,
        id,
        promptText
      );

      Alert.alert('成功', '提示词重新生成成功！');
    } catch (error) {
      console.error('Regenerate error:', error);
      Alert.alert('重新生成失败', error.message);
    } finally {
      setRegeneratingItems(prev => ({ ...prev, [itemKey]: false }));
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
      return `style_id_${String(maxNumber + 1).padStart(3, '0')}`;
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
      return `template_id_${String(maxNumber + 1).padStart(3, '0')}`;
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
  };

  const saveItem = async () => {
    if (!formData.name.trim()) {
      Alert.alert('错误', '请输入名称');
      return;
    }

    if (currentType === 'looking' && !formData.prompts[0].trim()) {
      Alert.alert('错误', '请输入提示词');
      return;
    }

    if (currentType === 'templates' && !formData.prompts[0].trim()) {
      Alert.alert('错误', '请至少填写一个提示词');
      return;
    }

    const cleanedPrompts = currentType === 'templates'
      ? formData.prompts.filter(p => p.trim() !== '')
      : [formData.prompts[0]];

    const itemData = {
      name: formData.name,
      prompts: cleanedPrompts,
      image_path: currentType === 'templates' ? formData.image_path : null,
      enabled: formData.enabled,
      display_order: config[currentType][formData.id]?.display_order || Object.keys(config[currentType]).length
    };

    const success = await configService.saveItem(currentType, formData.id, itemData);

    if (!success) {
      Alert.alert('错误', '保存配置失败，请重试');
      return;
    }

    await loadConfig();
    await refreshConfig();
    closeModal();
  };

  const deleteItem = async (type, id) => {
    if (Platform.OS === 'web') {
      if (!window.confirm('确定要删除这个项目吗？')) return;
    } else {
      Alert.alert(
        '确认删除',
        '确定要删除这个项目吗？',
        [
          { text: '取消', style: 'cancel' },
          { text: '删除', style: 'destructive', onPress: async () => {
            await performDelete(id);
          }}
        ]
      );
      return;
    }

    await performDelete(id);
  };

  const performDelete = async (id) => {
    const success = await configService.deleteItem(id);

    if (!success) {
      Alert.alert('错误', '删除失败，请重试');
      return;
    }

    await loadConfig();
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
      Alert.alert('错误', '更新状态失败，请重试');
      return;
    }

    await loadConfig();
    await refreshConfig();
  };

  const moveItem = async (type, id, direction) => {
    const items = Object.entries(config[type]);
    const sortedItems = items.sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0));

    const currentIndex = sortedItems.findIndex(([key]) => key === id);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sortedItems.length) return;

    // Swap display_order
    const reorderedItems = [...sortedItems];
    [reorderedItems[currentIndex], reorderedItems[newIndex]] =
    [reorderedItems[newIndex], reorderedItems[currentIndex]];

    const itemsWithNewOrder = reorderedItems.map(([key, value], index) => ({
      id: key,
      ...value,
      display_order: index
    }));

    const success = await configService.updateOrder(type, itemsWithNewOrder);

    if (!success) {
      Alert.alert('错误', '更新顺序失败，请重试');
      return;
    }

    await loadConfig();
    await refreshConfig();
  };

  const getTemplateImageUrl = (imagePath) => {
    if (!imagePath) return null;

    const { data } = supabase.storage
      .from('identity-photos')
      .getPublicUrl(imagePath);

    return data.publicUrl;
  };

  console.log('[ConfigAdmin] Rendering with state:', {
    loading,
    error,
    activeTab,
    lookingCount: Object.keys(config.looking || {}).length,
    templatesCount: Object.keys(config.templates || {}).length,
    testImagesCount: testImages.length
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0071e3" />
        <Text style={styles.loadingText}>加载配置中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadConfig}>
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderConfigItems = (type) => {
    const items = config[type] || {};
    const itemsArray = Object.entries(items);
    const sortedItems = itemsArray.sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0));

    if (sortedItems.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>暂无配置项</Text>
        </View>
      );
    }

    return sortedItems.map(([key, item], index) => {
      const itemKey = `${type}-${key}`;
      const isRegenerating = regeneratingItems[itemKey];
      const canMoveUp = index > 0;
      const canMoveDown = index < sortedItems.length - 1;

      return (
        <View key={key} style={styles.itemCard}>
          {/* Template image preview */}
          {type === 'templates' && item.image_path && (
            <Image
              source={{ uri: getTemplateImageUrl(item.image_path) }}
              style={styles.templateImage}
              resizeMode="cover"
            />
          )}

          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.itemControls}>
                {/* Move buttons */}
                <View style={styles.moveButtons}>
                  <TouchableOpacity
                    style={[styles.moveButton, !canMoveUp && styles.moveButtonDisabled]}
                    onPress={() => canMoveUp && moveItem(type, key, 'up')}
                    disabled={!canMoveUp}
                  >
                    <Text style={styles.moveButtonText}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.moveButton, !canMoveDown && styles.moveButtonDisabled]}
                    onPress={() => canMoveDown && moveItem(type, key, 'down')}
                    disabled={!canMoveDown}
                  >
                    <Text style={styles.moveButtonText}>↓</Text>
                  </TouchableOpacity>
                </View>
                {/* Enable toggle */}
                <TouchableOpacity
                  style={[styles.enableToggle, item.enabled && styles.enableToggleActive]}
                  onPress={() => toggleEnabled(type, key)}
                >
                  <View style={[styles.enableThumb, item.enabled && styles.enableThumbActive]} />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.itemId}>{item.id}</Text>
          </View>

          <Text style={styles.itemPrompt} numberOfLines={3}>
            {Array.isArray(item.prompts) ? item.prompts[0] : item.prompt_modifier || ''}
          </Text>

          {type === 'templates' && item.prompts && item.prompts.length > 1 && (
            <Text style={styles.promptCount}>
              +{item.prompts.length - 1} 个额外提示词
            </Text>
          )}

          <View style={styles.itemActions}>
            <Text style={[styles.itemStatus, item.enabled && styles.itemStatusEnabled]}>
              {item.enabled ? '● 已启用' : '○ 已禁用'}
            </Text>
            <View style={styles.actionButtons}>
              {testImages.length > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, styles.regenerateButton]}
                  onPress={() => handleRegeneratePrompt(type, key, item)}
                  disabled={isRegenerating}
                >
                  {isRegenerating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.regenerateButtonText}>重新生成</Text>
                  )}
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.actionButton, styles.editButton]}
                onPress={() => openModal(type, key)}
              >
                <Text style={styles.editButtonText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => deleteItem(type, key)}
              >
                <Text style={styles.deleteButtonText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>管理设置</Text>
          <Text style={styles.subtitle}>管理 AI 角色和提示词配置</Text>
        </View>

        {/* Cache Mode Card */}
        <View style={styles.cacheModeCard}>
          <View style={styles.cacheModeContent}>
            <View style={styles.cacheModeInfo}>
              <Text style={styles.cacheModeTitle}>缓存模式</Text>
              <Text style={styles.cacheModeSubtitle}>
                {cacheMode ? '使用缓存结果（节省 API 额度）' : '使用实时 API 调用'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggle, cacheMode && styles.toggleActive]}
              onPress={handleCacheModeToggle}
            >
              <View style={[styles.toggleThumb, cacheMode && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Images Section */}
        <View style={styles.testImagesCard}>
          <View style={styles.testImagesHeader}>
            <Text style={styles.testImagesTitle}>测试图片（模特）</Text>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={handleImagePick}
              disabled={isUploadingImage || isBatchGenerating}
            >
              {isUploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.uploadButtonText}>📤 上传测试图片</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.testImagesSubtitle}>
            上传测试图片以预生成所有外观。结果已缓存以便更快测试。
          </Text>

          {isBatchGenerating && (
            <View style={styles.progressCard}>
              <Text style={styles.progressTitle}>
                生成缓存中: {batchProgress.current} / {batchProgress.total}
              </Text>
              {batchProgress.item && (
                <Text style={styles.progressSubtitle}>
                  当前: {batchProgress.item.name}
                </Text>
              )}
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${(batchProgress.current / batchProgress.total) * 100}%` }
                  ]}
                />
              </View>
            </View>
          )}

          {testImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.testImagesScroll}>
              <View style={styles.testImagesContainer}>
                {testImages.map((img, index) => (
                  <View key={index} style={styles.testImageWrapper}>
                    <TouchableOpacity
                      style={[
                        styles.testImageCard,
                        selectedTestImageIndex === index && styles.testImageCardSelected
                      ]}
                      onPress={() => {
                        setSelectedTestImageIndex(index);
                        setSelectedTestImageId(img.id);
                      }}
                    >
                      <Image
                        source={{ uri: img.url }}
                        style={styles.testImage}
                        resizeMode="cover"
                      />
                      {selectedTestImageIndex === index && (
                        <View style={styles.selectedBadge}>
                          <Text style={styles.selectedBadgeText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeTestImage(index)}
                    >
                      <Text style={styles.removeImageButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {testImages.length > 0 && testImages[selectedTestImageIndex] && (
            <TouchableOpacity
              style={styles.batchGenerateButton}
              onPress={() => handleBatchGenerate(testImages[selectedTestImageIndex])}
              disabled={isBatchGenerating}
            >
              {isBatchGenerating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.batchGenerateButtonText}>🔄 生成缓存</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'looking' && styles.tabActive]}
            onPress={() => setActiveTab('looking')}
          >
            <Text style={[styles.tabText, activeTab === 'looking' && styles.tabTextActive]}>
              Edit Look ({Object.keys(config.looking || {}).length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'templates' && styles.tabActive]}
            onPress={() => setActiveTab('templates')}
          >
            <Text style={[styles.tabText, activeTab === 'templates' && styles.tabTextActive]}>
              模板 ({Object.keys(config.templates || {}).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {activeTab === 'looking' ? 'Edit Look 配置' : '美学模板'}
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => openModal(activeTab)}
            >
              <Text style={styles.addButtonText}>+ 添加新项</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.itemsContainer}>
            {renderConfigItems(activeTab)}
          </View>
        </View>
      </ScrollView>

      {/* Edit/Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalTitle}>
                {editingId ? '编辑项目' : '添加新项目'}
              </Text>

              {/* ID Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>ID {!editingId && '(自动生成)'}</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formData.id}
                  editable={false}
                  placeholder="自动生成"
                />
              </View>

              {/* Name Field */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>名称 *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="例如: Better-Looking"
                />
              </View>

              {/* Prompts Fields */}
              {currentType === 'templates' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>提示词 1 (必填) *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.prompts[0]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[0] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="第一个提示词..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>提示词 2 (可选)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.prompts[1]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[1] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="第二个提示词..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>提示词 3 (可选)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.prompts[2]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[2] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="第三个提示词..."
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>图片路径 (可选)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.image_path}
                      onChangeText={(text) => setFormData({ ...formData, image_path: text })}
                      placeholder="例如: anonymous/style-templates/example.jpg"
                    />
                    <Text style={styles.helpText}>
                      提示: 需要先上传图片到 Supabase Storage
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.label}>提示词 *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.prompts[0]}
                    onChangeText={(text) => {
                      const newPrompts = [...formData.prompts];
                      newPrompts[0] = text;
                      setFormData({ ...formData, prompts: newPrompts });
                    }}
                    placeholder="例如: better-looking, enhanced features, more attractive"
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}

              {/* Enabled Toggle */}
              <View style={styles.formGroup}>
                <View style={styles.enabledRow}>
                  <Text style={styles.label}>在应用中启用</Text>
                  <TouchableOpacity
                    style={[styles.toggle, formData.enabled && styles.toggleActive]}
                    onPress={() => setFormData({ ...formData, enabled: !formData.enabled })}
                  >
                    <View style={[styles.toggleThumb, formData.enabled && styles.toggleThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveItem}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    padding: 20,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6e6e73',
  },
  cacheModeCard: {
    backgroundColor: '#fff9e6',
    borderWidth: 2,
    borderColor: '#f5c542',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cacheModeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cacheModeInfo: {
    flex: 1,
  },
  cacheModeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  cacheModeSubtitle: {
    fontSize: 14,
    color: '#6e6e73',
  },
  testImagesCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  testImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testImagesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  testImagesSubtitle: {
    fontSize: 14,
    color: '#6e6e73',
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#0071e3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  progressCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4,
  },
  progressSubtitle: {
    fontSize: 12,
    color: '#6e6e73',
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e7',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34c759',
    borderRadius: 4,
  },
  testImagesScroll: {
    marginBottom: 16,
  },
  testImagesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  testImageWrapper: {
    alignItems: 'center',
  },
  testImageCard: {
    width: 120,
    height: 120,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  testImageCardSelected: {
    borderColor: '#0071e3',
  },
  testImage: {
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
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  removeImageButton: {
    backgroundColor: '#ff3b30',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  removeImageButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  batchGenerateButton: {
    backgroundColor: '#34c759',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  batchGenerateButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  toggle: {
    width: 51,
    height: 31,
    borderRadius: 16,
    backgroundColor: '#e5e5e7',
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#0071e3',
  },
  toggleThumb: {
    width: 27,
    height: 27,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#0071e3',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6e6e73',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e7',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1d1d1f',
  },
  addButton: {
    backgroundColor: '#0071e3',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsContainer: {
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#f5f5f7',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  templateImage: {
    width: '30%',
    aspectRatio: 9 / 16,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: 'center',
  },
  itemHeader: {
    marginBottom: 8,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1d1d1f',
    flex: 1,
  },
  itemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  moveButton: {
    width: 28,
    height: 28,
    backgroundColor: '#e5e5e7',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveButtonDisabled: {
    opacity: 0.3,
  },
  moveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  enableToggle: {
    width: 40,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e5e7',
    padding: 2,
    justifyContent: 'center',
  },
  enableToggleActive: {
    backgroundColor: '#34c759',
  },
  enableThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  enableThumbActive: {
    transform: [{ translateX: 16 }],
  },
  itemId: {
    fontSize: 13,
    color: '#6e6e73',
  },
  itemPrompt: {
    fontSize: 14,
    color: '#1d1d1f',
    lineHeight: 20,
    marginBottom: 8,
  },
  promptCount: {
    fontSize: 12,
    color: '#0071e3',
    marginBottom: 8,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  itemStatus: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6e6e73',
  },
  itemStatusEnabled: {
    color: '#34c759',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  regenerateButton: {
    backgroundColor: '#34c759',
  },
  regenerateButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: '#0071e3',
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6e6e73',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff3b30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6e6e73',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#0071e3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6e6e73',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalScroll: {
    padding: 20,
    maxHeight: 600,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6e6e73',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#d2d2d7',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1d1d1f',
  },
  inputDisabled: {
    backgroundColor: '#e5e5e7',
    color: '#6e6e73',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 4,
  },
  enabledRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e5e7',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e5e7',
  },
  cancelButtonText: {
    color: '#1d1d1f',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#0071e3',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ConfigAdmin;
