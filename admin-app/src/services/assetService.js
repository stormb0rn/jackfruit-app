import { supabase } from './supabaseClient'

export const assetService = {
  // 获取所有资产
  async getAll() {
    const { data, error } = await supabase
      .from('character_assets')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 获取单个资产
  async getById(assetId) {
    const { data, error } = await supabase
      .from('character_assets')
      .select('*')
      .eq('asset_id', assetId)
      .single()

    if (error) throw error
    return data
  },

  // 按类型筛选
  async getByType(assetType) {
    const { data, error } = await supabase
      .from('character_assets')
      .select('*')
      .eq('asset_type', assetType)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 创建资产
  async create(asset) {
    const { data, error } = await supabase
      .from('character_assets')
      .insert(asset)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新资产
  async update(assetId, updates) {
    const { data, error } = await supabase
      .from('character_assets')
      .update(updates)
      .eq('asset_id', assetId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除资产
  async delete(assetId) {
    const { error } = await supabase
      .from('character_assets')
      .delete()
      .eq('asset_id', assetId)

    if (error) throw error
  },

  // 上传资产图片
  async uploadImage(file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `assets/${fileName}`

    const { data, error } = await supabase.storage
      .from('character-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-assets')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
