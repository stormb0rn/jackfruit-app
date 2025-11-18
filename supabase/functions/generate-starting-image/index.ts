import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FAL_API_KEY = Deno.env.get('FAL_API_KEY')

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const {
      character_avatar_url,
      scene_prompt,
      mood
    } = await req.json()

    console.log('🖼️ Generating starting image with FAL SeeDrawm...')
    console.log(`Avatar: ${character_avatar_url}`)
    console.log(`Scene: ${scene_prompt}`)
    console.log(`Mood: ${mood}`)

    // 构建完整的 prompt
    const fullPrompt = `${scene_prompt}. Mood: ${mood}. Cinematic, high quality, portrait composition.`

    console.log('Full prompt:', fullPrompt)

    // 调用 FAL SeeDrawm v4 Edit API
    // 使用 576x1024 (9:16 比例，低分辨率，更快)
    const falResponse = await fetch('https://fal.run/fal-ai/bytedance/seedream/v4/edit', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_urls: [character_avatar_url],  // 必须是数组格式
        prompt: fullPrompt,
        image_size: {
          width: 576,    // 9:16 比例，低分辨率
          height: 1024
        },
        num_images: 1,
        enable_safety_checker: true
      })
    })

    if (!falResponse.ok) {
      const errorText = await falResponse.text()
      throw new Error(`FAL API error: ${errorText}`)
    }

    const falData = await falResponse.json()
    console.log('FAL response:', falData)

    const falImageUrl = falData.images[0].url

    console.log('📥 Downloading and uploading image to Supabase...')

    // 下载图片
    const imageResponse = await fetch(falImageUrl)
    const imageBlob = await imageResponse.blob()

    // 上传到 Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `starting-images/${Date.now()}.jpg`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('character-videos')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-videos')
      .getPublicUrl(fileName)

    console.log('✅ Starting image generated and uploaded')
    console.log(`Public URL: ${publicUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          image_url: publicUrl,
          original_fal_url: falImageUrl,
          prompt_used: fullPrompt  // 返回使用的 prompt
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('❌ Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        status: 500
      }
    )
  }
})
