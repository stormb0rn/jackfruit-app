/**
 * Audio Cache Service
 * 使用 IndexedDB 缓存 TTS 音频，避免重复生成
 */

import { openDB } from 'idb'

const DB_NAME = 'audio-cache'
const DB_VERSION = 1
const STORE_NAME = 'tts-audio'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000  // 7天
const MAX_CACHE_SIZE = 50 * 1024 * 1024       // 50MB

class AudioCacheService {
  constructor() {
    this.db = null
    this.initPromise = null
  }

  /**
   * 初始化 IndexedDB
   */
  async init() {
    if (this.initPromise) return this.initPromise

    this.initPromise = (async () => {
      try {
        // 检查 IndexedDB 支持
        if (!window.indexedDB) {
          console.warn('[audioCacheService] IndexedDB not supported, caching disabled')
          return false
        }

        this.db = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // 创建对象存储
            if (!db.objectStoreNames.contains(STORE_NAME)) {
              const store = db.createObjectStore(STORE_NAME, { keyPath: 'textHash' })

              // 创建索引（用于按时间排序、清理过期缓存）
              store.createIndex('createdAt', 'createdAt', { unique: false })
              store.createIndex('expiresAt', 'expiresAt', { unique: false })

              console.log('[audioCacheService] Database initialized')
            }
          }
        })

        // 启动时清理过期缓存
        await this.cleanExpiredCache()

        return true
      } catch (error) {
        console.error('[audioCacheService] Failed to initialize:', error)
        return false
      }
    })()

    return this.initPromise
  }

  /**
   * 生成文本哈希（用作缓存key）
   * @param {string} text - 文本内容
   * @returns {Promise<string>} 哈希值
   */
  async hashText(text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  /**
   * 缓存音频
   * @param {string} text - 原始文本
   * @param {string} audioUrl - 音频URL（Supabase Storage）
   * @param {object} metadata - 元数据（可选）
   * @returns {Promise<boolean>} 是否成功
   */
  async cacheAudio(text, audioUrl, metadata = {}) {
    const initialized = await this.init()
    if (!initialized) return false

    try {
      const textHash = await this.hashText(text)
      const now = Date.now()

      const cacheEntry = {
        textHash,
        text,                                    // 存储原文（用于调试）
        audioUrl,
        createdAt: now,
        expiresAt: now + CACHE_EXPIRY,
        accessCount: 0,
        lastAccessed: now,
        ...metadata                              // voice_id, duration等
      }

      await this.db.put(STORE_NAME, cacheEntry)

      console.log(`[audioCacheService] Cached audio for text: "${text.substring(0, 30)}..."`)

      // 检查缓存大小，超过限制则清理旧缓存
      await this.enforceMaxCacheSize()

      return true
    } catch (error) {
      console.error('[audioCacheService] Failed to cache audio:', error)
      return false
    }
  }

  /**
   * 获取缓存的音频
   * @param {string} text - 原始文本
   * @returns {Promise<string|null>} 音频URL，未找到返回null
   */
  async getCachedAudio(text) {
    const initialized = await this.init()
    if (!initialized) return null

    try {
      const textHash = await this.hashText(text)
      const cached = await this.db.get(STORE_NAME, textHash)

      if (!cached) {
        console.log(`[audioCacheService] Cache miss for: "${text.substring(0, 30)}..."`)
        return null
      }

      // 检查过期
      if (Date.now() > cached.expiresAt) {
        console.log(`[audioCacheService] Cache expired, removing: "${text.substring(0, 30)}..."`)
        await this.db.delete(STORE_NAME, textHash)
        return null
      }

      // 更新访问记录
      cached.accessCount += 1
      cached.lastAccessed = Date.now()
      await this.db.put(STORE_NAME, cached)

      console.log(`[audioCacheService] Cache hit for: "${text.substring(0, 30)}..." (access count: ${cached.accessCount})`)
      return cached.audioUrl
    } catch (error) {
      console.error('[audioCacheService] Failed to get cached audio:', error)
      return null
    }
  }

  /**
   * 清理过期缓存
   * @returns {Promise<number>} 清理的条目数
   */
  async cleanExpiredCache() {
    const initialized = await this.init()
    if (!initialized) return 0

    try {
      const now = Date.now()
      const tx = this.db.transaction(STORE_NAME, 'readwrite')
      const index = tx.store.index('expiresAt')

      let count = 0
      let cursor = await index.openCursor()

      while (cursor) {
        if (cursor.value.expiresAt < now) {
          await cursor.delete()
          count++
        }
        cursor = await cursor.continue()
      }

      await tx.done

      if (count > 0) {
        console.log(`[audioCacheService] Cleaned ${count} expired cache entries`)
      }

      return count
    } catch (error) {
      console.error('[audioCacheService] Failed to clean expired cache:', error)
      return 0
    }
  }

  /**
   * 强制缓存大小限制（删除最旧的缓存）
   * @returns {Promise<void>}
   */
  async enforceMaxCacheSize() {
    const initialized = await this.init()
    if (!initialized) return

    try {
      const all = await this.db.getAll(STORE_NAME)

      // 简单假设：每个条目约 100KB（实际上URL存的是引用）
      // 如果需要精确计算，需要下载每个音频文件检查大小
      const estimatedSize = all.length * 100 * 1024

      if (estimatedSize > MAX_CACHE_SIZE) {
        // 按创建时间排序，删除最旧的
        all.sort((a, b) => a.createdAt - b.createdAt)
        const toDelete = Math.ceil(all.length * 0.2)  // 删除20%最旧的

        for (let i = 0; i < toDelete; i++) {
          await this.db.delete(STORE_NAME, all[i].textHash)
        }

        console.log(`[audioCacheService] Enforced cache size limit, removed ${toDelete} entries`)
      }
    } catch (error) {
      console.error('[audioCacheService] Failed to enforce cache size:', error)
    }
  }

  /**
   * 清空所有缓存
   * @returns {Promise<void>}
   */
  async clearAll() {
    const initialized = await this.init()
    if (!initialized) return

    try {
      await this.db.clear(STORE_NAME)
      console.log('[audioCacheService] All cache cleared')
    } catch (error) {
      console.error('[audioCacheService] Failed to clear cache:', error)
    }
  }

  /**
   * 获取缓存统计信息
   * @returns {Promise<object>} 统计信息
   */
  async getStats() {
    const initialized = await this.init()
    if (!initialized) {
      return { initialized: false }
    }

    try {
      const all = await this.db.getAll(STORE_NAME)

      return {
        initialized: true,
        totalEntries: all.length,
        oldestEntry: all.length > 0 ? new Date(Math.min(...all.map(e => e.createdAt))) : null,
        newestEntry: all.length > 0 ? new Date(Math.max(...all.map(e => e.createdAt))) : null,
        totalAccessCount: all.reduce((sum, e) => sum + e.accessCount, 0)
      }
    } catch (error) {
      console.error('[audioCacheService] Failed to get stats:', error)
      return { initialized: true, error: error.message }
    }
  }
}

// 导出单例
const audioCacheService = new AudioCacheService()
export default audioCacheService
