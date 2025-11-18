import { supabase } from './supabaseClient'

export const promptService = {
  // 获取所有提示词
  async getAll() {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 获取单个提示词
  async getById(promptId) {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('prompt_id', promptId)
      .single()

    if (error) throw error
    return data
  },

  // 按类型筛选
  async getByType(promptType) {
    const { data, error } = await supabase
      .from('system_prompts')
      .select('*')
      .eq('prompt_type', promptType)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // 创建提示词
  async create(prompt) {
    const { data, error } = await supabase
      .from('system_prompts')
      .insert(prompt)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 更新提示词
  async update(promptId, updates) {
    const { data, error } = await supabase
      .from('system_prompts')
      .update(updates)
      .eq('prompt_id', promptId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // 删除提示词
  async delete(promptId) {
    const { error } = await supabase
      .from('system_prompts')
      .delete()
      .eq('prompt_id', promptId)

    if (error) throw error
  }
}
