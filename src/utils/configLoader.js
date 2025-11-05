// Utility to load and manage transformation configuration

import transformationConfig from '../config/transformation_prompts.json';
import styleTemplatesConfig from '../config/style_templates.json';

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
  },

  /**
   * Get all style templates
   * @returns {Array} Array of style template options
   */
  getStyleTemplates: () => {
    return Object.values(styleTemplatesConfig.templates || {});
  },

  /**
   * Get a specific style template by ID
   * @param {string} id - The style template ID
   * @returns {object|null} The style template object or null
   */
  getStyleTemplateById: (id) => {
    return styleTemplatesConfig.templates?.[id] || null;
  },

  /**
   * Build a complete prompt with looking, visual style, and style template
   * @param {string} lookingId - The looking option ID
   * @param {string} visualStyleId - The visual style option ID
   * @param {string} styleTemplateId - The style template ID
   * @returns {string} Complete combined prompt string
   */
  buildCompletePrompt: (lookingId, visualStyleId, styleTemplateId) => {
    const looking = configLoader.getLookingById(lookingId);
    const visualStyle = configLoader.getVisualStyleById(visualStyleId);
    const styleTemplate = configLoader.getStyleTemplateById(styleTemplateId);

    if (!looking || !visualStyle) {
      throw new Error('Invalid looking or visual style ID');
    }

    let prompt = `${looking.prompt_modifier}, ${visualStyle.prompt_modifier}`;

    if (styleTemplate) {
      prompt += `, ${styleTemplate.prompt}`;
    }

    return prompt;
  }
};

export default configLoader;
