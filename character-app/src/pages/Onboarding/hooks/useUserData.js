import { useState } from 'react'
import { onboardingService } from '../../../services/onboardingService'

export const useUserData = () => {
  const [sessionId, setSessionId] = useState(null)
  const [userData, setUserData] = useState({
    name: '',
    photo_url: '',
    voice_url: '',
    choice: '',
    creation_prompt: ''
  })

  // 初始化会话
  const initSession = async (configId) => {
    try {
      const newSessionId = await onboardingService.createSession(configId)
      setSessionId(newSessionId)
      console.log('[useUserData] Session initialized:', newSessionId)
      return newSessionId
    } catch (error) {
      console.error('[useUserData] Failed to init session:', error)
      throw error
    }
  }

  // 更新用户数据
  const updateUserData = async (stepNumber, stepData) => {
    const newData = { ...userData, ...stepData }
    setUserData(newData)

    // 保存到数据库
    if (sessionId) {
      try {
        await onboardingService.updateSession(sessionId, stepNumber, newData)
        console.log('[useUserData] Data saved for step:', stepNumber)
      } catch (error) {
        console.error('[useUserData] Failed to save data:', error)
      }
    }
  }

  // 提交最终数据
  const submitUserData = async () => {
    if (!sessionId) {
      throw new Error('No active session')
    }

    try {
      await onboardingService.completeSession(sessionId, userData)
      console.log('[useUserData] Session completed')
      return { success: true }
    } catch (error) {
      console.error('[useUserData] Failed to submit:', error)
      throw error
    }
  }

  return {
    sessionId,
    userData,
    updateUserData,
    submitUserData,
    initSession
  }
}

export default useUserData
