import { supabase } from './supabaseClient'

export const lookgenService = {
  // ========== Transformations (Looking) ==========

  // Get all transformations
  async getTransformations() {
    const { data, error } = await supabase
      .from('prompt_items')
      .select('*')
      .eq('category', 'looking')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get single transformation
  async getTransformationById(id) {
    const { data, error } = await supabase
      .from('prompt_items')
      .select('*')
      .eq('id', id)
      .eq('category', 'looking')
      .single()

    if (error) throw error
    return data
  },

  // Create transformation
  async createTransformation(transformation) {
    const { data, error } = await supabase
      .from('prompt_items')
      .insert({
        ...transformation,
        category: 'looking'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update transformation
  async updateTransformation(id, updates) {
    const { data, error } = await supabase
      .from('prompt_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('category', 'looking')
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete transformation (soft delete)
  async deleteTransformation(id) {
    const { error } = await supabase
      .from('prompt_items')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('category', 'looking')

    if (error) throw error
  },

  // ========== Templates ==========

  // Get all templates
  async getTemplates() {
    const { data, error } = await supabase
      .from('prompt_items')
      .select('*')
      .eq('category', 'templates')
      .is('deleted_at', null)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data || []
  },

  // Get single template
  async getTemplateById(id) {
    const { data, error } = await supabase
      .from('prompt_items')
      .select('*')
      .eq('id', id)
      .eq('category', 'templates')
      .single()

    if (error) throw error
    return data
  },

  // Create template
  async createTemplate(template) {
    const { data, error } = await supabase
      .from('prompt_items')
      .insert({
        ...template,
        category: 'templates'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update template
  async updateTemplate(id, updates) {
    const { data, error } = await supabase
      .from('prompt_items')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('category', 'templates')
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete template (soft delete)
  async deleteTemplate(id) {
    const { error } = await supabase
      .from('prompt_items')
      .update({
        deleted_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('category', 'templates')

    if (error) throw error
  },

  // Upload image
  async uploadImage(file, folder = 'lookgen') {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${folder}/${fileName}`

    const { data, error } = await supabase.storage
      .from('character-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-assets')
      .getPublicUrl(filePath)

    return publicUrl
  }
}
