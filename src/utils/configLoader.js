// Utility to load and manage transformation configuration

import transformationConfig from '../config/transformation_prompts.json';

export const configLoader = {
  /**
   * Get all looking options
   * @returns {Array} Array of looking options
   */
  getLookingOptions: () => {
    return Object.values(transformationConfig.looking || {});
  },

  /**
   * Get all visual style options
   * @returns {Array} Array of visual style options
   */
  getVisualStyleOptions: () => {
    return Object.values(transformationConfig.visual_style || {});
  },

  /**
   * Get a specific looking option by ID
   * @param {string} id - The looking option ID
   * @returns {object|null} The looking option object or null
   */
  getLookingById: (id) => {
    return transformationConfig.looking?.[id] || null;
  },

  /**
   * Get a specific visual style option by ID
   * @param {string} id - The visual style option ID
   * @returns {object|null} The visual style option object or null
   */
  getVisualStyleById: (id) => {
    return transformationConfig.visual_style?.[id] || null;
  },

  /**
   * Get the full configuration
   * @returns {object} The full configuration object
   */
  getConfig: () => {
    return transformationConfig;
  },

  /**
   * Build a combined prompt from looking and visual style
   * @param {string} lookingId - The looking option ID
   * @param {string} visualStyleId - The visual style option ID
   * @returns {string} Combined prompt string
   */
  buildPrompt: (lookingId, visualStyleId) => {
    const looking = configLoader.getLookingById(lookingId);
    const visualStyle = configLoader.getVisualStyleById(visualStyleId);

    if (!looking || !visualStyle) {
      throw new Error('Invalid looking or visual style ID');
    }

    return `${looking.prompt_modifier}, ${visualStyle.prompt_modifier}`;
  }
};

export default configLoader;
