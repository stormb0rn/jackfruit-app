import { supabase } from './supabaseClient'

/**
 * Onboarding Service
 * 处理 Onboarding 配置和会话管理
 */

export const onboardingService = {
  /**
   * 获取激活的 Onboarding 配置（包含主题）
   */
  async getActiveConfig() {
    try {
      const startTime = performance.now()
      console.log('[onboardingService] Fetching active config and theme...')

      // 并行查询配置和主题（减少50%等待时间）
      const [configResult, themeResult] = await Promise.all([
        supabase
          .from('onboarding_configs')
          .select('*')
          .eq('is_active', true)
          .single(),
        supabase
          .from('onboarding_theme')
          .select('*')
          .single()
      ])

      // 检查配置错误
      if (configResult.error) {
        console.error('[onboardingService] Error fetching config:', configResult.error)
        throw configResult.error
      }

      if (!configResult.data) {
        throw new Error('No active onboarding configuration found')
      }

      // 检查主题错误
      if (themeResult.error) {
        console.error('[onboardingService] Error fetching theme:', themeResult.error)
        throw themeResult.error
      }

      if (!themeResult.data) {
        throw new Error('No onboarding theme found')
      }

      const config = configResult.data
      const theme = themeResult.data

      // 合并配置和主题
      const mergedConfig = {
        ...config,
        global_styles: theme.global_styles,
        step_1_splash: theme.step_1_splash,
        step_2_guidance: theme.step_2_guidance,
        step_3_identity_input: theme.step_3_identity_input,
        step_4_choice: theme.step_4_choice,
        step_5_creation: theme.step_5_creation,
        step_6_finalizing: theme.step_6_finalizing,
        step_7_entry: theme.step_7_entry,
        theme_id: theme.theme_id,
        theme_name: theme.theme_name
      }

      const loadTime = Math.round(performance.now() - startTime)
      console.log(`[onboardingService] Config loaded in ${loadTime}ms:`, config.config_name, 'Theme:', theme.theme_name)
      return mergedConfig
    } catch (error) {
      console.error('[onboardingService] Failed to get active config:', error)
      throw error
    }
  },

  /**
   * 创建新的 Onboarding 会话
   */
  async createSession(configId) {
    try {
      console.log('[onboardingService] Creating session for config:', configId)

      const { data, error } = await supabase
        .from('onboarding_sessions')
        .insert([
          {
            config_id: configId,
            current_step: 1,
            ip_address: null,  // 可以通过 API 获取
            user_agent: navigator.userAgent
          }
        ])
        .select()
        .single()

      if (error) {
        console.error('[onboardingService] Error creating session:', error)
        throw error
      }

      console.log('[onboardingService] Session created:', data.session_id)
      return data.session_id
    } catch (error) {
      console.error('[onboardingService] Failed to create session:', error)
      throw error
    }
  },

  /**
   * 更新会话数据
   */
  async updateSession(sessionId, currentStep, userData) {
    try {
      console.log('[onboardingService] Updating session:', sessionId, 'step:', currentStep)

      const updateData = {
        current_step: currentStep,
        ...userData  // 展开用户数据（name, photo_url, choice 等）
      }

      const { error } = await supabase
        .from('onboarding_sessions')
        .update(updateData)
        .eq('session_id', sessionId)

      if (error) {
        console.error('[onboardingService] Error updating session:', error)
        throw error
      }

      console.log('[onboardingService] Session updated successfully')
    } catch (error) {
      console.error('[onboardingService] Failed to update session:', error)
      throw error
    }
  },

  /**
   * 完成会话
   */
  async completeSession(sessionId, finalUserData) {
    try {
      console.log('[onboardingService] Completing session:', sessionId)

      const { error } = await supabase
        .from('onboarding_sessions')
        .update({
          ...finalUserData,
          completed: true,
          completed_at: new Date().toISOString(),
          current_step: 7
        })
        .eq('session_id', sessionId)

      if (error) {
        console.error('[onboardingService] Error completing session:', error)
        throw error
      }

      console.log('[onboardingService] Session completed successfully')
    } catch (error) {
      console.error('[onboardingService] Failed to complete session:', error)
      throw error
    }
  },

  /**
   * 上传文件到 Supabase Storage
   */
  async uploadFile(file, sessionId, fileType = 'photo') {
    try {
      console.log('[onboardingService] Uploading file:', file.name)

      const fileExt = file.name.split('.').pop()
      const fileName = `${sessionId}/${fileType}-${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('onboarding-uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('[onboardingService] Error uploading file:', error)
        throw error
      }

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('onboarding-uploads')
        .getPublicUrl(fileName)

      console.log('[onboardingService] File uploaded:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error('[onboardingService] Failed to upload file:', error)
      throw error
    }
  }
}

export default onboardingService
