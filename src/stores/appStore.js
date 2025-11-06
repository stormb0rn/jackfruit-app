import { create } from 'zustand';

const useAppStore = create((set) => ({
  // User identity
  identityPhoto: null,
  setIdentityPhoto: (photo) => set({ identityPhoto: photo }),

  // Look transformation
  selectedTransformation: null, // 'better-looking', 'japanese', 'male', 'female', 'white-skin'
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

  // UI state
  currentStep: 'upload', // 'upload', 'edit-look', 'templates', 'create-post', 'feed'
  setCurrentStep: (step) => set({ currentStep: step }),

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
}));

export default useAppStore;
