// Supabase API service for transformations
import supabase from './supabaseClient';

export const supabaseApi = {
  /**
   * Call the transform-image edge function
   * @param {string} identityPhotoUrl - URL of the identity photo
   * @param {string} lookingType - Looking type ID
   * @param {string} visualStyle - Visual style ID
   * @returns {Promise<object>} Transformation result
   */
  transformImage: async (identityPhotoUrl, lookingType, visualStyle) => {
    try {
      console.log('[supabaseApi] Starting transformImage...');
      console.log('[supabaseApi] Identity photo URL:', identityPhotoUrl);
      console.log('[supabaseApi] Looking type:', lookingType);
      console.log('[supabaseApi] Visual style:', visualStyle);

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
          lookingType,
          visualStyle,
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
   * Call the batch-transform edge function to generate all looking options
   * @param {string} identityPhotoUrl - URL of the identity photo
   * @param {string} visualStyle - Visual style ID (default: 'realistic')
   * @param {Array<string>} lookingTypes - Optional array of specific looking types
   * @returns {Promise<object>} Batch transformation results
   */
  batchTransform: async (identityPhotoUrl, visualStyle = 'realistic', lookingTypes = null) => {
    try {
      console.log('[supabaseApi] Starting batchTransform...');
      console.log('[supabaseApi] Identity photo URL:', identityPhotoUrl);
      console.log('[supabaseApi] Visual style:', visualStyle);
      console.log('[supabaseApi] Looking types:', lookingTypes);

      // Get user (optional - edge function works without auth)
      let userId = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id;
        console.log('[supabaseApi] User ID:', userId || 'No user authenticated');
      } catch (authError) {
        console.warn('[supabaseApi] No authenticated user, proceeding without userId:', authError);
      }

      console.log('[supabaseApi] Invoking batch-transform edge function...');

      const { data, error } = await supabase.functions.invoke('batch-transform', {
        body: {
          identityPhotoUrl,
          visualStyle,
          userId,
          lookingTypes,
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
      console.error('[supabaseApi] Batch transform error:', error);
      throw error;
    }
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
          upsert: false
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
};

export default supabaseApi;
