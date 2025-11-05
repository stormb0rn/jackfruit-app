// fal.ai nano-banana/edit API service

const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
const FAL_ENDPOINT = 'https://fal.run/fal-ai/nano-banana/edit';

export const falApi = {
  /**
   * Transform an image using fal.ai nano-banana/edit model
   * @param {string} imageUrl - URL of the input image
   * @param {string} prompt - The transformation prompt
   * @param {object} options - Additional options
   * @returns {Promise<object>} - The transformed image result
   */
  editImage: async (imageUrl, prompt, options = {}) => {
    const {
      numImages = 1,
      outputFormat = 'jpeg',
      aspectRatio = '1:1',
      syncMode = false,
      limitGenerations = false
    } = options;

    try {
      const response = await fetch(FAL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          image_urls: [imageUrl],
          num_images: numImages,
          output_format: outputFormat,
          aspect_ratio: aspectRatio,
          sync_mode: syncMode,
          limit_generations: limitGenerations
        })
      });

      if (!response.ok) {
        throw new Error(`FAL API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('FAL API Error:', error);
      throw error;
    }
  },

  /**
   * Transform an image with looking and visual style
   * @param {string} imageUrl - URL of the input image
   * @param {object} lookingConfig - Looking configuration object
   * @param {object} visualStyleConfig - Visual style configuration object
   * @param {object} options - Additional options
   * @returns {Promise<object>} - The transformed image result
   */
  transformCharacter: async (imageUrl, lookingConfig, visualStyleConfig, options = {}) => {
    const prompt = `${lookingConfig.prompt_modifier}, ${visualStyleConfig.prompt_modifier}`;

    return await falApi.editImage(imageUrl, prompt, options);
  },

  /**
   * Batch transform an image with multiple configurations
   * @param {string} imageUrl - URL of the input image
   * @param {Array<{looking: object, visualStyle: object}>} configs - Array of config combinations
   * @param {object} options - Additional options
   * @returns {Promise<Array<object>>} - Array of transformed image results
   */
  batchTransform: async (imageUrl, configs, options = {}) => {
    const transformPromises = configs.map(({ looking, visualStyle }) =>
      falApi.transformCharacter(imageUrl, looking, visualStyle, options)
    );

    try {
      const results = await Promise.all(transformPromises);
      return results;
    } catch (error) {
      console.error('Batch Transform Error:', error);
      throw error;
    }
  }
};

export default falApi;
