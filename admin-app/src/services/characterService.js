import { supabase } from './supabaseClient'

export const characterService = {
  // 获取所有角色
  async getAll() {
    const { data, error } = await supabase
      .from('ai_characters')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 获取单个角色
  async getById(characterId) {
    const { data, error } = await supabase
      .from('ai_characters')
      .select('*')
      .eq('character_id', characterId)
      .single()

    if (error) throw error
    return data
  },

  // 创建角色
  async create(character) {
    const { data, error } = await supabase
      .from('ai_characters')
      .insert(character)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新角色
  async update(characterId, updates) {
    const { data, error } = await supabase
      .from('ai_characters')
      .update(updates)
      .eq('character_id', characterId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除角色
  async delete(characterId) {
    const { error } = await supabase
      .from('ai_characters')
      .delete()
      .eq('character_id', characterId)

    if (error) throw error
  },

  // 上传 Avatar
  async uploadAvatar(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { data, error } = await supabase.storage
      .from('character-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-avatars')
      .getPublicUrl(filePath)

    return publicUrl
  },

  // 获取角色的 Statuses 数量
  async getStatusesCount(characterId) {
    const { count, error } = await supabase
      .from('character_statuses')
      .select('*', { count: 'exact', head: true })
      .eq('character_id', characterId)

    if (error) throw error
    return count
  }
}
