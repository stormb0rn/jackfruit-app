/**
 * Audio Service - 音频能量分析服务
 *
 * 功能：
 * 1. 麦克风输入监听（用户说话）
 * 2. 音频元素分析（TTS 播放）
 * 3. 外部音频文件分析（从URL播放）
 * 4. VAD（语音活动检测）
 * 5. 实时能量计算（归一化到 0.0-1.0）
 */

class AudioService {
  constructor() {
    this.audioContext = null
    this.micAnalyser = null
    this.ttsAnalyser = null
    this.micStream = null
    this.ttsSource = null
    this.animationFrame = null
    this.energyCallback = null
    this.isActive = false

    // VAD 相关
    this.vadEnabled = false
    this.vadThreshold = 0.05
    this.vadSilenceDuration = 1500  // 1.5秒
    this.vadSilenceTimer = null
    this.vadOnSilence = null

    // 当前正在播放的音频元素
    this.currentAudio = null

    console.log('[AudioService] Initialized')
  }

  /**
   * 初始化 AudioContext（单例模式）
   */
  initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      console.log('[AudioService] AudioContext created')
    }
    return this.audioContext
  }

  /**
   * 启动麦克风监听
   * @param {Function} onEnergy - 能量回调函数 (energy: 0.0-1.0)
   * @returns {Promise<boolean>} 是否成功
   */
  async startMicrophone(onEnergy) {
    try {
      // 请求麦克风权限
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      // 初始化 AudioContext
      const audioContext = this.initAudioContext()

      // 创建分析器
      this.micAnalyser = audioContext.createAnalyser()
      this.micAnalyser.fftSize = 256
      this.micAnalyser.smoothingTimeConstant = 0.8

      // 连接麦克风流
      const source = audioContext.createMediaStreamSource(this.micStream)
      source.connect(this.micAnalyser)

      // 启动能量监测
      this.energyCallback = onEnergy
      this.isActive = true
      this.updateMicrophoneEnergy()

      console.log('[AudioService] Microphone started')
      return true
    } catch (err) {
      console.error('[AudioService] Microphone access denied:', err)
      return false
    }
  }

  /**
   * 实时更新麦克风能量
   */
  updateMicrophoneEnergy() {
    if (!this.isActive || !this.micAnalyser) return

    const dataArray = new Uint8Array(this.micAnalyser.frequencyBinCount)
    this.micAnalyser.getByteFrequencyData(dataArray)

    // 计算平均能量
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedEnergy = Math.min(average / 128, 1) // 归一化到 0-1

    // 回调传递能量值
    if (this.energyCallback) {
      this.energyCallback(normalizedEnergy)
    }

    // VAD 检测
    if (this.vadEnabled) {
      this.checkVAD(normalizedEnergy)
    }

    // 持续监测
    this.animationFrame = requestAnimationFrame(() => this.updateMicrophoneEnergy())
  }

  /**
   * 停止麦克风监听
   */
  stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop())
      this.micStream = null
    }

    if (this.micAnalyser) {
      this.micAnalyser.disconnect()
      this.micAnalyser = null
    }

    this.isActive = false

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    console.log('[AudioService] Microphone stopped')
  }

  /**
   * 分析音频元素（如 TTS 音频）
   * @param {HTMLAudioElement} audioElement - Audio 元素
   * @param {Function} onEnergy - 能量回调函数
   * @returns {boolean} 是否成功
   */
  analyzeTTSAudio(audioElement, onEnergy) {
    try {
      const audioContext = this.initAudioContext()

      // 创建 TTS 分析器
      this.ttsAnalyser = audioContext.createAnalyser()
      this.ttsAnalyser.fftSize = 256
      this.ttsAnalyser.smoothingTimeConstant = 0.8

      // 连接音频元素
      this.ttsSource = audioContext.createMediaElementSource(audioElement)
      this.ttsSource.connect(this.ttsAnalyser)
      this.ttsAnalyser.connect(audioContext.destination) // 重要：连接到输出，否则无声

      // 启动能量监测
      this.energyCallback = onEnergy
      this.isActive = true
      this.updateTTSEnergy()

      console.log('[AudioService] TTS audio analysis started')
      return true
    } catch (err) {
      console.error('[AudioService] TTS audio analysis failed:', err)
      return false
    }
  }

  /**
   * 实时更新 TTS 能量
   */
  updateTTSEnergy() {
    if (!this.isActive || !this.ttsAnalyser) return

    const dataArray = new Uint8Array(this.ttsAnalyser.frequencyBinCount)
    this.ttsAnalyser.getByteFrequencyData(dataArray)

    // 计算平均能量
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length
    const normalizedEnergy = Math.min(average / 128, 1)

    // 回调传递能量值
    if (this.energyCallback) {
      this.energyCallback(normalizedEnergy)
    }

    // 持续监测
    this.animationFrame = requestAnimationFrame(() => this.updateTTSEnergy())
  }

  /**
   * 停止 TTS 分析
   */
  stopTTSAnalysis() {
    if (this.ttsSource) {
      this.ttsSource.disconnect()
      this.ttsSource = null
    }

    if (this.ttsAnalyser) {
      this.ttsAnalyser.disconnect()
      this.ttsAnalyser = null
    }

    this.isActive = false

    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }

    console.log('[AudioService] TTS analysis stopped')
  }

  /**
   * 清理所有资源
   */
  cleanup() {
    this.stopMicrophone()
    this.stopTTSAnalysis()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    this.energyCallback = null
    console.log('[AudioService] Cleaned up all resources')
  }

  /**
   * 检测浏览器是否支持音频功能
   */
  static isSupported() {
    const hasAudioContext = !!(window.AudioContext || window.webkitAudioContext)
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    return hasAudioContext && hasGetUserMedia
  }

  /**
   * 恢复 AudioContext（用于处理自动播放限制）
   */
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
      console.log('[AudioService] AudioContext resumed')
    }
  }

  /**
   * 播放外部音频文件并实时分析能量
   * @param {string} audioUrl - 音频文件URL
   * @param {Function} onEnergy - 能量回调函数
   * @returns {Promise<HTMLAudioElement>} Audio元素
   */
  async playWithAnalysis(audioUrl, onEnergy) {
    try {
      // 创建 Audio 元素
      const audio = new Audio(audioUrl)
      audio.crossOrigin = 'anonymous'  // 处理CORS
      this.currentAudio = audio

      // 初始化 AudioContext
      const audioContext = this.initAudioContext()
      await this.resumeAudioContext()

      // 创建分析器
      this.ttsAnalyser = audioContext.createAnalyser()
      this.ttsAnalyser.fftSize = 256
      this.ttsAnalyser.smoothingTimeConstant = 0.8

      // 连接音频源
      this.ttsSource = audioContext.createMediaElementSource(audio)
      this.ttsSource.connect(this.ttsAnalyser)
      this.ttsAnalyser.connect(audioContext.destination)

      // 启动能量监测
      this.energyCallback = onEnergy
      this.isActive = true
      this.updateTTSEnergy()

      // 播放音频
      await audio.play()

      console.log('[AudioService] External audio playing with analysis')

      // 监听播放结束
      return new Promise((resolve) => {
        audio.addEventListener('ended', () => {
          this.stopTTSAnalysis()
          this.currentAudio = null
          resolve(audio)
        })
      })
    } catch (error) {
      console.error('[AudioService] Failed to play audio with analysis:', error)
      throw error
    }
  }

  /**
   * 停止当前播放的音频
   */
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio.currentTime = 0
      this.currentAudio = null
    }
    this.stopTTSAnalysis()
  }

  /**
   * 启用 VAD（语音活动检测）
   * @param {number} threshold - 能量阈值（默认 0.05）
   * @param {number} silenceDuration - 静默持续时间（毫秒，默认 1500）
   * @param {Function} onSilence - 检测到静默时的回调
   */
  enableVAD(threshold = 0.05, silenceDuration = 1500, onSilence) {
    this.vadEnabled = true
    this.vadThreshold = threshold
    this.vadSilenceDuration = silenceDuration
    this.vadOnSilence = onSilence

    console.log(`[AudioService] VAD enabled (threshold: ${threshold}, silence: ${silenceDuration}ms)`)
  }

  /**
   * 禁用 VAD
   */
  disableVAD() {
    this.vadEnabled = false
    this.vadOnSilence = null

    if (this.vadSilenceTimer) {
      clearTimeout(this.vadSilenceTimer)
      this.vadSilenceTimer = null
    }

    console.log('[AudioService] VAD disabled')
  }

  /**
   * 检测语音活动（内部方法）
   * @param {number} energy - 当前能量值
   */
  checkVAD(energy) {
    if (energy < this.vadThreshold) {
      // 能量低于阈值，可能是静默
      if (!this.vadSilenceTimer) {
        this.vadSilenceTimer = setTimeout(() => {
          console.log('[AudioService] VAD: Silence detected')
          if (this.vadOnSilence) {
            this.vadOnSilence()
          }
          this.vadSilenceTimer = null
        }, this.vadSilenceDuration)
      }
    } else {
      // 能量高于阈值，有声音
      if (this.vadSilenceTimer) {
        clearTimeout(this.vadSilenceTimer)
        this.vadSilenceTimer = null
      }
    }
  }

  /**
   * 多源音频能量归一化
   * @param {number} rawEnergy - 原始能量值
   * @param {string} source - 音频源类型（'microphone' | 'tts' | 'video'）
   * @returns {number} 归一化后的能量值（0-1）
   */
  normalizeEnergy(rawEnergy, source = 'microphone') {
    const ranges = {
      microphone: { min: 0, max: 128 },
      tts: { min: 30, max: 180 },
      video: { min: 20, max: 150 }
    }

    const range = ranges[source] || ranges.microphone
    const normalized = (rawEnergy - range.min) / (range.max - range.min)
    return Math.max(0, Math.min(1, normalized))  // 限制在 0-1
  }

  /**
   * 分析视频元素音频
   * @param {HTMLVideoElement} videoElement - Video 元素
   * @param {Function} onEnergy - 能量回调函数
   * @returns {boolean} 是否成功
   */
  analyzeVideoAudio(videoElement, onEnergy) {
    try {
      const audioContext = this.initAudioContext()

      // 创建分析器
      this.ttsAnalyser = audioContext.createAnalyser()
      this.ttsAnalyser.fftSize = 256
      this.ttsAnalyser.smoothingTimeConstant = 0.8

      // 连接视频元素
      this.ttsSource = audioContext.createMediaElementSource(videoElement)
      this.ttsSource.connect(this.ttsAnalyser)
      this.ttsAnalyser.connect(audioContext.destination)

      // 启动能量监测
      this.energyCallback = onEnergy
      this.isActive = true
      this.updateTTSEnergy()

      console.log('[AudioService] Video audio analysis started')
      return true
    } catch (err) {
      console.error('[AudioService] Video audio analysis failed:', err)
      return false
    }
  }
}

// 导出单例实例
export const audioService = new AudioService()

export default audioService
