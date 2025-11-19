/**
 * ElevenLabs TTS Service
 * 文本转语音服务，集成 ElevenLabs API
 */

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY

// 默认语音ID（Rachel - 女声，自然）
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'

// 语音配置
const VOICE_SETTINGS = {
  stability: 0.5,           // 稳定性（0-1），越高越稳定但可能单调
  similarity_boost: 0.75,   // 相似度增强（0-1），越高越接近原声
  style: 0.0,               // 风格强度（0-1），仅某些模型支持
  use_speaker_boost: true   // 启用说话者增强
}

class ElevenLabsService {
  constructor() {
    this.apiKey = ELEVENLABS_API_KEY

    if (!this.apiKey) {
      console.warn('[elevenlabsService] API key not found, service will be disabled')
    }
  }

  /**
   * 检查服务是否可用
   */
  isAvailable() {
    return Boolean(this.apiKey)
  }

  /**
   * 文本转语音（直接调用API）
   * @param {string} text - 要转换的文本
   * @param {string} voiceId - 语音ID（可选）
   * @returns {Promise<Blob>} 音频Blob
   */
  async textToSpeech(text, voiceId = DEFAULT_VOICE_ID) {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured')
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    console.log(`[elevenlabsService] Generating speech for text: "${text.substring(0, 50)}..."`)

    try {
      const response = await fetch(
        `${ELEVENLABS_API_BASE}/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': this.apiKey
          },
          body: JSON.stringify({
            text: text,
            model_id: 'eleven_monolingual_v1',  // 或 'eleven_multilingual_v2'
            voice_settings: VOICE_SETTINGS
          })
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`)
      }

      const audioBlob = await response.blob()
      console.log(`[elevenlabsService] Speech generated successfully (${(audioBlob.size / 1024).toFixed(2)} KB)`)

      return audioBlob
    } catch (error) {
      console.error('[elevenlabsService] Failed to generate speech:', error)
      throw error
    }
  }

  /**
   * 通过 Supabase Edge Function 生成并缓存音频
   * @param {string} text - 要转换的文本
   * @param {string} voiceId - 语音ID（可选）
   * @returns {Promise<string>} 音频URL
   */
  async textToSpeechCached(text, voiceId = DEFAULT_VOICE_ID) {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty')
    }

    console.log(`[elevenlabsService] Requesting cached TTS for: "${text.substring(0, 50)}..."`)

    try {
      // 调用 Supabase Edge Function
      const { supabase } = await import('./supabaseClient.js')

      const { data, error } = await supabase.functions.invoke('generate-tts-audio', {
        body: {
          text: text,
          voice_id: voiceId
        }
      })

      if (error) {
        throw new Error(`Edge function error: ${error.message}`)
      }

      if (!data || !data.audio_url) {
        throw new Error('Invalid response from edge function')
      }

      console.log(`[elevenlabsService] Audio URL received: ${data.audio_url}`)
      return data.audio_url
    } catch (error) {
      console.error('[elevenlabsService] Failed to get cached speech:', error)
      throw error
    }
  }

  /**
   * 获取可用语音列表
   * @returns {Promise<Array>} 语音列表
   */
  async getVoices() {
    if (!this.isAvailable()) {
      throw new Error('ElevenLabs API key not configured')
    }

    try {
      const response = await fetch(`${ELEVENLABS_API_BASE}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch voices: ${response.status}`)
      }

      const data = await response.json()
      return data.voices || []
    } catch (error) {
      console.error('[elevenlabsService] Failed to fetch voices:', error)
      throw error
    }
  }

  /**
   * Blob 转 Object URL（用于播放）
   * @param {Blob} audioBlob - 音频Blob
   * @returns {string} Object URL
   */
  createAudioUrl(audioBlob) {
    return URL.createObjectURL(audioBlob)
  }

  /**
   * 释放 Object URL
   * @param {string} url - Object URL
   */
  revokeAudioUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }
}

// 导出单例
const elevenlabsService = new ElevenLabsService()
export default elevenlabsService
