import { useState, useEffect } from 'react'
import NovaOrbCanvas from './NovaOrbCanvas'
import audioService from '../services/audioService'
import voiceService from '../services/voiceService'
import supabaseClient from '../services/supabaseClient'

/**
 * 完整语音交互状态机示例组件
 *
 * 工作流程：
 * 1. 用户点击"开始说话" → LISTEN 状态（麦克风监听）
 * 2. 语音识别转文本
 * 3. 调用 AI API → IDLE 状态（思考中）
 * 4. TTS 播放 AI 回复 → SPEAK 状态
 * 5. 完成后回到 IDLE 状态
 */
export const VoiceAssistantDemo = () => {
  // 状态管理
  const [orbMode, setOrbMode] = useState('IDLE')  // IDLE | LISTEN | SPEAK
  const [audioEnergy, setAudioEnergy] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcriptText, setTranscriptText] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])
  const [statusText, setStatusText] = useState('待机中...')
  const [error, setError] = useState(null)

  // 检测浏览器支持
  useEffect(() => {
    const support = voiceService.constructor.isSupported()
    if (!support.recognition || !support.synthesis) {
      setError('您的浏览器不支持语音功能')
      setStatusText('浏览器不支持')
    }
  }, [])

  // 开始录音（语音识别）
  const startRecording = async () => {
    if (isRecording || isSpeaking) return

    setIsRecording(true)
    setOrbMode('LISTEN')
    setTranscriptText('')
    setStatusText('正在监听...')
    setError(null)

    // 启动麦克风监听（音频能量可视化）
    const micStarted = await audioService.startMicrophone((energy) => {
      setAudioEnergy(energy)
    })

    if (!micStarted) {
      setError('无法访问麦克风')
      setStatusText('麦克风权限被拒绝')
      setIsRecording(false)
      setOrbMode('IDLE')
      return
    }

    // 启动语音识别
    const recStarted = voiceService.startRecognition({
      onResult: (result) => {
        if (result.final) {
          setTranscriptText(result.final)
          console.log('[VoiceAssistantDemo] Final transcript:', result.final)
        } else {
          setTranscriptText(result.interim)
        }
      },
      onEnd: () => {
        console.log('[VoiceAssistantDemo] Recognition ended')
        stopRecording()
      },
      onError: (error) => {
        console.error('[VoiceAssistantDemo] Recognition error:', error)
        setError(`语音识别错误: ${error}`)
        stopRecording()
      }
    })

    if (!recStarted) {
      setError('无法启动语音识别')
      setStatusText('语音识别失败')
      setIsRecording(false)
      setOrbMode('IDLE')
      audioService.stopMicrophone()
    }
  }

  // 停止录音
  const stopRecording = () => {
    setIsRecording(false)
    audioService.stopMicrophone()
    voiceService.stopRecognition()
    setAudioEnergy(0)

    // 如果有识别到的文本，发送给 AI
    if (transcriptText.trim()) {
      sendToAI(transcriptText)
    } else {
      setOrbMode('IDLE')
      setStatusText('待机中...')
    }
  }

  // 发送文本给 AI 并获取回复
  const sendToAI = async (userInput) => {
    setOrbMode('IDLE')  // AI 思考中
    setStatusText('AI 思考中...')

    try {
      const { data, error } = await supabaseClient.functions.invoke('voice-chat', {
        body: {
          user_input: userInput,
          conversation_history: conversationHistory,
          character_context: null  // 可选：添加角色上下文
        }
      })

      if (error) throw error

      const response = data.data.response
      setAiResponse(response)
      console.log('[VoiceAssistantDemo] AI response:', response)

      // 更新对话历史
      setConversationHistory([
        ...conversationHistory,
        { role: 'user', content: userInput },
        { role: 'ai', content: response }
      ])

      // 播放 AI 回复（TTS）
      speakResponse(response)

    } catch (err) {
      console.error('[VoiceAssistantDemo] AI error:', err)
      setError(`AI 回复错误: ${err.message}`)
      setOrbMode('IDLE')
      setStatusText('AI 回复失败')
    }
  }

  // TTS 播放 AI 回复
  const speakResponse = (text) => {
    setIsSpeaking(true)
    setOrbMode('SPEAK')
    setStatusText('AI 正在说话...')

    // 创建临时 Audio 元素用于能量分析
    const audio = new Audio()
    const speechUtterance = new SpeechSynthesisUtterance(text)

    // 设置 TTS 参数
    speechUtterance.lang = 'zh-CN'
    speechUtterance.rate = 1.0
    speechUtterance.pitch = 1.0
    speechUtterance.volume = 1.0

    // TTS 回调
    speechUtterance.onstart = () => {
      console.log('[VoiceAssistantDemo] TTS started')
      // 模拟音频能量（因为 TTS 无法直接分析）
      simulateSpeakingEnergy()
    }

    speechUtterance.onend = () => {
      console.log('[VoiceAssistantDemo] TTS ended')
      setIsSpeaking(false)
      setOrbMode('IDLE')
      setStatusText('待机中...')
      setAudioEnergy(0)
    }

    speechUtterance.onerror = (event) => {
      console.error('[VoiceAssistantDemo] TTS error:', event.error)
      setError(`TTS 错误: ${event.error}`)
      setIsSpeaking(false)
      setOrbMode('IDLE')
      setStatusText('TTS 播放失败')
      setAudioEnergy(0)
    }

    // 播放 TTS
    window.speechSynthesis.speak(speechUtterance)
  }

  // 模拟 TTS 播放时的音频能量
  const simulateSpeakingEnergy = () => {
    const interval = setInterval(() => {
      if (!isSpeaking || orbMode !== 'SPEAK') {
        clearInterval(interval)
        return
      }
      // 模拟波动的能量值
      const energy = 0.3 + Math.random() * 0.5  // 0.3 - 0.8
      setAudioEnergy(energy)
    }, 100)
  }

  // 清理资源
  useEffect(() => {
    return () => {
      audioService.cleanup()
      voiceService.cleanup()
    }
  }, [])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        backgroundColor: '#080a0c',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* NOVA Core 可视化（全屏背景） */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      >
        <NovaOrbCanvas
          mode={orbMode}
          energy={audioEnergy}
          enableCRT={true}
          pixelSize={6}
          particleCount={150}
        />
      </div>

      {/* 控制层 */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          fontFamily: "'VT323', monospace",
          color: '#00FF41',
          textAlign: 'center',
          padding: '20px'
        }}
      >
        {/* 状态显示 */}
        <div
          style={{
            fontSize: '24px',
            textShadow: '0 0 10px #00FF41',
            letterSpacing: '2px'
          }}
        >
          &gt; {statusText}
        </div>

        {/* 转录文本 */}
        {transcriptText && (
          <div
            style={{
              fontSize: '18px',
              color: '#48dbfb',
              maxWidth: '600px',
              lineHeight: '1.6'
            }}
          >
            用户: {transcriptText}
          </div>
        )}

        {/* AI 回复 */}
        {aiResponse && (
          <div
            style={{
              fontSize: '18px',
              color: '#FFD700',
              maxWidth: '600px',
              lineHeight: '1.6'
            }}
          >
            AI: {aiResponse}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              fontSize: '16px',
              color: '#FF0000',
              maxWidth: '600px'
            }}
          >
            错误: {error}
          </div>
        )}

        {/* 控制按钮 */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isSpeaking}
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: '20px',
              padding: '12px 32px',
              backgroundColor: isRecording ? '#FF0000' : '#00FF41',
              color: '#000',
              border: 'none',
              cursor: isSpeaking ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              boxShadow: isRecording ? '0 0 20px #FF0000' : '0 0 20px #00FF41',
              opacity: isSpeaking ? 0.5 : 1
            }}
          >
            {isRecording ? '[ 停止录音 ]' : '[ 开始说话 ]'}
          </button>

          <button
            onClick={() => {
              setConversationHistory([])
              setTranscriptText('')
              setAiResponse('')
              setStatusText('待机中...')
              setError(null)
            }}
            disabled={isRecording || isSpeaking}
            style={{
              fontFamily: "'VT323', monospace",
              fontSize: '20px',
              padding: '12px 32px',
              backgroundColor: 'transparent',
              color: '#00FF41',
              border: '2px solid #00FF41',
              cursor: (isRecording || isSpeaking) ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              opacity: (isRecording || isSpeaking) ? 0.5 : 1
            }}
          >
            [ 清除历史 ]
          </button>
        </div>

        {/* 使用说明 */}
        <div
          style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.5)',
            maxWidth: '500px',
            marginTop: '20px',
            lineHeight: '1.6'
          }}
        >
          点击"开始说话"按钮，对着麦克风说话。<br />
          识别完成后，AI 会自动回复并播放语音。<br />
          NOVA Core 会根据状态变化显示不同的视觉效果。
        </div>
      </div>
    </div>
  )
}

export default VoiceAssistantDemo
