import { useState, useEffect } from 'react'
import { onboardingService } from '../../../services/onboardingService'

const CACHE_KEY = 'onboarding_config_cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 分钟

export const useOnboardingConfig = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    loadActiveConfig()
  }, [])

  // 从缓存加载配置
  const loadFromCache = () => {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) return null

      const { data, timestamp } = JSON.parse(cached)
      const age = Date.now() - timestamp

      if (age < CACHE_DURATION) {
        console.log(`[useOnboardingConfig] Loaded from cache (${Math.round(age / 1000)}s old)`)
        return data
      } else {
        console.log('[useOnboardingConfig] Cache expired, fetching fresh data')
        localStorage.removeItem(CACHE_KEY)
        return null
      }
    } catch (err) {
      console.error('[useOnboardingConfig] Cache read error:', err)
      localStorage.removeItem(CACHE_KEY)
      return null
    }
  }

  // 保存配置到缓存
  const saveToCache = (data) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }))
      console.log('[useOnboardingConfig] Config cached successfully')
    } catch (err) {
      console.error('[useOnboardingConfig] Cache write error:', err)
    }
  }

  // 加载配置（优先从缓存）
  const loadActiveConfig = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      setFromCache(false)

      // 如果不强制刷新，先尝试缓存
      if (!forceRefresh) {
        const cachedData = loadFromCache()
        if (cachedData) {
          setConfig(cachedData)
          setFromCache(true)
          setLoading(false)
          return
        }
      }

      // 从 Supabase 加载
      const data = await onboardingService.getActiveConfig()
      setConfig(data)
      saveToCache(data)
    } catch (err) {
      console.error('[useOnboardingConfig] Failed to load config:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 清除缓存（Admin更新配置后调用）
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY)
    console.log('[useOnboardingConfig] Cache cleared')
  }

  return {
    config,
    loading,
    error,
    fromCache,
    reload: loadActiveConfig,
    clearCache
  }
}

export default useOnboardingConfig
