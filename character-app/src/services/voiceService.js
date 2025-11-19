/**
 * Voice Service - 语音交互服务
 *
 * 功能：
 * 1. 语音识别（Speech Recognition）
 * 2. 文本转语音（TTS - Text-to-Speech）
 * 3. 语音状态管理
 */

class VoiceService {
  constructor() {
    // 语音识别
    this.recognition = null
    this.isRecognizing = false
    this.recognitionCallbacks = {
      onResult: null,
      onEnd: null,
      onError: null
    }

    // TTS
    this.synthesis = window.speechSynthesis
    this.currentUtterance = null
    this.ttsCallbacks = {
      onStart: null,
      onEnd: null,
      onError: null
    }

    // 语言设置
    this.recognitionLang = 'zh-CN'  // 默认中文识别
    this.ttsLang = 'zh-CN'          // 默认中文 TTS

    console.log('[VoiceService] Initialized')
  }

  /**
   * 初始化语音识别
   */
  initRecognition() {
    if (this.recognition) return true

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('[VoiceService] Speech Recognition not supported')
      return false
    }

    this.recognition = new SpeechRecognition()
    this.recognition.continuous = false       // 单次识别
    this.recognition.interimResults = true    // 实时返回临时结果
    this.recognition.lang = this.recognitionLang

    // 识别结果回调
    this.recognition.onresult = (event) => {
      let interimTranscript = ''
      let finalTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      if (this.recognitionCallbacks.onResult) {
        this.recognitionCallbacks.onResult({
          final: finalTranscript,
          interim: interimTranscript
        })
      }

      console.log('[VoiceService] Recognition result:', { finalTranscript, interimTranscript })
    }

    // 识别结束回调
    this.recognition.onend = () => {
      this.isRecognizing = false
      if (this.recognitionCallbacks.onEnd) {
        this.recognitionCallbacks.onEnd()
      }
      console.log('[VoiceService] Recognition ended')
    }

    // 错误处理
    this.recognition.onerror = (event) => {
      console.error('[VoiceService] Recognition error:', event.error)
      this.isRecognizing = false
      if (this.recognitionCallbacks.onError) {
        this.recognitionCallbacks.onError(event.error)
      }
    }

    console.log('[VoiceService] Speech Recognition initialized')
    return true
  }

  /**
   * 开始语音识别
   * @param {Object} callbacks - 回调函数 { onResult, onEnd, onError }
   * @returns {boolean} 是否成功启动
   */
  startRecognition(callbacks = {}) {
    if (!this.initRecognition()) {
      return false
    }

    if (this.isRecognizing) {
      console.warn('[VoiceService] Recognition already in progress')
      return false
    }

    // 设置回调
    this.recognitionCallbacks = {
      onResult: callbacks.onResult || null,
      onEnd: callbacks.onEnd || null,
      onError: callbacks.onError || null
    }

    try {
      this.recognition.start()
      this.isRecognizing = true
      console.log('[VoiceService] Recognition started')
      return true
    } catch (err) {
      console.error('[VoiceService] Failed to start recognition:', err)
      return false
    }
  }

  /**
   * 停止语音识别
   */
  stopRecognition() {
    if (this.recognition && this.isRecognizing) {
      this.recognition.stop()
      this.isRecognizing = false
      console.log('[VoiceService] Recognition stopped')
    }
  }

  /**
   * 文本转语音（TTS）
   * @param {string} text - 要朗读的文本
   * @param {Object} options - TTS 选项 { rate, pitch, volume, voice, callbacks }
   */
  speak(text, options = {}) {
    if (!this.synthesis) {
      console.error('[VoiceService] Speech Synthesis not supported')
      return false
    }

    // 停止当前播放
    this.stopSpeaking()

    // 创建语音合成实例
    this.currentUtterance = new SpeechSynthesisUtterance(text)
    this.currentUtterance.lang = options.lang || this.ttsLang
    this.currentUtterance.rate = options.rate || 1.0      // 语速 (0.1 - 10)
    this.currentUtterance.pitch = options.pitch || 1.0    // 音调 (0 - 2)
    this.currentUtterance.volume = options.volume || 1.0  // 音量 (0 - 1)

    // 选择语音
    if (options.voice) {
      this.currentUtterance.voice = options.voice
    } else {
      // 自动选择中文语音
      const voices = this.synthesis.getVoices()
      const chineseVoice = voices.find(v => v.lang.startsWith('zh'))
      if (chineseVoice) {
        this.currentUtterance.voice = chineseVoice
      }
    }

    // 设置回调
    const callbacks = options.callbacks || {}

    this.currentUtterance.onstart = () => {
      console.log('[VoiceService] TTS started')
      if (callbacks.onStart) callbacks.onStart()
    }

    this.currentUtterance.onend = () => {
      console.log('[VoiceService] TTS ended')
      this.currentUtterance = null
      if (callbacks.onEnd) callbacks.onEnd()
    }

    this.currentUtterance.onerror = (event) => {
      console.error('[VoiceService] TTS error:', event.error)
      this.currentUtterance = null
      if (callbacks.onError) callbacks.onError(event.error)
    }

    // 开始播放
    this.synthesis.speak(this.currentUtterance)
    console.log('[VoiceService] Speaking:', text.substring(0, 50) + '...')
    return true
  }

  /**
   * 停止 TTS 播放
   */
  stopSpeaking() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.cancel()
      this.currentUtterance = null
      console.log('[VoiceService] TTS stopped')
    }
  }

  /**
   * 暂停 TTS 播放
   */
  pauseSpeaking() {
    if (this.synthesis && this.synthesis.speaking) {
      this.synthesis.pause()
      console.log('[VoiceService] TTS paused')
    }
  }

  /**
   * 恢复 TTS 播放
   */
  resumeSpeaking() {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume()
      console.log('[VoiceService] TTS resumed')
    }
  }

  /**
   * 获取可用的语音列表
   * @returns {SpeechSynthesisVoice[]} 语音列表
   */
  getVoices() {
    if (!this.synthesis) return []
    return this.synthesis.getVoices()
  }

  /**
   * 获取中文语音列表
   * @returns {SpeechSynthesisVoice[]} 中文语音列表
   */
  getChineseVoices() {
    return this.getVoices().filter(v => v.lang.startsWith('zh'))
  }

  /**
   * 设置识别语言
   * @param {string} lang - 语言代码（如 'zh-CN', 'en-US'）
   */
  setRecognitionLanguage(lang) {
    this.recognitionLang = lang
    if (this.recognition) {
      this.recognition.lang = lang
    }
    console.log('[VoiceService] Recognition language set to:', lang)
  }

  /**
   * 设置 TTS 语言
   * @param {string} lang - 语言代码
   */
  setTTSLanguage(lang) {
    this.ttsLang = lang
    console.log('[VoiceService] TTS language set to:', lang)
  }

  /**
   * 检测浏览器是否支持语音功能
   * @returns {Object} 支持情况 { recognition, synthesis }
   */
  static isSupported() {
    const hasRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    const hasSynthesis = !!window.speechSynthesis
    return {
      recognition: hasRecognition,
      synthesis: hasSynthesis
    }
  }

  /**
   * 清理所有资源
   */
  cleanup() {
    this.stopRecognition()
    this.stopSpeaking()
    this.recognition = null
    this.recognitionCallbacks = { onResult: null, onEnd: null, onError: null }
    this.currentUtterance = null
    console.log('[VoiceService] Cleaned up all resources')
  }
}

// 导出单例实例
export const voiceService = new VoiceService()

export default voiceService
