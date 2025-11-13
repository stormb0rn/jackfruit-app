import { supabase } from './supabaseClient'

export const characterService = {
  // Get character by ID with all statuses
  async getCharacterWithStatuses(characterId) {
    const { data, error } = await supabase
      .from('ai_characters')
      .select(`
        *,
        statuses:character_statuses(*)
      `)
      .eq('character_id', characterId)
      .single()

    if (error) throw error
    return data
  },

  // Get default status for character
  async getDefaultStatus(characterId) {
    const { data, error } = await supabase
      .from('character_statuses')
      .select('*')
      .eq('character_id', characterId)
      .eq('is_default', true)
      .single()

    if (error) {
      // If no default, get first completed status
      const { data: fallback, error: fallbackError } = await supabase
        .from('character_statuses')
        .select('*')
        .eq('character_id', characterId)
        .eq('generation_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fallbackError) throw fallbackError
      return fallback
    }

    return data
  },

  // Get status by ID
  async getStatus(statusId) {
    const { data, error } = await supabase
      .from('character_statuses')
      .select('*')
      .eq('status_id', statusId)
      .single()

    if (error) throw error
    return data
  },

  // Get all completed statuses for a character
  async getCompletedStatuses(characterId) {
    const { data, error } = await supabase
      .from('character_statuses')
      .select('*')
      .eq('character_id', characterId)
      .eq('generation_status', 'completed')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }
}
