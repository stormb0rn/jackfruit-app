/**
 * TTS Service - 统一的文本转语音服务
 * 整合 ElevenLabs API + 音频缓存 + 降级方案
 */

import elevenlabsService from './elevenlabsService'
import audioCacheService from './audioCacheService'
import voiceService from './voiceService'

class TTSService {
  constructor() {
    this.useElevenLabs = true  // 默认使用 ElevenLabs
    this.fallbackToBrowser = true  // API 失败时降级到浏览器 TTS
  }

  /**
   * 文本转语音（智能选择最佳方案）
   * @param {string} text - 要转换的文本
   * @param {object} options - 配置选项
   * @returns {Promise<string>} 音频 URL
   */
  async textToSpeech(text, options = {}) {
    const {
      voiceId = undefined,
      forceElevenLabs = false,
      forceBrowser = false
    } = options

    // 1. 如果强制使用浏览器 TTS
    if (forceBrowser) {
      console.log('[ttsService] Using browser TTS (forced)')
      return this.useBrowserTTS(text)
    }

    // 2. 检查缓存
    const cachedUrl = await audioCacheService.getCachedAudio(text)
    if (cachedUrl) {
      console.log('[ttsService] Using cached audio')
      return cachedUrl
    }

    // 3. 尝试使用 ElevenLabs
    if ((this.useElevenLabs || forceElevenLabs) && elevenlabsService.isAvailable()) {
      try {
        console.log('[ttsService] Generating audio with ElevenLabs')
        const audioUrl = await elevenlabsService.textToSpeechCached(text, voiceId)

        // 缓存到 IndexedDB
        await audioCacheService.cacheAudio(text, audioUrl, { voiceId })

        return audioUrl
      } catch (error) {
        console.error('[ttsService] ElevenLabs failed:', error)

        // 降级到浏览器 TTS
        if (this.fallbackToBrowser) {
          console.log('[ttsService] Falling back to browser TTS')
          return this.useBrowserTTS(text)
        }

        throw error
      }
    }

    // 4. 默认使用浏览器 TTS
    console.log('[ttsService] Using browser TTS (default)')
    return this.useBrowserTTS(text)
  }

  /**
   * 使用浏览器 TTS（返回 null，因为浏览器 TTS 无 URL）
   * @param {string} text - 文本
   * @returns {Promise<null>}
   */
  async useBrowserTTS(text) {
    // 浏览器 TTS 没有 URL，调用方需要使用 voiceService.speak()
    return null
  }

  /**
   * 预加载多个文本的音频
   * @param {Array<string>} texts - 文本数组
   * @returns {Promise<Array<string>>} 音频 URL 数组
   */
  async preloadMultiple(texts) {
    console.log(`[ttsService] Preloading ${texts.length} audio files`)

    const results = await Promise.allSettled(
      texts.map(text => this.textToSpeech(text))
    )

    const audioUrls = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        console.error(`[ttsService] Failed to preload text ${index + 1}:`, result.reason)
        return null
      }
    })

    const successCount = audioUrls.filter(url => url !== null).length
    console.log(`[ttsService] Preloaded ${successCount}/${texts.length} audio files`)

    return audioUrls
  }

  /**
   * 清空所有缓存
   */
  async clearCache() {
    await audioCacheService.clearAll()
    console.log('[ttsService] Cache cleared')
  }

  /**
   * 获取缓存统计信息
   */
  async getCacheStats() {
    return await audioCacheService.getStats()
  }

  /**
   * 配置服务
   * @param {object} config - 配置对象
   */
  configure(config) {
    if (config.useElevenLabs !== undefined) {
      this.useElevenLabs = config.useElevenLabs
    }
    if (config.fallbackToBrowser !== undefined) {
      this.fallbackToBrowser = config.fallbackToBrowser
    }

    console.log('[ttsService] Configuration updated:', {
      useElevenLabs: this.useElevenLabs,
      fallbackToBrowser: this.fallbackToBrowser
    })
  }
}

// 导出单例
const ttsService = new TTSService()
export default ttsService
