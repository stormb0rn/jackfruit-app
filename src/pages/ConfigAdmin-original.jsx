import React, { useState, useEffect } from 'react';
import { Image, ActivityIndicator as RNActivityIndicator } from 'react-native';
import {
  TamaguiProvider,
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Switch,
  ScrollView,
  Dialog,
  Card,
  Spinner,
  Separator,
  H1,
  H2,
  H3,
  Paragraph,
  Sheet
} from 'tamagui';
import tamaguiConfig from '../../tamagui.config';
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
function SortableItemCard({
  id,
  item,
  type,
  onDelete,
  onEdit,
  onToggle,
  onRegenerate,
  onRestore,
  isLoading,
  cachedResult,
  isDeleted
}) {
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
    <Card
      ref={setNodeRef}
      style={style}
      elevate
      bordered
      backgroundColor={isDeleted ? '$red2' : '$cardBackground'}
      padding="$4"
      borderRadius="$4"
      opacity={isDeleted ? 0.6 : 1}
      minWidth={isTemplate ? 280 : 300}
      flex={1}
      flexBasis={isTemplate ? '48%' : '30%'}
      position="relative"
    >
      {/* Drag handle - hidden for deleted items */}
      {!isDeleted && (
        <XStack
          {...listeners}
          {...attributes}
          position="absolute"
          top="$2"
          left="$2"
          padding="$2"
          cursor="grab"
          zIndex={10}
        >
          <Text fontSize="$6" color="$gray10" fontWeight="bold">⋮⋮</Text>
        </XStack>
      )}

      {item.image_path && (
        <Image
          source={{ uri: getTemplateImageUrl(item.image_path) }}
          style={{
            width: isTemplate ? '25%' : '100%',
            aspectRatio: isTemplate ? 9 / 16 : 16 / 9,
            height: isTemplate ? undefined : 120,
            borderRadius: 8,
            marginBottom: 12,
            alignSelf: isTemplate ? 'center' : 'stretch',
          }}
          resizeMode="cover"
        />
      )}

      <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
        <Text fontSize="$5" fontWeight="600" color="$color" flex={1}>
          {item.name}
        </Text>
        <XStack gap="$2" alignItems="center">
          {isDeleted ? (
            <Button
              onPress={() => onRestore(id)}
              size="$2"
              theme="green"
              chromeless
            >
              恢复
            </Button>
          ) : (
            <>
              <Switch
                checked={item.enabled}
                onCheckedChange={() => onToggle(type, id)}
                size="$2"
              >
                <Switch.Thumb animation="quick" />
              </Switch>
              <Button
                onPress={() => onRegenerate(type, id, item)}
                size="$2"
                theme="blue"
                disabled={isLoading}
                chromeless
              >
                {isLoading ? <Spinner size="small" /> : '重新生成'}
              </Button>
              <Button
                onPress={() => onEdit(type, id)}
                size="$2"
                theme="blue"
                chromeless
              >
                编辑
              </Button>
              <Button
                onPress={() => onDelete(type, id)}
                size="$2"
                theme="red"
                chromeless
              >
                删除
              </Button>
            </>
          )}
        </XStack>
      </XStack>

      <Text fontSize="$3" color="$color" lineHeight="$1">
        {isTemplate && item.prompts ? item.prompts[0] : item.prompts?.[0] || ''}
      </Text>

      {!isDeleted && (
        <Text
          fontSize="$2"
          marginTop="$2"
          fontWeight="500"
          color={item.enabled ? '$green10' : '$gray10'}
        >
          {item.enabled ? '● 已启用' : '○ 已禁用'}
        </Text>
      )}

      {isDeleted && (
        <Text fontSize="$2" marginTop="$2" fontWeight="500" color="$red10">
          已删除
        </Text>
      )}

      {cachedResult && !isDeleted && (
        <YStack marginTop="$4" paddingTop="$4" borderTopWidth={1} borderTopColor="$borderColor">
          <Text fontSize="$2" color="$gray11" marginBottom="$2" fontWeight="500">
            缓存结果：
          </Text>

          {isTemplate && cachedResult.generatedUrls && cachedResult.generatedUrls.length > 1 ? (
            <XStack gap="$2" width="100%" justifyContent="space-between">
              {cachedResult.generatedUrls.map((url, index) => (
                <YStack key={index} flex={1} alignItems="center">
                  <Image
                    source={{ uri: url }}
                    style={{
                      width: '100%',
                      aspectRatio: 9 / 16,
                      borderRadius: 8,
                      backgroundColor: '#f0f0f0',
                    }}
                    resizeMode="contain"
                  />
                  <Text fontSize="$1" color="$gray10" marginTop="$1" fontWeight="600">
                    #{index + 1}
                  </Text>
                </YStack>
              ))}
            </XStack>
          ) : (
            <Image
              source={{ uri: cachedResult.generatedUrl || cachedResult.generatedUrls?.[0] }}
              style={{
                width: isTemplate ? '25%' : '100%',
                aspectRatio: isTemplate ? 9 / 16 : 16 / 9,
                height: isTemplate ? undefined : 200,
                borderRadius: 8,
                marginBottom: 8,
                alignSelf: isTemplate ? 'center' : 'stretch',
              }}
              resizeMode="contain"
            />
          )}

          <Text fontSize="$1" color="$gray10" fontStyle="italic">
            更新时间: {new Date(cachedResult.updatedAt).toLocaleString()}
          </Text>
        </YStack>
      )}
    </Card>
  );
}

