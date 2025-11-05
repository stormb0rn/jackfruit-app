// Placeholder API service for future Supabase integration

// Mock delay to simulate API calls
const mockDelay = (ms = 1000) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
  // Identity/Profile endpoints
  uploadIdentityPhoto: async (file) => {
    await mockDelay(1500);
    // TODO: Upload to Supabase storage
    return {
      url: URL.createObjectURL(file),
      id: `photo-${Date.now()}`
    };
  },

  // Transformation endpoints
  generateTransformation: async (identityPhotoUrl, transformationType, templateId) => {
    // Import FAL API service
    const { falApi } = await import('./falApi.js');
    const { configLoader } = await import('../utils/configLoader.js');

    try {
      // Get looking and visual style configurations
      const lookingConfig = configLoader.getLookingById(transformationType);
      const visualStyleConfig = configLoader.getVisualStyleById(templateId);

      if (!lookingConfig || !visualStyleConfig) {
        throw new Error('Invalid transformation or template ID');
      }

      // Call FAL API to transform the image
      const result = await falApi.transformCharacter(
        identityPhotoUrl,
        lookingConfig,
        visualStyleConfig,
        {
          numImages: 1,
          outputFormat: 'jpeg',
          aspectRatio: '1:1'
        }
      );

      // Return formatted result
      return {
        id: `transform-${Date.now()}`,
        url: result.images?.[0]?.url || '',
        type: transformationType,
        template: templateId,
        description: result.description || '',
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Transformation error:', error);
      // Fallback to mock for development
      await mockDelay(2000);
      return {
        id: `transform-${Date.now()}`,
        url: `https://via.placeholder.com/400x400?text=${transformationType}+${templateId}`,
        type: transformationType,
        template: templateId,
        createdAt: new Date().toISOString()
      };
    }
  },

  // Post endpoints
  createPost: async (postData) => {
    await mockDelay(1000);
    // TODO: Save post to Supabase
    return {
      id: `post-${Date.now()}`,
      ...postData,
      likes: 0,
      comments: 0,
      createdAt: new Date().toISOString()
    };
  },

  getFeed: async (page = 0, limit = 10) => {
    await mockDelay(800);
    // TODO: Fetch from Supabase
    return {
      posts: [],
      hasMore: false
    };
  },

  getUserProfile: async (userId) => {
    await mockDelay(800);
    // TODO: Fetch from Supabase
    return {
      id: userId,
      username: 'Demo User',
      avatar: null,
      posts: []
    };
  },

  // Template endpoints
  getTemplates: async () => {
    await mockDelay(500);
    // TODO: Fetch from Supabase
    return [
      { id: 'T1', name: 'Style 1', thumbnail: 'https://via.placeholder.com/150?text=T1' },
      { id: 'T2', name: 'Style 2', thumbnail: 'https://via.placeholder.com/150?text=T2' },
      { id: 'T3', name: 'Style 3', thumbnail: 'https://via.placeholder.com/150?text=T3' },
      { id: 'T4', name: 'Style 4', thumbnail: 'https://via.placeholder.com/150?text=T4' },
      { id: 'T5', name: 'Style 5', thumbnail: 'https://via.placeholder.com/150?text=T5' },
    ];
  }
};
