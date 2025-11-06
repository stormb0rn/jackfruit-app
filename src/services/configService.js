import { supabase } from './supabaseClient';
import transformationConfig from '../config/transformation_prompts.json';
import styleTemplatesConfig from '../config/style_templates.json';

/**
 * Config Service
 * Manages prompt configurations in Supabase
 */
const configService = {
  /**
   * Load configuration from Supabase
   * Falls back to JSON files if Supabase is empty
   * @param {string} configType - 'looking' or 'templates'
   * @returns {Promise<object>} Configuration data
   */
  loadConfig: async (configType) => {
    try {
      const { data, error } = await supabase
        .from('prompt_config')
        .select('config_data')
        .eq('id', configType)
        .single();

      if (error) {
        console.error(`Failed to load ${configType} config from Supabase:`, error);
        return configService.getDefaultConfig(configType);
      }

      // If Supabase config is empty, return defaults
      if (!data || !data.config_data || Object.keys(data.config_data).length === 0) {
        console.log(`${configType} config is empty in Supabase, using defaults`);
        return configService.getDefaultConfig(configType);
      }

      console.log(`Loaded ${configType} config from Supabase`);

      // Auto-assign order if missing
      const config = configService.ensureOrder(data.config_data);
      return config;
    } catch (error) {
      console.error(`Error loading ${configType} config:`, error);
      return configService.getDefaultConfig(configType);
    }
  },

  /**
   * Save configuration to Supabase
   * @param {string} configType - 'looking' or 'templates'
   * @param {object} configData - Configuration data to save
   * @returns {Promise<boolean>} Success status
   */
  saveConfig: async (configType, configData) => {
    try {
      const { error } = await supabase
        .from('prompt_config')
        .upsert({
          id: configType,
          config_type: configType,
          config_data: configData,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`Failed to save ${configType} config:`, error);
        return false;
      }

      console.log(`✅ Saved ${configType} config to Supabase`);
      return true;
    } catch (error) {
      console.error(`Error saving ${configType} config:`, error);
      return false;
    }
  },

  /**
   * Get default configuration from JSON files
   * @param {string} configType - 'looking' or 'templates'
   * @returns {object} Default configuration
   */
  getDefaultConfig: (configType) => {
    if (configType === 'looking') {
      // Merge looking and visual_style from transformation_prompts.json
      return {
        ...transformationConfig.looking,
        ...transformationConfig.visual_style
      };
    } else if (configType === 'templates') {
      return styleTemplatesConfig.templates || {};
    }
    return {};
  },

  /**
   * Initialize Supabase with default configs if empty
   * @returns {Promise<void>}
   */
  initializeDefaults: async () => {
    try {
      // Check if configs exist
      const { data: lookingData } = await supabase
        .from('prompt_config')
        .select('config_data')
        .eq('id', 'looking')
        .single();

      const { data: templatesData } = await supabase
        .from('prompt_config')
        .select('config_data')
        .eq('id', 'templates')
        .single();

      // Initialize if empty
      if (!lookingData || !lookingData.config_data || Object.keys(lookingData.config_data).length === 0) {
        const defaultLooking = configService.getDefaultConfig('looking');
        await configService.saveConfig('looking', defaultLooking);
        console.log('Initialized looking config with defaults');
      }

      if (!templatesData || !templatesData.config_data || Object.keys(templatesData.config_data).length === 0) {
        const defaultTemplates = configService.getDefaultConfig('templates');
        await configService.saveConfig('templates', defaultTemplates);
        console.log('Initialized templates config with defaults');
      }
    } catch (error) {
      console.error('Error initializing default configs:', error);
    }
  },

  /**
   * Ensure all items have an order field
   * Auto-assign order if missing based on current object key order
   * @param {object} config - Configuration object
   * @returns {object} Configuration with order fields
   */
  ensureOrder: (config) => {
    const entries = Object.entries(config);
    const result = {};

    entries.forEach(([key, value], index) => {
      result[key] = {
        ...value,
        order: value.order !== undefined ? value.order : index
      };
    });

    return result;
  }
};

export default configService;
