import { supabase } from './supabaseClient';
import { falApi } from './falApi';

export const cacheService = {
  /**
   * Batch generate only edit styles for a test image
   * Note: Template caching is now handled separately via regeneratePromptWithEditLook
   * @param {string} testImageUrl - URL of the test image
   * @param {string} testImageId - Unique ID for the test image
   * @param {object} config - Configuration object with edit_options and templates
   * @param {function} onProgress - Progress callback (current, total, item)
   * @returns {Promise<object>} - Results summary
   */
  batchGenerateCache: async (testImageUrl, testImageId, config, onProgress = null) => {
    const results = {
      success: [],
      failed: [],
      total: 0,
      completed: 0
    };

    // Collect all prompts to generate - ONLY Edit Looks
    const prompts = [];

    // Add all enabled edit style prompts (looking)
    Object.entries(config.looking || config.edit_options || {}).forEach(([key, item]) => {
      if (item.enabled) {
        prompts.push({
          type: 'looking',
          id: key,
          name: item.name,
          prompt: item.prompt
        });
      }
    });

    // NOTE: Template batch generation removed - templates are now generated individually
    // based on a selected Edit Look image via regeneratePromptWithEditLook()

    results.total = prompts.length;

    // Generate each prompt
    for (const promptItem of prompts) {
      try {
        if (onProgress) {
          onProgress(results.completed, results.total, promptItem);
        }

        // Call FAL API to generate image with 9:16 aspect ratio
        const falResult = await falApi.editImage(testImageUrl, promptItem.prompt, {
          numImages: 1,
          outputFormat: 'jpeg',
          aspectRatio: '9:16',
          syncMode: true
        });

        if (falResult.images && falResult.images[0]) {
          const generatedUrl = falResult.images[0].url;

          // Save to cache in Supabase
          await cacheService.saveCachedGeneration({
            testImageId,
            testImageUrl,
            promptType: promptItem.type,
            promptId: promptItem.id,
            promptText: promptItem.prompt,
            generatedImageUrl: generatedUrl
          });

          results.success.push({
            ...promptItem,
            generatedUrl
          });
        }
      } catch (error) {
        console.error(`Failed to generate ${promptItem.type}/${promptItem.id}:`, error);
        results.failed.push({
          ...promptItem,
          error: error.message
        });
      }

      results.completed++;
    }

    return results;
  },

  /**
   * Save a cached generation to Supabase
   * @param {object} data - Cache data
   * @returns {Promise<object>} - Saved data
   */
  saveCachedGeneration: async (data) => {
    // Support both generatedImageUrl (string) for backward compatibility
    // and generatedImageUrls (array) for new multi-image templates
    const imageUrl = data.generatedImageUrls
      ? data.generatedImageUrls  // New: array of URLs for templates
      : data.generatedImageUrl   // Old: single URL string for backward compatibility
      ? [data.generatedImageUrl] // Convert single to array format
      : null;

    if (!imageUrl || (Array.isArray(imageUrl) && imageUrl.length === 0)) {
      throw new Error('No image URL(s) provided to save');
    }

    const { error, data: savedData } = await supabase
      .from('cached_generations')
      .upsert({
        test_image_id: data.testImageId,
        test_image_url: data.testImageUrl,
        prompt_type: data.promptType,
        prompt_id: data.promptId,
        prompt_text: data.promptText,
        generated_image_url: imageUrl  // Now stores JSONB array
      }, {
        onConflict: 'test_image_id,prompt_type,prompt_id'
      })
      .select()
      .single();

    if (error) throw error;
    return savedData;
  },

  /**
   * Get all cached generations for a test image
   * @param {string} testImageId - Test image ID
   * @returns {Promise<object>} - Cached results grouped by type
   */
  getCachedResults: async (testImageId) => {
    const { data, error } = await supabase
      .from('cached_generations')
      .select('*')
      .eq('test_image_id', testImageId)
      .order('prompt_type')
      .order('prompt_id');

    if (error) throw error;

    // Group by type
    const grouped = {
      looking: {},
      templates: {}
    };

    data.forEach(item => {
      const promptType = item.prompt_type;

      // Ensure the type exists in grouped object
      if (!grouped[promptType]) {
        console.warn(`Unknown prompt_type: ${promptType}, creating new category`);
        grouped[promptType] = {};
      }

      // Handle both old string format and new JSONB array format
      const imageUrl = item.generated_image_url;
      let generatedUrls = [];
      let singleUrl = null;

      if (Array.isArray(imageUrl)) {
        // New format: JSONB array
        generatedUrls = imageUrl;
        singleUrl = imageUrl[0] || null;
      } else if (typeof imageUrl === 'string') {
        // Old format: single string (backward compatibility)
        generatedUrls = [imageUrl];
        singleUrl = imageUrl;
      }

      grouped[promptType][item.prompt_id] = {
        id: item.id,
        promptId: item.prompt_id,
        promptText: item.prompt_text,
        generatedUrls: generatedUrls,        // New: array format
        generatedUrl: singleUrl,              // Old: single string for backward compatibility
        createdAt: item.created_at,
        updatedAt: item.updated_at
      };
    });

    return grouped;
  },

  /**
   * Get all test images that have cached results
   * @returns {Promise<Array>} - List of test images with cache info
   */
  getTestImagesWithCache: async () => {
    const { data, error } = await supabase
      .from('cached_generations')
      .select('test_image_id, test_image_url')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Get unique test images
    const uniqueImages = {};
    data.forEach(item => {
      if (!uniqueImages[item.test_image_id]) {
        uniqueImages[item.test_image_id] = {
          id: item.test_image_id,
          url: item.test_image_url
        };
      }
    });

    return Object.values(uniqueImages);
  },

  /**
   * Regenerate a single prompt for a test image
   * @param {string} testImageUrl - URL of the test image
   * @param {string} testImageId - Test image ID
   * @param {string} promptType - 'edit_styles' or 'templates'
   * @param {string} promptId - ID of the prompt
   * @param {string} promptText - The prompt text
   * @returns {Promise<object>} - Generated result
   */
  regeneratePrompt: async (testImageUrl, testImageId, promptType, promptId, promptText) => {
    try {
      console.log('Regenerating prompt via direct FAL API call:', {
        testImageUrl,
        promptText,
        promptId,
        promptType
      });

      // Call FAL API directly to generate image with 9:16 aspect ratio
      const falResult = await falApi.editImage(testImageUrl, promptText, {
        numImages: 1,
        outputFormat: 'jpeg',
        aspectRatio: '9:16',
        syncMode: true
      });

      if (falResult.images && falResult.images[0]) {
        const generatedUrl = falResult.images[0].url;

        // Update cache in Supabase
        await cacheService.saveCachedGeneration({
          testImageId,
          testImageUrl,
          promptType,
          promptId,
          promptText,
          generatedImageUrl: generatedUrl
        });

        return {
          success: true,
          generatedUrl
        };
      }

      throw new Error('No image generated from FAL API');
    } catch (error) {
      console.error('Regenerate failed:', error);
      throw error;
    }
  },

  /**
   * Regenerate a template prompt using a previously generated Edit Look image as input
   * @param {string} editLookGeneratedUrl - URL of the generated Edit Look image
   * @param {string} testImageId - Test image ID (for cache storage)
   * @param {string} promptId - ID of the template prompt
   * @param {string} promptText - The template prompt text
   * @returns {Promise<object>} - Generated result
   */
  regeneratePromptWithEditLook: async (editLookGeneratedUrl, testImageId, promptId, prompts) => {
    try {
      // Support both single string (for backward compatibility) and array of prompts
      const promptsArray = Array.isArray(prompts) ? prompts : [prompts];

      console.log('Regenerating template prompts with Edit Look image as input:', {
        editLookGeneratedUrl,
        promptCount: promptsArray.length,
        promptId
      });

      const generatedUrls = [];

      // Generate image for each prompt
      for (let i = 0; i < promptsArray.length; i++) {
        const promptText = promptsArray[i];

        // Skip empty prompts
        if (!promptText || promptText.trim() === '') {
          console.log(`Skipping empty prompt at index ${i}`);
          continue;
        }

        console.log(`Generating image ${i + 1}/${promptsArray.length} with prompt: ${promptText.substring(0, 50)}...`);

        // Call FAL API using the Edit Look generated image
        const falResult = await falApi.editImage(editLookGeneratedUrl, promptText, {
          numImages: 1,
          outputFormat: 'jpeg',
          aspectRatio: '9:16',
          syncMode: true
        });

        if (falResult.images && falResult.images[0]) {
          generatedUrls.push(falResult.images[0].url);
        } else {
          throw new Error(`Failed to generate image for prompt ${i + 1}`);
        }
      }

      if (generatedUrls.length === 0) {
        throw new Error('No valid prompts to generate images from');
      }

      // Save to cache in Supabase with array of URLs
      await cacheService.saveCachedGeneration({
        testImageId,
        testImageUrl: editLookGeneratedUrl,
        promptType: 'templates',
        promptId,
        promptText: promptsArray.join(' | '), // Join for display
        generatedImageUrls: generatedUrls // Pass array of URLs
      });

      return {
        success: true,
        generatedUrls,
        generatedUrl: generatedUrls[0] // For backward compatibility
      };
    } catch (error) {
      console.error('Regenerate with Edit Look failed:', error);
      throw error;
    }
  },

  /**
   * Delete all cache for a test image
   * @param {string} testImageId - Test image ID
   * @returns {Promise<void>}
   */
  deleteCacheForTestImage: async (testImageId) => {
    const { error } = await supabase
      .from('cached_generations')
      .delete()
      .eq('test_image_id', testImageId);

    if (error) throw error;
  },

  /**
   * Check if a test image has cached results
   * @param {string} testImageId - Test image ID
   * @returns {Promise<boolean>}
   */
  hasCachedResults: async (testImageId) => {
    const { data, error } = await supabase
      .from('cached_generations')
      .select('id')
      .eq('test_image_id', testImageId)
      .limit(1);

    if (error) throw error;
    return data && data.length > 0;
  },

  /**
   * Get a random cached result for a specific prompt
   * Used in demo mode to return mockup results
   * @param {string} promptType - 'edit_styles' or 'templates'
   * @param {string} promptId - ID of the prompt
   * @returns {Promise<string|null>} - Random generated image URL or null
   */
  getRandomCachedResult: async (promptType, promptId) => {
    try {
      const { data, error } = await supabase
        .from('cached_generations')
        .select('generated_image_url')
        .eq('prompt_type', promptType)
        .eq('prompt_id', promptId);

      if (error) throw error;

      if (!data || data.length === 0) {
        console.warn(`No cached results found for ${promptType}/${promptId}`);
        return null;
      }

      // Return a random result from the cached data
      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].generated_image_url;
    } catch (error) {
      console.error('Failed to get random cached result:', error);
      return null;
    }
  }
};

export default cacheService;
