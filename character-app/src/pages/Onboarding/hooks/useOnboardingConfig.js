import { useState, useEffect } from 'react'
import { onboardingService } from '../../../services/onboardingService'

export const useOnboardingConfig = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadActiveConfig()
  }, [])

  const loadActiveConfig = async () => {
    try {
      setLoading(true)
      setError(null)

      const data = await onboardingService.getActiveConfig()
      setConfig(data)
    } catch (err) {
      console.error('[useOnboardingConfig] Failed to load config:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return { config, loading, error, reload: loadActiveConfig }
}

export default useOnboardingConfig