function ConfigAdmin() {
  const [config, setConfig] = useState({ looking: {}, templates: {} });
  const [activeTab, setActiveTab] = useState('looking');
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

  const [testImages, setTestImages] = useState([]);
  const [selectedTestImageIndex, setSelectedTestImageIndex] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const cacheMode = useAppStore((state) => state.cacheMode);
  const setCacheMode = useAppStore((state) => state.setCacheMode);
  const selectedTestImageId = useAppStore((state) => state.selectedTestImageId);
  const setSelectedTestImageId = useAppStore((state) => state.setSelectedTestImageId);
  const refreshConfig = useAppStore((state) => state.refreshConfig);

  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, item: null });
  const [cachedResults, setCachedResults] = useState({});
  const [selectedEditLookId, setSelectedEditLookId] = useState(null);
  const [selectedEditLookUrl, setSelectedEditLookUrl] = useState(null);
  const [isUploadingTemplateImage, setIsUploadingTemplateImage] = useState(false);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [testingInProgress, setTestingInProgress] = useState({});

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
    if (testImages.length > 0 && testImages[selectedTestImageIndex]) {
      const currentImage = testImages[selectedTestImageIndex];
      loadCachedResults(currentImage.id);
      setSelectedTestImageId(currentImage.id);
    }
  }, [selectedTestImageIndex, testImages]);

  const loadConfig = async () => {
    try {
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
      alert('Warning: Failed to save configuration to database. Please try again.');
      return;
    }

    await loadConfig();
    await refreshConfig();

    closeModal();
  };

  const deleteItem = async (type, id) => {
    const confirmed = window.confirm('确认删除\n\n确定要删除这个项目吗？');

    if (!confirmed) return;

    const success = await configService.deleteItem(id);

    if (!success) {
      alert('Failed to delete item. Please try again.');
      return;
    }

    await loadConfig();
    await refreshConfig();
  };

  const restoreItem = async (id) => {
    const success = await configService.restoreItem(id);

    if (!success) {
      alert('Failed to restore item. Please try again.');
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
      alert('Failed to toggle enabled status. Please try again.');
      return;
    }

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

    const itemsWithNewOrder = reorderedItems.map(([key, value], index) => ({
      id: key,
      ...value,
      display_order: index
    }));

    const success = await configService.updateOrder(type, itemsWithNewOrder);

    if (!success) {
      alert('Failed to update order. Please try again.');
      return;
    }

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
          alert(`上传失败\n\n${error.message}`);
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
        alert(`批量生成完成\n\n✅ 成功生成 ${successCount} / ${results.total} 个提示词。${failedCount > 0 ? `\n⚠️ 失败: ${failedCount}` : ''}`);
      } else {
        const errorMsg = results.failed[0]?.error || 'Unknown error';
        alert(`批量生成失败\n\n❌ 所有生成都失败了。\n错误: ${errorMsg}\n\n请查看控制台了解详情。`);
      }

      await loadCachedResults(testImage.id);
    } catch (error) {
      console.error('❌ Batch generation error:', error);

      if (error.code === 'PGRST205' || error.message?.includes('cached_generations')) {
        alert('数据库错误\n\n⚠️ 未找到 cached_generations 表。请确保已应用迁移并等待模式缓存刷新，然后重试。');
      } else {
        alert(`批量生成失败\n\n${error.message}`);
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
      '确认删除\n\n这也将删除此图片的所有缓存生成。是否继续？'
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
      alert('测试图片删除成功！');
    } catch (error) {
      console.error('❌ Remove error:', error);
      alert(`删除失败\n\n${error.message}\n\n请查看控制台了解详情。`);
    }
  };

  const handleRegeneratePrompt = async (type, id, item) => {
    const itemKey = `${type}-${id}`;

    if (!testImages.length || selectedTestImageIndex >= testImages.length) {
      alert('错误\n\n请先上传测试图片');
      return;
    }

    const selectedImage = testImages[selectedTestImageIndex];

    setTestingInProgress(prev => ({ ...prev, [itemKey]: true }));

    try {
      if (type === 'templates') {
        if (!selectedEditLookUrl) {
          alert('错误\n\n请先生成 Edit Look 缓存或选择一个 Edit Look');
          setTestingInProgress(prev => ({ ...prev, [itemKey]: false }));
          return;
        }

        const validPrompts = (item.prompts || []).filter(p => p && p.trim() !== '');

        if (validPrompts.length === 0) {
          alert('错误\n\n请至少填写一个提示词');
          setTestingInProgress(prev => ({ ...prev, [itemKey]: false }));
          return;
        }

        console.log(`📸 Regenerating ${validPrompts.length} template image(s) using Edit Look image:`, {
          editLookUrl: selectedEditLookUrl,
          editLookId: selectedEditLookId,
          promptCount: validPrompts.length
        });

        await cacheService.regeneratePromptWithEditLook(
          selectedEditLookUrl,
          selectedImage.id,
          id,
          validPrompts
        );

        await loadCachedResults(selectedImage.id);

        alert(`成功\n\n成功生成 ${validPrompts.length} 个模板图片！`);
      } else {
        const promptText = item.prompts?.[0] || '';

        await cacheService.regeneratePrompt(
          selectedImage.publicUrl,
          selectedImage.id,
          type,
          id,
          promptText
        );

        await loadCachedResults(selectedImage.id);

        alert('成功\n\n提示词重新生成成功！');
      }
    } catch (error) {
      console.error('Regenerate error:', error);
      alert(`重新生成失败\n\n${error.message}`);
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
        alert('文件太大。最大大小为 5MB。');
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
        alert(`上传失败: ${error.message}`);
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
      <Card elevate bordered backgroundColor="$sectionBackground" padding="$5" marginBottom="$4" borderRadius="$5">
        <H3 marginBottom="$2">选择模板的 Edit Look</H3>
        <Paragraph color="$gray11" fontSize="$3" marginBottom="$4">
          选择要用作美学模板输入的 Edit Look 结果
        </Paragraph>

        <XStack flexWrap="wrap" gap="$3">
          {lookingItems
            .sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0))
            .map(([key, item]) => {
              const cachedResult = cachedLooking[key];
              const isSelected = selectedEditLookId === key;

              return (
                <Card
                  key={key}
                  pressable
                  onPress={() => handleEditLookSelection(key)}
                  flex={1}
                  flexBasis="20%"
                  minWidth={140}
                  backgroundColor={isSelected ? '$blue2' : '$background'}
                  borderWidth={2}
                  borderColor={isSelected ? '$blue10' : '$borderColor'}
                  padding="$3"
                  borderRadius="$3"
                  alignItems="center"
                  justifyContent="center"
                  hoverStyle={{
                    borderColor: '$blue8',
                  }}
                >
                  {cachedResult && cachedResult.generatedUrl && (
                    <Image
                      source={{ uri: cachedResult.generatedUrl }}
                      style={{
                        width: 80,
                        height: 120,
                        borderRadius: 8,
                        marginBottom: 12,
                      }}
                      resizeMode="cover"
                    />
                  )}
                  <Text
                    fontSize="$3"
                    fontWeight="600"
                    color={isSelected ? '$blue10' : '$color'}
                    textAlign="center"
                  >
                    {item.name}
                  </Text>
                  {isSelected && (
                    <YStack
                      position="absolute"
                      top="$2"
                      right="$2"
                      backgroundColor="$blue10"
                      width={28}
                      height={28}
                      borderRadius={14}
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontSize="$5" fontWeight="bold">✓</Text>
                    </YStack>
                  )}
                </Card>
              );
            })}
        </XStack>
      </Card>
    );
  };

  const renderSection = (type, title) => {
    const items = config[type] || {};
    const itemsArray = Object.entries(items);
    const sortedItems = itemsArray.sort(([, a], [, b]) => (a.display_order || 0) - (b.display_order || 0));
    const itemIds = sortedItems.map(([key]) => key);

    return (
      <Card elevate bordered backgroundColor="$sectionBackground" padding="$5" marginBottom="$4" borderRadius="$5">
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4" paddingBottom="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
          <H2>{title}</H2>
          <Button
            onPress={() => openModal(type)}
            size="$3"
            theme="blue"
            borderRadius="$10"
          >
            添加新项
          </Button>
        </XStack>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => handleDragEnd(event, type)}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <XStack flexWrap="wrap" gap="$3">
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
            </XStack>
          </SortableContext>
        </DndContext>
      </Card>
    );
  };

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="light">
      <ScrollView backgroundColor="$background" flex={1}>
      <YStack maxWidth={1200} width="100%" alignSelf="center" padding="$4" paddingBottom="$8">
        <YStack alignItems="center" marginBottom="$8">
          <H1 fontSize="$11" fontWeight="600" color="$color" marginBottom="$3" textAlign="center">
            管理设置
          </H1>
          <Paragraph fontSize="$6" color="$gray11" textAlign="center">
            管理 AI 角色和提示词配置
          </Paragraph>
        </YStack>

        {/* Cache Mode Toggle */}
        <Card
          elevate
          bordered
          backgroundColor="$yellow2"
          borderColor="$yellow8"
          borderWidth={2}
          padding="$4"
          marginBottom="$4"
          borderRadius="$5"
        >
          <XStack justifyContent="space-between" alignItems="center">
            <YStack>
              <Text fontSize="$6" fontWeight="600" color="$color" marginBottom="$1">
                缓存模式
              </Text>
              <Text fontSize="$3" color="$gray11">
                {cacheMode ? '使用缓存结果（节省 API 额度）' : '使用实时 API 调用'}
              </Text>
            </YStack>
            <Switch
              checked={cacheMode}
              onCheckedChange={handleCacheModeToggle}
              size="$4"
            >
              <Switch.Thumb animation="quick" />
            </Switch>
          </XStack>
        </Card>

        {/* Test Images Section */}
        <Card elevate bordered backgroundColor="$cardBackground" padding="$5" marginBottom="$4" borderRadius="$5">
          <H2 marginBottom="$2">测试图片（模特）</H2>
          <Paragraph color="$gray11" fontSize="$3" marginBottom="$4">
            上传测试图片以预生成所有外观。结果已缓存以便更快测试。
          </Paragraph>

          <XStack gap="$3" marginBottom="$4">
            <Button
              onPress={handleImagePick}
              size="$3"
              theme="blue"
              disabled={isUploadingImage || isBatchGenerating}
              icon={isUploadingImage ? <Spinner size="small" /> : null}
            >
              {isUploadingImage ? '' : '📤 上传测试图片'}
            </Button>

            {testImages.length > 0 && testImages[selectedTestImageIndex] && (
              <Button
                onPress={() => handleBatchGenerate(testImages[selectedTestImageIndex])}
                size="$3"
                theme="green"
                disabled={isBatchGenerating}
                icon={isBatchGenerating ? <Spinner size="small" /> : null}
              >
                {isBatchGenerating ? '' : '🔄 生成缓存'}
              </Button>
            )}
          </XStack>

          {isBatchGenerating && (
            <Card backgroundColor="$background" padding="$3" borderRadius="$3" marginBottom="$4">
              <Text fontSize="$3" fontWeight="600" color="$color" marginBottom="$1">
                生成缓存中: {batchProgress.current} / {batchProgress.total}
              </Text>
              {batchProgress.item && (
                <Text fontSize="$2" color="$gray11" marginBottom="$3">
                  当前: {batchProgress.item.name}
                </Text>
              )}
              <YStack height={8} backgroundColor="$gray5" borderRadius="$2" overflow="hidden">
                <YStack
                  height="100%"
                  backgroundColor="$green10"
                  borderRadius="$2"
                  width={`${(batchProgress.current / batchProgress.total) * 100}%`}
                />
              </YStack>
            </Card>
          )}

          {testImages.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <XStack gap="$3">
                {testImages.map((img, index) => (
                  <YStack key={index} alignItems="center">
                    <Card
                      pressable
                      onPress={() => setSelectedTestImageIndex(index)}
                      width={120}
                      height={120}
                      borderRadius="$3"
                      borderWidth={3}
                      borderColor={selectedTestImageIndex === index ? '$blue10' : 'transparent'}
                      overflow="hidden"
                      position="relative"
                    >
                      <Image
                        source={{ uri: img.url }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                      />
                      {selectedTestImageIndex === index && (
                        <YStack
                          position="absolute"
                          top={4}
                          right={4}
                          backgroundColor="$blue10"
                          width={24}
                          height={24}
                          borderRadius={12}
                          alignItems="center"
                          justifyContent="center"
                        >
                          <Text color="white" fontSize="$3" fontWeight="bold">✓</Text>
                        </YStack>
                      )}
                    </Card>
                    <Button
                      onPress={() => removeTestImage(index)}
                      size="$2"
                      theme="red"
                      marginTop="$2"
                      chromeless
                    >
                      ✕
                    </Button>
                  </YStack>
                ))}
              </XStack>
            </ScrollView>
          )}
        </Card>

        {/* Tab Navigation */}
        <XStack backgroundColor="$cardBackground" borderRadius="$3" padding="$1" marginBottom="$4">
          <Button
            flex={1}
            onPress={() => setActiveTab('looking')}
            size="$3"
            backgroundColor={activeTab === 'looking' ? '$blue10' : 'transparent'}
            color={activeTab === 'looking' ? 'white' : '$gray11'}
            borderRadius="$2"
            chromeless={activeTab !== 'looking'}
          >
            Edit Look
          </Button>
          <Button
            flex={1}
            onPress={() => setActiveTab('templates')}
            size="$3"
            backgroundColor={activeTab === 'templates' ? '$blue10' : 'transparent'}
            color={activeTab === 'templates' ? 'white' : '$gray11'}
            borderRadius="$2"
            chromeless={activeTab !== 'templates'}
          >
            模板
          </Button>
        </XStack>

        {/* Render content based on active tab */}
        {activeTab === 'looking' && renderSection('looking', 'Edit Look')}
        {activeTab === 'looking' && renderEditLookSelector()}
        {activeTab === 'templates' && (
          <>
            {renderEditLookSelector()}
            {renderSection('templates', '美学模板')}
          </>
        )}
      </YStack>

      {/* Edit/Add Modal */}
      <Sheet
        modal
        open={modalVisible}
        onOpenChange={setModalVisible}
        snapPoints={[90]}
        dismissOnSnapToBottom
      >
        <Sheet.Overlay />
        <Sheet.Frame padding="$5" backgroundColor="$background">
          <Sheet.Handle />
          <ScrollView flex={1}>
            <YStack gap="$4">
              <H3 marginBottom="$3">
                {editingId ? '编辑项目' : '添加新项目'}
              </H3>

              <YStack gap="$2">
                <Text fontSize="$3" fontWeight="500" color="$gray11">
                  ID {!editingId && '(自动生成)'}
                </Text>
                <Input
                  value={formData.id}
                  onChangeText={(text) => setFormData({ ...formData, id: text })}
                  placeholder="自动生成"
                  disabled
                  backgroundColor="$background"
                  color="$gray10"
                />
              </YStack>

              <YStack gap="$2">
                <Text fontSize="$3" fontWeight="500" color="$gray11">
                  名称
                </Text>
                <Input
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="例如: Better-Looking"
                />
              </YStack>

              {currentType === 'templates' ? (
                <>
                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="500" color="$gray11">
                      提示词 1 (必填)
                    </Text>
                    <Input
                      value={formData.prompts[0]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[0] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="第一个提示词..."
                      multiline
                      numberOfLines={3}
                      minHeight={100}
                      textAlignVertical="top"
                      paddingTop="$3"
                    />
                  </YStack>

                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="500" color="$gray11">
                      提示词 2 (可选)
                    </Text>
                    <Input
                      value={formData.prompts[1]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[1] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="第二个提示词..."
                      multiline
                      numberOfLines={3}
                      minHeight={100}
                      textAlignVertical="top"
                      paddingTop="$3"
                    />
                  </YStack>

                  <YStack gap="$2">
                    <Text fontSize="$3" fontWeight="500" color="$gray11">
                      提示词 3 (可选)
                    </Text>
                    <Input
                      value={formData.prompts[2]}
                      onChangeText={(text) => {
                        const newPrompts = [...formData.prompts];
                        newPrompts[2] = text;
                        setFormData({ ...formData, prompts: newPrompts });
                      }}
                      placeholder="第三个提示词..."
                      multiline
                      numberOfLines={3}
                      minHeight={100}
                      textAlignVertical="top"
                      paddingTop="$3"
                    />
                  </YStack>
                </>
              ) : (
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="500" color="$gray11">
                    提示词
                  </Text>
                  <Input
                    value={formData.prompts[0]}
                    onChangeText={(text) => {
                      const newPrompts = [...formData.prompts];
                      newPrompts[0] = text;
                      setFormData({ ...formData, prompts: newPrompts });
                    }}
                    placeholder="例如: better-looking, enhanced features, more attractive"
                    multiline
                    numberOfLines={4}
                    minHeight={100}
                    textAlignVertical="top"
                    paddingTop="$3"
                  />
                </YStack>
              )}

              {currentType === 'templates' && (
                <YStack gap="$2">
                  <Text fontSize="$3" fontWeight="500" color="$gray11">
                    模板图片
                  </Text>
                  <XStack gap="$3" alignItems="center">
                    <Input
                      value={formData.image_path}
                      placeholder="上传图片..."
                      disabled
                      backgroundColor="$background"
                      color="$gray10"
                      flex={1}
                    />
                    <Button
                      onPress={handleTemplateImageUpload}
                      size="$3"
                      theme="blue"
                      disabled={isUploadingTemplateImage}
                      icon={isUploadingTemplateImage ? <Spinner size="small" /> : null}
                    >
                      {isUploadingTemplateImage ? '' : '上传'}
                    </Button>
                  </XStack>

                  {(formData.image_path || uploadedImagePreview) && (
                    <YStack alignItems="center" marginTop="$3">
                      <Image
                        source={{
                          uri: uploadedImagePreview || getTemplateImageUrl(formData.image_path)
                        }}
                        style={{
                          width: 100,
                          height: 150,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: '#e5e5e7',
                        }}
                        resizeMode="cover"
                      />
                    </YStack>
                  )}
                </YStack>
              )}

              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500" color="$gray11">
                  在应用中启用
                </Text>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(value) => setFormData({ ...formData, enabled: value })}
                  size="$3"
                >
                  <Switch.Thumb animation="quick" />
                </Switch>
              </XStack>
            </YStack>
          </ScrollView>

          <XStack gap="$3" justifyContent="flex-end" marginTop="$4" paddingTop="$3" borderTopWidth={1} borderTopColor="$borderColor">
            <Button
              onPress={closeModal}
              size="$3"
              backgroundColor="$background"
              color="$color"
              borderRadius="$10"
            >
              取消
            </Button>
            <Button
              onPress={saveItem}
              size="$3"
              theme="blue"
              borderRadius="$10"
            >
              保存
            </Button>
          </XStack>
        </Sheet.Frame>
      </Sheet>
    </ScrollView>
    </TamaguiProvider>
  );
}

export default ConfigAdmin;
