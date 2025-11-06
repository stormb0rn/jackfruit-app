import { supabase } from './supabaseClient';

/**
 * Settings Service
 * Manages global application settings stored in Supabase
 */
const settingsService = {
  /**
   * Get global cache mode setting
   * @returns {Promise<boolean>} Cache mode enabled status
   */
  getGlobalCacheMode: async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('cache_mode_enabled')
        .eq('id', 'global')
        .single();

      if (error) {
        console.error('Failed to fetch global cache mode:', error);
        return false; // Default to false if fetch fails
      }

      return data?.cache_mode_enabled || false;
    } catch (error) {
      console.error('Error in getGlobalCacheMode:', error);
      return false;
    }
  },

  /**
   * Set global cache mode setting
   * @param {boolean} enabled - Whether cache mode should be enabled
   * @returns {Promise<boolean>} Success status
   */
  setGlobalCacheMode: async (enabled) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({
          cache_mode_enabled: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('id', 'global');

      if (error) {
        console.error('Failed to update global cache mode:', error);
        return false;
      }

      console.log('Global cache mode updated:', enabled);
      return true;
    } catch (error) {
      console.error('Error in setGlobalCacheMode:', error);
      return false;
    }
  },

  /**
   * Subscribe to cache mode changes in real-time
   * @param {Function} callback - Called when cache mode changes
   * @returns {Object} Subscription object with unsubscribe method
   */
  subscribeToCacheModeChanges: (callback) => {
    const subscription = supabase
      .channel('app_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'app_settings',
          filter: 'id=eq.global'
        },
        (payload) => {
          console.log('Cache mode changed:', payload.new.cache_mode_enabled);
          callback(payload.new.cache_mode_enabled);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription);
      }
    };
  }
};

export default settingsService;
