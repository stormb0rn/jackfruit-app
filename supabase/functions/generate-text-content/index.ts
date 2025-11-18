import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

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
      status_description,
      mood,
      num_video_scenes = 3
    } = await req.json()

    console.log('📝 Generating text content with Gemini...')
    console.log(`Description: ${status_description}`)
    console.log(`Mood: ${mood}`)

    // 调用 Gemini API (使用 gemini-2.5-flash 模型)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a creative AI assistant. Generate content for a character status display.

Character Status Description: ${status_description}
Current Mood: ${mood}

Generate a JSON response with the following structure:
{
  "overlays": {
    "now": "A short sentence about what's happening now (15-25 words)",
    "health": "Physical or emotional state description (10-20 words)"
  },
  "suggestions": [
    "Action suggestion 1 (3-7 words)",
    "Action suggestion 2 (3-7 words)",
    "Action suggestion 3 (3-7 words)"
  ],
  "video_scenes": [
    "Video scene 1 description for this character (15-30 words, focus on visual actions)",
    "Video scene 2 description (15-30 words)",
    "Video scene 3 description (15-30 words)"
  ]
}

Make sure:
- Content matches the mood "${mood}"
- Video scenes are visually descriptive and action-focused
- All text is natural and creative
- Return ONLY the JSON object, no additional text`
            }]
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${errorText}`)
    }

    const data = await response.json()
    const textContent = data.candidates[0].content.parts[0].text

    console.log('Raw Gemini response:', textContent)

    // 提取 JSON（Gemini 可能包含 markdown 代码块）
    let jsonContent = textContent.trim()

    // 移除可能的 markdown 代码块
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\n?/g, '').replace(/```\n?$/g, '')
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\n?/g, '')
    }

    // 尝试解析 JSON
    const result = JSON.parse(jsonContent)

    console.log('✅ Text content generated successfully')

    return new Response(
      JSON.stringify({
        success: true,
        data: result
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
