// Supabase API service for transformations
import supabase from './supabaseClient';

export const supabaseApi = {
  /**
   * Call the transform-image edge function
   * @param {string} identityPhotoUrl - URL of the identity photo
   * @param {string} prompt - Complete AI prompt for transformation
   * @param {string} editStyleId - Edit style ID (optional)
   * @returns {Promise<object>} Transformation result
   */
  transformImage: async (identityPhotoUrl, prompt, editStyleId = null) => {
    try {
      console.log('[supabaseApi] Starting transformImage...');
      console.log('[supabaseApi] Identity photo URL:', identityPhotoUrl);
      console.log('[supabaseApi] Prompt:', prompt);
      console.log('[supabaseApi] Edit style ID:', editStyleId);

      // Get user (optional - edge function works without auth)
      let userId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        console.log('[supabaseApi] User ID:', userId || 'No user authenticated');
      } catch (authError) {
        console.warn('[supabaseApi] No authenticated user, proceeding without userId:', authError);
      }

      console.log('[supabaseApi] Invoking transform-image edge function...');

      const { data, error } = await supabase.functions.invoke('transform-image', {
        body: {
          identityPhotoUrl,
          prompt,
          editStyleId,
          userId,
        },
      });

      console.log('[supabaseApi] Edge function response:', { data, error });

      if (error) {
        console.error('[supabaseApi] Edge function error:', error);
        throw new Error(`Edge Function Error: ${error.message || JSON.stringify(error)}`);
      }

      if (!data) {
        throw new Error('No data returned from edge function');
      }

      return data;
    } catch (error) {
      console.error('[supabaseApi] Transform image error:', error);
      throw error;
    }
  },

  /**
   * Call the batch-image-generation edge function to generate all edit style variations
   * Includes validation and retry logic (retry once on failure)
   * @param {string} identityPhotoUrl - URL of the identity photo
   * @param {Array<{id: string, prompt: string}>} editStyles - Array of edit styles with id and prompt
   * @returns {Promise<object>} Batch image generation results
   */
  batchGenerateImages: async (identityPhotoUrl, editStyles) => {
    const maxRetries = 1;
    let lastError = null;

    // Validate inputs
    if (!identityPhotoUrl) {
      throw new Error('Identity photo URL is required');
    }

    if (!Array.isArray(editStyles) || editStyles.length === 0) {
      throw new Error('Edit styles array is required and must not be empty');
    }

    // Validate all edit styles have required fields
    const invalidStyles = editStyles.filter(style => !style.id || !style.prompt);
    if (invalidStyles.length > 0) {
      console.error('[supabaseApi] Invalid edit styles detected:', invalidStyles);
      throw new Error(`Some edit styles are missing required fields: ${invalidStyles.map(s => s.id).join(', ')}`);
    }

    // Retry logic
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[supabaseApi] Starting batch image generation (attempt ${attempt + 1}/${maxRetries + 1})...`);
        console.log('[supabaseApi] Identity photo URL:', identityPhotoUrl);
        console.log('[supabaseApi] Edit styles:', JSON.stringify(editStyles, null, 2));

        // Get user (optional - edge function works without auth)
        let userId = null;
        try {
          const { data: { user } } = await supabase.auth.getUser();
          userId = user?.id;
          console.log('[supabaseApi] User ID:', userId || 'No user authenticated');
        } catch (authError) {
          console.warn('[supabaseApi] No authenticated user, proceeding without userId:', authError);
        }

        console.log('[supabaseApi] Invoking batch-image-generation edge function...');

        const { data, error } = await supabase.functions.invoke('batch-image-generation', {
          body: {
            identityPhotoUrl,
            editStyles,
            userId,
          },
        });

        console.log('[supabaseApi] Edge function response:', { data, error });

        if (error) {
          lastError = new Error(`Edge Function Error: ${error.message || JSON.stringify(error)}`);
          console.error('[supabaseApi] Edge function error:', lastError);

          if (attempt < maxRetries) {
            console.log(`[supabaseApi] Retrying (${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
            continue;
          }
          throw lastError;
        }

        if (!data) {
          lastError = new Error('No data returned from edge function');
          console.error('[supabaseApi] No data error:', lastError);

          if (attempt < maxRetries) {
            console.log(`[supabaseApi] Retrying (${attempt + 1}/${maxRetries})...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          throw lastError;
        }

        console.log('[supabaseApi] Batch image generation successful');
        return data;
      } catch (error) {
        lastError = error;
        if (attempt === maxRetries) {
          console.error('[supabaseApi] Batch image generation failed after retries:', error);
          throw error;
        }
      }
    }

    throw lastError;
  },

  /**
   * Legacy alias for batchGenerateImages (deprecated)
   * @deprecated Use batchGenerateImages instead
   */
  batchTransform: async (identityPhotoUrl, editStyles) => {
    return supabaseApi.batchGenerateImages(identityPhotoUrl, editStyles);
  },

  /**
   * Upload identity photo to Supabase Storage
   * @param {File} file - Image file to upload
   * @param {string} userId - User ID (optional, will use anonymous folder if not provided)
   * @returns {Promise<object>} Upload result with URL
   */
  uploadIdentityPhoto: async (file, userId = null) => {
    try {
      const fileExt = file.name.split('.').pop();
      const userFolder = userId || `anonymous`;
      const fileName = `${userFolder}/${crypto.randomUUID()}.${fileExt}`;

      console.log('[supabaseApi] Uploading identity photo:', fileName);

      const { data, error } = await supabase.storage
        .from('identity-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg'
        });

      if (error) {
        console.error('[supabaseApi] Upload error:', error);
        throw error;
      }

      console.log('[supabaseApi] Upload successful:', data);

      const { data: { publicUrl } } = supabase.storage
        .from('identity-photos')
        .getPublicUrl(fileName);

      console.log('[supabaseApi] Public URL:', publicUrl);

      // Only create database record if userId is provided
      if (userId) {
        const { data: photoRecord, error: dbError } = await supabase
          .from('identity_photos')
          .insert({
            user_id: userId,
            photo_url: publicUrl,
            storage_path: fileName,
          })
          .select()
          .single();

        if (dbError) {
          console.warn('[supabaseApi] Database insert warning:', dbError);
        } else if (photoRecord) {
          return {
            id: photoRecord.id,
            url: publicUrl,
            storagePath: fileName,
          };
        }
      }

      return {
        id: `photo-${Date.now()}`,
        url: publicUrl,
        storagePath: fileName,
      };
    } catch (error) {
      console.error('Upload identity photo error:', error);
      throw error;
    }
  },

  /**
   * Get user's transformations
   * @param {string} userId - User ID
   * @param {number} limit - Number of results to return
   * @returns {Promise<Array>} List of transformations
   */
  getUserTransformations: async (userId, limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('transformations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get user transformations error:', error);
      throw error;
    }
  },

  /**
   * Get a specific transformation by ID
   * @param {string} transformationId - Transformation ID
   * @returns {Promise<object>} Transformation data
   */
  getTransformation: async (transformationId) => {
    try {
      const { data, error } = await supabase
        .from('transformations')
        .select('*')
        .eq('id', transformationId)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get transformation error:', error);
      throw error;
    }
  },

  /**
   * Create a post from a transformation
   * @param {string} userId - User ID
   * @param {string} transformationId - Transformation ID
   * @param {string} caption - Post caption
   * @returns {Promise<object>} Created post
   */
  createPost: async (userId, transformationId, caption) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          transformation_id: transformationId,
          caption,
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  },

  /**
   * Get feed posts
   * @param {number} limit - Number of posts to return
   * @param {number} offset - Offset for pagination
   * @returns {Promise<object>} Feed posts with pagination info
   */
  getFeedPosts: async (limit = 10, offset = 0) => {
    try {
      const { data, error, count } = await supabase
        .from('posts')
        .select('*, transformations(*), profiles(*)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return {
        posts: data,
        hasMore: (count || 0) > offset + limit,
        total: count,
      };
    } catch (error) {
      console.error('Get feed posts error:', error);
      throw error;
    }
  },

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Auth result
   */
  signUp: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  },

  /**
   * Sign in a user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<object>} Auth result
   */
  signIn: async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   * @returns {Promise<void>}
   */
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  /**
   * Get current user
   * @returns {Promise<object|null>} Current user or null
   */
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) throw error;

      return user;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  /**
   * Get prompt configuration from Supabase
   * @param {string} configType - Configuration type ('looking' or 'templates')
   * @returns {Promise<object>} Configuration data
   */
  getPromptConfig: async (configType) => {
    try {
      console.log('[supabaseApi] Getting prompt config:', configType);

      const { data, error } = await supabase
        .from('prompt_config')
        .select('config_data')
        .eq('config_type', configType)
        .single();

      if (error) {
        console.error('[supabaseApi] Get prompt config error:', error);
        throw error;
      }

      if (!data || !data.config_data) {
        throw new Error(`No configuration found for type: ${configType}`);
      }

      console.log('[supabaseApi] Prompt config loaded successfully');
      return data.config_data;
    } catch (error) {
      console.error('[supabaseApi] Get prompt config error:', error);
      throw error;
    }
  },
};

export default supabaseApi;
