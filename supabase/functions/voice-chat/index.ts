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
      user_input,                    // 用户语音识别的文本
      conversation_history = [],     // 对话历史（可选）
      character_context = null,      // 角色上下文（可选）
      system_prompt = null          // 自定义系统提示词（可选）
    } = await req.json()

    console.log('🎤 Processing voice chat request...')
    console.log(`User input: ${user_input}`)
    console.log(`History length: ${conversation_history.length}`)

    // 构建对话上下文
    let contextMessages = ''
    if (conversation_history.length > 0) {
      contextMessages = conversation_history.map((msg: any) =>
        `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n')
    }

    // 构建系统提示词
    const defaultSystemPrompt = `You are an AI assistant in a futuristic virtual world.
You are helping users explore their digital identity and interact with AI characters.
Keep responses natural, concise (1-3 sentences), and engaging.
Use a friendly yet slightly mysterious tone.`

    const finalSystemPrompt = system_prompt || defaultSystemPrompt

    // 如果有角色上下文，添加到提示词中
    let characterInfo = ''
    if (character_context) {
      characterInfo = `\n\nCharacter Context:\nName: ${character_context.name}\nDescription: ${character_context.description}\nMood: ${character_context.mood || 'neutral'}`
    }

    // 构建完整的 prompt
    const fullPrompt = `${finalSystemPrompt}${characterInfo}

${contextMessages ? `Previous conversation:\n${contextMessages}\n\n` : ''}User: ${user_input}

Respond naturally and concisely (1-3 sentences max). Return ONLY your response text, no additional formatting.`

    console.log('📤 Calling Gemini API...')

    // 调用 Gemini API
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
              text: fullPrompt
            }]
          }],
          generationConfig: {
            temperature: 0.9,        // 较高温度，更自然的对话
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 150,   // 限制输出长度，保持简洁
          }
        })
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API error: ${errorText}`)
    }

    const data = await response.json()
    const aiResponse = data.candidates[0].content.parts[0].text.trim()

    console.log('✅ AI response:', aiResponse)

    // 返回结果
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          response: aiResponse,
          timestamp: new Date().toISOString()
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
