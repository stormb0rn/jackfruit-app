import { supabase } from './supabaseClient';
import { falApi } from './falApi';

export const cacheService = {
  /**
   * Batch generate all looks and templates for a test image
   * @param {string} testImageUrl - URL of the test image
   * @param {string} testImageId - Unique ID for the test image
   * @param {object} config - Configuration object with looking and templates
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

    // Collect all prompts to generate
    const prompts = [];

    // Add all enabled looking prompts
    Object.entries(config.looking || {}).forEach(([key, item]) => {
      if (item.enabled) {
        prompts.push({
          type: 'looking',
          id: key,
          name: item.name,
          prompt: item.prompt_modifier
        });
      }
    });

    // Add all enabled template prompts
    Object.entries(config.templates || {}).forEach(([key, item]) => {
      if (item.enabled) {
        prompts.push({
          type: 'templates',
          id: key,
          name: item.name,
          prompt: item.prompt
        });
      }
    });

    results.total = prompts.length;

    // Generate each prompt
    for (const promptItem of prompts) {
      try {
        if (onProgress) {
          onProgress(results.completed, results.total, promptItem);
        }

        // Call FAL API to generate image
        const falResult = await falApi.editImage(testImageUrl, promptItem.prompt, {
          numImages: 1,
          outputFormat: 'jpeg',
          aspectRatio: '1:1',
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
    const { error, data: savedData } = await supabase
      .from('cached_generations')
      .upsert({
        test_image_id: data.testImageId,
        test_image_url: data.testImageUrl,
        prompt_type: data.promptType,
        prompt_id: data.promptId,
        prompt_text: data.promptText,
        generated_image_url: data.generatedImageUrl
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
      grouped[item.prompt_type][item.prompt_id] = {
        id: item.id,
        promptId: item.prompt_id,
        promptText: item.prompt_text,
        generatedUrl: item.generated_image_url,
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
   * @param {string} promptType - 'looking' or 'templates'
   * @param {string} promptId - ID of the prompt
   * @param {string} promptText - The prompt text
   * @returns {Promise<object>} - Generated result
   */
  regeneratePrompt: async (testImageUrl, testImageId, promptType, promptId, promptText) => {
    try {
      // Call FAL API to generate image
      const falResult = await falApi.editImage(testImageUrl, promptText, {
        numImages: 1,
        outputFormat: 'jpeg',
        aspectRatio: '1:1',
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

      throw new Error('No image generated');
    } catch (error) {
      console.error('Regenerate failed:', error);
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
   * @param {string} promptType - 'looking' or 'templates'
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
