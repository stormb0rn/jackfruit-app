// Utility to load and manage transformation configuration
// Now loads from Zustand store (which loads from Supabase with JSON fallback)

import transformationConfig from '../config/transformation_prompts.json';
import styleTemplatesConfig from '../config/style_templates.json';
import useAppStore from '../stores/appStore';

/**
 * Get transformation prompts from store or fallback to JSON
 * @returns {object} Transformation prompts object
 */
const getTransformationPrompts = () => {
  const state = useAppStore.getState();
  return state.transformationPrompts || transformationConfig.edit_options;
};

/**
 * Get style templates from store or fallback to JSON
 * @returns {object} Style templates object
 */
const getStyleTemplatesConfig = () => {
  const state = useAppStore.getState();
  return state.styleTemplates || styleTemplatesConfig.templates;
};

export const configLoader = {
  /**
   * Get all edit options (sorted by order)
   * @returns {Array} Array of edit options sorted by order field
   */
  getEditOptions: () => {
    const prompts = getTransformationPrompts();
    const options = Object.values(prompts || {});
    return options.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * Get all looking options (alias for getEditOptions, sorted by order)
   * @returns {Array} Array of looking options sorted by order field
   */
  getLookingOptions: () => {
    return configLoader.getEditOptions();
  },

  /**
   * Get a specific edit option by ID
   * @param {string} id - The edit option ID
   * @returns {object|null} The edit option object or null
   */
  getEditOptionById: (id) => {
    const prompts = getTransformationPrompts();
    return prompts?.[id] || null;
  },

  /**
   * Get the full configuration
   * @returns {object} The full configuration object
   */
  getConfig: () => {
    const prompts = getTransformationPrompts();
    return { edit_options: prompts };
  },

  /**
   * Get all style templates (sorted by order)
   * @returns {Array} Array of style template options sorted by order field
   */
  getStyleTemplates: () => {
    const templates = getStyleTemplatesConfig();
    const templatesList = Object.values(templates || {});
    return templatesList.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  /**
   * Get a specific style template by ID
   * @param {string} id - The style template ID
   * @returns {object|null} The style template object or null
   */
  getStyleTemplateById: (id) => {
    const templates = getStyleTemplatesConfig();
    return templates?.[id] || null;
  },

  /**
   * Build a complete prompt with edit style and style template
   * @param {string} editStyleId - The edit style ID
   * @param {string} styleTemplateId - The style template ID (optional)
   * @returns {string|Array} For templates: array of 3 prompts; For edit look: single prompt
   */
  buildCompletePrompt: (editStyleId, styleTemplateId = null) => {
    const editOption = configLoader.getEditOptionById(editStyleId);

    if (!editOption) {
      throw new Error('Invalid edit style ID');
    }

    // Get the prompt(s) from edit option (either array or string)
    const editPrompts = Array.isArray(editOption.prompts)
      ? editOption.prompts
      : editOption.prompt
      ? [editOption.prompt]
      : [];

    if (styleTemplateId) {
      const styleTemplate = configLoader.getStyleTemplateById(styleTemplateId);
      if (styleTemplate) {
        // Style template returns array of 3 prompts
        // Combine with edit option prompt
        const templatePrompts = Array.isArray(styleTemplate.prompts)
          ? styleTemplate.prompts
          : styleTemplate.prompt
          ? [styleTemplate.prompt, styleTemplate.prompt, styleTemplate.prompt]
          : [];

        // Return array of combined prompts for template (3 variations)
        return templatePrompts.map((templatePrompt, index) => {
          const editPrompt = editPrompts[0] || editPrompts;
          return `${editPrompt}, ${templatePrompt}`;
        });
      }
    }

    // For edit look only, return single prompt string
    return editPrompts[0] || editPrompts;
  }
};

export default configLoader;
