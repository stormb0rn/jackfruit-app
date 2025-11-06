import { supabase } from './supabaseClient';
import transformationConfig from '../config/transformation_prompts.json';
import styleTemplatesConfig from '../config/style_templates.json';

/**
 * Config Service
 * Manages prompt items in Supabase prompt_items table
 */
const configService = {
  /**
   * Load all items of a category from Supabase
   * Falls back to JSON files if Supabase is empty
   * @param {string} category - 'looking' or 'templates'
   * @returns {Promise<object>} Items as object keyed by id
   */
  loadItems: async (category) => {
    try {
      const { data, error } = await supabase
        .from('prompt_items')
        .select('*')
        .eq('category', category)
        .eq('enabled', true)
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (error) {
        console.error(`[configService] Failed to load ${category} items:`, error);
        return configService.getDefaultItems(category);
      }

      if (!data || data.length === 0) {
        console.log(`[configService] No ${category} items in Supabase, using defaults`);
        return configService.getDefaultItems(category);
      }

      // Convert array to object keyed by id
      const itemsObj = {};
      data.forEach(item => {
        itemsObj[item.id] = item;
      });

      console.log(`[configService] Loaded ${category} items from Supabase: ${data.length} items`);
      return itemsObj;
    } catch (error) {
      console.error(`[configService] Error loading ${category} items:`, error);
      return configService.getDefaultItems(category);
    }
  },

  /**
   * Save a single item to Supabase
   * @param {string} category - 'looking' or 'templates'
   * @param {string} id - Item id
   * @param {object} itemData - Item data (name, prompts, image_path, enabled, display_order)
   * @returns {Promise<boolean>} Success status
   */
  saveItem: async (category, id, itemData) => {
    try {
      const { error } = await supabase
        .from('prompt_items')
        .upsert({
          id,
          category,
          name: itemData.name,
          prompts: itemData.prompts,
          image_path: itemData.image_path || null,
          enabled: itemData.enabled !== undefined ? itemData.enabled : true,
          display_order: itemData.display_order || 0,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error(`[configService] Failed to save ${category} item ${id}:`, error);
        return false;
      }

      console.log(`[configService] ✅ Saved ${category} item: ${id}`);
      return true;
    } catch (error) {
      console.error(`[configService] Error saving ${category} item:`, error);
      return false;
    }
  },

  /**
   * Delete a single item (soft delete)
   * @param {string} id - Item id
   * @returns {Promise<boolean>} Success status
   */
  deleteItem: async (id) => {
    try {
      const { error } = await supabase
        .from('prompt_items')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error(`[configService] Failed to delete item ${id}:`, error);
        return false;
      }

      console.log(`[configService] ✅ Deleted item: ${id}`);
      return true;
    } catch (error) {
      console.error(`[configService] Error deleting item:`, error);
      return false;
    }
  },

  /**
   * Restore a soft-deleted item
   * @param {string} id - Item id
   * @returns {Promise<boolean>} Success status
   */
  restoreItem: async (id) => {
    try {
      const { error } = await supabase
        .from('prompt_items')
        .update({ deleted_at: null })
        .eq('id', id);

      if (error) {
        console.error(`[configService] Failed to restore item ${id}:`, error);
        return false;
      }

      console.log(`[configService] ✅ Restored item: ${id}`);
      return true;
    } catch (error) {
      console.error(`[configService] Error restoring item:`, error);
      return false;
    }
  },

  /**
   * Update display order of items
   * @param {string} category - 'looking' or 'templates'
   * @param {array} items - Items with updated display_order
   * @returns {Promise<boolean>} Success status
   */
  updateOrder: async (category, items) => {
    try {
      const updates = items.map(item => ({
        id: item.id,
        category,
        display_order: item.display_order,
        updated_at: new Date().toISOString()
      }));

      // Upsert each item with new order
      for (const update of updates) {
        const { error } = await supabase
          .from('prompt_items')
          .update({ display_order: update.display_order, updated_at: update.updated_at })
          .eq('id', update.id);

        if (error) {
          console.error(`[configService] Failed to update order for ${update.id}:`, error);
          return false;
        }
      }

      console.log(`[configService] ✅ Updated order for ${updates.length} ${category} items`);
      return true;
    } catch (error) {
      console.error(`[configService] Error updating order:`, error);
      return false;
    }
  },

  /**
   * Get deleted items for a category
   * @param {string} category - 'looking' or 'templates'
   * @returns {Promise<object>} Deleted items as object
   */
  getDeletedItems: async (category) => {
    try {
      const { data, error } = await supabase
        .from('prompt_items')
        .select('*')
        .eq('category', category)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false });

      if (error) {
        console.error(`[configService] Failed to load deleted ${category} items:`, error);
        return {};
      }

      const itemsObj = {};
      if (data) {
        data.forEach(item => {
          itemsObj[item.id] = item;
        });
      }

      return itemsObj;
    } catch (error) {
      console.error(`[configService] Error loading deleted items:`, error);
      return {};
    }
  },

  /**
   * Get default configuration from JSON files
   * @param {string} category - 'looking' or 'templates'
   * @returns {object} Default items as object
   */
  getDefaultItems: (category) => {
    if (category === 'looking') {
      const editOptions = transformationConfig.edit_options || {};
      return editOptions;
    } else if (category === 'templates') {
      return styleTemplatesConfig.templates || {};
    }
    return {};
  }
};

export default configService;
