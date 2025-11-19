/**
 * useOrbStateMachine Hook
 * 光球状态机：自动管理光球状态转换和音频能量
 *
 * 状态流转：
 * IDLE → LISTENING → HEARING → THINKING → SPEAKING → IDLE
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import audioService from '../services/audioService'

const OrbStates = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  HEARING: 'HEARING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING'
}

export default function useOrbStateMachine() {
  const [orbMode, setOrbMode] = useState(OrbStates.IDLE)
  const [audioEnergy, setAudioEnergy] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)

  const stateRef = useRef({
    currentMode: OrbStates.IDLE,
    isListening: false,
    isSpeaking: false
  })

  // 更新状态引用
  useEffect(() => {
    stateRef.current.currentMode = orbMode
  }, [orbMode])

  /**
   * 开始监听用户输入
   * @param {object} options - 配置选项
   * @param {boolean} options.enableVAD - 是否启用语音活动检测
   * @param {Function} options.onSilence - 检测到静默时的回调
   * @returns {Promise<boolean>} 是否成功
   */
  const startListening = useCallback(async (options = {}) => {
    if (stateRef.current.isListening) {
      console.warn('[useOrbStateMachine] Already listening')
      return false
    }

    setOrbMode(OrbStates.LISTENING)
    stateRef.current.isListening = true

    // 启用 VAD（可选）
    if (options.enableVAD) {
      audioService.enableVAD(
        options.vadThreshold || 0.05,
        options.vadSilenceDuration || 1500,
        () => {
          if (options.onSilence) {
            options.onSilence()
          }
          stopListening()
        }
      )
    }

    // 启动麦克风
    const success = await audioService.startMicrophone((energy) => {
      setAudioEnergy(energy)

      // 根据能量切换 LISTENING/HEARING 状态
      if (stateRef.current.currentMode === OrbStates.LISTENING && energy > 0.1) {
        setOrbMode(OrbStates.HEARING)
      } else if (stateRef.current.currentMode === OrbStates.HEARING && energy <= 0.05) {
        setOrbMode(OrbStates.LISTENING)
      }
    })

    if (!success) {
      console.error('[useOrbStateMachine] Failed to start microphone')
      setOrbMode(OrbStates.IDLE)
      stateRef.current.isListening = false
      return false
    }

    console.log('[useOrbStateMachine] Started listening')
    return true
  }, [])

  /**
   * 停止监听
   */
  const stopListening = useCallback(() => {
    if (!stateRef.current.isListening) return

    audioService.stopMicrophone()
    audioService.disableVAD()
    stateRef.current.isListening = false
    setAudioEnergy(0)

    console.log('[useOrbStateMachine] Stopped listening')

    // 如果没有在说话或思考，返回 IDLE
    if (stateRef.current.currentMode !== OrbStates.THINKING &&
        stateRef.current.currentMode !== OrbStates.SPEAKING) {
      setOrbMode(OrbStates.IDLE)
    }
  }, [])

  /**
   * 开始思考（AI 处理中）
   */
  const startThinking = useCallback(() => {
    setOrbMode(OrbStates.THINKING)
    setAudioEnergy(0)
    setIsProcessing(true)

    console.log('[useOrbStateMachine] Started thinking')
  }, [])

  /**
   * 停止思考
   */
  const stopThinking = useCallback(() => {
    if (stateRef.current.currentMode === OrbStates.THINKING) {
      setOrbMode(OrbStates.IDLE)
      setIsProcessing(false)
      console.log('[useOrbStateMachine] Stopped thinking')
    }
  }, [])

  /**
   * 开始说话（播放 TTS）
   * @param {string} audioUrl - 音频 URL
   * @returns {Promise<void>}
   */
  const startSpeaking = useCallback(async (audioUrl) => {
    if (stateRef.current.isSpeaking) {
      console.warn('[useOrbStateMachine] Already speaking, stopping current audio')
      audioService.stopCurrentAudio()
    }

    setOrbMode(OrbStates.SPEAKING)
    stateRef.current.isSpeaking = true
    setIsProcessing(false)

    console.log('[useOrbStateMachine] Started speaking')

    try {
      // 播放音频并实时分析能量
      await audioService.playWithAnalysis(audioUrl, (energy) => {
        setAudioEnergy(energy)
      })
    } catch (error) {
      console.error('[useOrbStateMachine] Failed to play audio:', error)
    } finally {
      stopSpeaking()
    }
  }, [])

  /**
   * 停止说话
   */
  const stopSpeaking = useCallback(() => {
    if (!stateRef.current.isSpeaking) return

    audioService.stopCurrentAudio()
    stateRef.current.isSpeaking = false
    setAudioEnergy(0)
    setOrbMode(OrbStates.IDLE)

    console.log('[useOrbStateMachine] Stopped speaking')
  }, [])

  /**
   * 重置到 IDLE 状态
   */
  const reset = useCallback(() => {
    stopListening()
    stopSpeaking()
    stopThinking()
    setOrbMode(OrbStates.IDLE)
    setAudioEnergy(0)
    setIsProcessing(false)

    console.log('[useOrbStateMachine] Reset to IDLE')
  }, [stopListening, stopSpeaking, stopThinking])

  /**
   * 手动设置状态（高级用法）
   */
  const setState = useCallback((mode) => {
    if (!Object.values(OrbStates).includes(mode)) {
      console.warn(`[useOrbStateMachine] Invalid mode: ${mode}`)
      return
    }
    setOrbMode(mode)
  }, [])

  /**
   * 完整的对话循环
   * @param {object} options - 配置选项
   * @param {Function} options.onUserInput - 用户输入回调 (text) => Promise<audioUrl>
   * @param {boolean} options.enableVAD - 是否启用 VAD
   */
  const startConversation = useCallback(async (options = {}) => {
    const { onUserInput, enableVAD = true } = options

    // 1. 开始监听
    const success = await startListening({
      enableVAD,
      onSilence: async () => {
        // VAD 检测到静默后自动处理
        if (onUserInput) {
          startThinking()

          try {
            // 调用用户的处理函数（通常是 AI API）
            const audioUrl = await onUserInput()

            if (audioUrl) {
              await startSpeaking(audioUrl)
            } else {
              stopThinking()
            }
          } catch (error) {
            console.error('[useOrbStateMachine] Conversation error:', error)
            reset()
          }
        }
      }
    })

    if (!success) {
      console.error('[useOrbStateMachine] Failed to start conversation')
    }
  }, [startListening, startThinking, startSpeaking, stopThinking, reset])

  /**
   * 清理资源（组件卸载时调用）
   */
  useEffect(() => {
    return () => {
      audioService.stopMicrophone()
      audioService.stopCurrentAudio()
      audioService.disableVAD()
    }
  }, [])

  return {
    // 状态
    orbMode,
    audioEnergy,
    isProcessing,
    isIdle: orbMode === OrbStates.IDLE,
    isListening: orbMode === OrbStates.LISTENING || orbMode === OrbStates.HEARING,
    isThinking: orbMode === OrbStates.THINKING,
    isSpeaking: orbMode === OrbStates.SPEAKING,

    // 控制方法
    startListening,
    stopListening,
    startThinking,
    stopThinking,
    startSpeaking,
    stopSpeaking,
    reset,
    setState,
    startConversation,

    // 状态常量
    OrbStates
  }
}
