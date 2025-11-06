import { create } from 'zustand';
import configService from '../services/configService';

const useAppStore = create((set) => ({
  // User identity
  identityPhoto: null,
  setIdentityPhoto: (photo) => set({ identityPhoto: photo }),

  // Edit style selection
  selectedTransformation: null, // Edit style ID from edit_options (e.g., 'better_looking', 'japanese_looking', 'more_male', etc.)
  setSelectedTransformation: (transformation) => set({ selectedTransformation: transformation }),

  // Style templates
  selectedTemplate: null, // 'T1', 'T2', 'T3', 'T4', 'T5'
  setSelectedTemplate: (template) => set({ selectedTemplate: template }),

  // Generated photos from transformations
  generatedPhotos: [],
  addGeneratedPhoto: (photo) => set((state) => ({
    generatedPhotos: [...state.generatedPhotos, photo]
  })),
  clearGeneratedPhotos: () => set({ generatedPhotos: [] }),

  // Posts
  posts: [],
  addPost: (post) => set((state) => ({
    posts: [post, ...state.posts]
  })),

  // Current user profile
  currentUser: {
    id: 'user-1',
    username: 'Demo User',
    avatar: null,
  },
  setCurrentUser: (user) => set({ currentUser: user }),

  // Mobile frame state (for desktop view)
  isMobileFrameEnabled: typeof window !== 'undefined'
    ? localStorage.getItem('mobileFrameEnabled') !== 'false'
    : true,
  toggleMobileFrame: () => set((state) => {
    const newValue = !state.isMobileFrameEnabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mobileFrameEnabled', String(newValue));
    }
    return { isMobileFrameEnabled: newValue };
  }),

  // Cache mode state
  cacheMode: false, // true = use cached results, false = call API
  setCacheMode: (enabled) => set({ cacheMode: enabled }),

  selectedTestImageId: null, // Currently selected test image for cache
  setSelectedTestImageId: (id) => set({ selectedTestImageId: id }),

  cachedGenerations: {}, // Store cached generation results
  setCachedGenerations: (data) => set({ cachedGenerations: data }),

  // Configuration state
  transformationPrompts: null, // Loaded from Supabase
  styleTemplates: null, // Loaded from Supabase
  configLoaded: false, // Track if config has been loaded
  configError: null, // Store any config loading errors

  /**
   * Load configuration from Supabase
   */
  loadConfigFromSupabase: async () => {
    try {
      console.log('[appStore] Loading configuration from Supabase...');
      set({ configError: null });

      // Load transformation prompts (looking config)
      const transformationPrompts = await configService.loadItems('looking');
      console.log('[appStore] Loaded transformation prompts from Supabase');

      // Load style templates (templates config)
      const styleTemplates = await configService.loadItems('templates');
      console.log('[appStore] Loaded style templates from Supabase');

      set({
        transformationPrompts,
        styleTemplates,
        configLoaded: true,
      });

      console.log('[appStore] Configuration loaded successfully');
    } catch (error) {
      console.error('[appStore] Error loading configuration from Supabase:', error);

      set({
        transformationPrompts: {},
        styleTemplates: {},
        configLoaded: true,
        configError: error.message,
      });
    }
  },

  /**
   * Refresh configuration from Supabase
   * Useful when admin updates config
   */
  refreshConfig: async () => {
    const { loadConfigFromSupabase } = useAppStore.getState();
    await loadConfigFromSupabase();
  },
}));

export default useAppStore;
