/**
 * Supabase Edge Function: generate-tts-audio
 * 调用 ElevenLabs API 生成 TTS 音频，并上传到 Supabase Storage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ELEVENLABS_API_BASE = 'https://api.elevenlabs.io/v1'
const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const STORAGE_BUCKET = 'onboarding-resources'

// 默认语音ID
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'  // Rachel

// 语音配置
const VOICE_SETTINGS = {
  stability: 0.5,
  similarity_boost: 0.75,
  style: 0.0,
  use_speaker_boost: true
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 解析请求
    const { text, voice_id = DEFAULT_VOICE_ID } = await req.json()

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Generating TTS for text: "${text.substring(0, 50)}..."`)

    // 生成文件名（基于文本哈希）
    const textHash = await hashText(text)
    const fileName = `tts/${textHash}.mp3`

    // 初始化 Supabase 客户端
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 检查缓存（是否已有相同文本的音频）
    const { data: existingFile } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .list('tts', {
        search: `${textHash}.mp3`
      })

    if (existingFile && existingFile.length > 0) {
      // 缓存命中，直接返回URL
      const { data: urlData } = supabase
        .storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(fileName)

      console.log(`Cache hit for text hash: ${textHash}`)
      return new Response(
        JSON.stringify({
          audio_url: urlData.publicUrl,
          cached: true,
          text_hash: textHash
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 调用 ElevenLabs API
    const ttsResponse = await fetch(
      `${ELEVENLABS_API_BASE}/text-to-speech/${voice_id}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: VOICE_SETTINGS
        })
      }
    )

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text()
      console.error(`ElevenLabs API error: ${ttsResponse.status} - ${errorText}`)
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${ttsResponse.status}` }),
        { status: ttsResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取音频数据
    const audioArrayBuffer = await ttsResponse.arrayBuffer()
    const audioBlob = new Uint8Array(audioArrayBuffer)

    console.log(`Generated audio: ${(audioBlob.length / 1024).toFixed(2)} KB`)

    // 上传到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, audioBlob, {
        contentType: 'audio/mpeg',
        cacheControl: '31536000',  // 1年缓存
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload audio', details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 获取公开URL
    const { data: urlData } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName)

    console.log(`Audio uploaded successfully: ${urlData.publicUrl}`)

    return new Response(
      JSON.stringify({
        audio_url: urlData.publicUrl,
        cached: false,
        text_hash: textHash,
        size_kb: (audioBlob.length / 1024).toFixed(2)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * 生成文本的 SHA-256 哈希
 */
async function hashText(text: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(text)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
