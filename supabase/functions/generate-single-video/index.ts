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
      starting_image_url,
      scene_prompt,
      mood,
      character_id,
      video_duration = 3
    } = await req.json()

    console.log('🎬 Generating video with FAL SeeDance...')
    console.log(`Image: ${starting_image_url}`)
    console.log(`Scene: ${scene_prompt}`)
    console.log(`Mood: ${mood}`)
    console.log(`Duration: ${video_duration}s`)

    // 计算帧数（30fps）
    const numFrames = video_duration * 30

    // 调用 FAL SeeDance image-to-video API
    const falResponse = await fetch('https://fal.run/fal-ai/bytedance/seedance/v1/pro/image-to-video', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: starting_image_url,
        prompt: `${scene_prompt}. The character's mood is ${mood}. Smooth natural movement.`,
        video_size: 'portrait_9_16',
        num_frames: numFrames,
        num_inference_steps: 20,
        cfg_scale: 7.0
      })
    })

    if (!falResponse.ok) {
      const errorText = await falResponse.text()
      throw new Error(`FAL API error: ${errorText}`)
    }

    const falData = await falResponse.json()
    console.log('FAL response:', falData)

    const falVideoUrl = falData.video.url

    console.log('📥 Downloading and uploading video to Supabase...')

    // 下载视频
    const videoResponse = await fetch(falVideoUrl)
    const videoBlob = await videoResponse.blob()
    const fileSize = videoBlob.size

    console.log(`Video size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`)

    // 上传到 Supabase Storage
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const fileName = `${character_id}/${Date.now()}.mp4`
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('character-videos')
      .upload(fileName, videoBlob, {
        contentType: 'video/mp4',
        upsert: false
      })

    if (uploadError) throw uploadError

    // 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from('character-videos')
      .getPublicUrl(fileName)

    console.log('✅ Video generated and uploaded')
    console.log(`Public URL: ${publicUrl}`)

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          video_url: publicUrl,
          scene_prompt: scene_prompt,
          duration: video_duration,
          file_size: fileSize,
          original_fal_url: falVideoUrl
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
