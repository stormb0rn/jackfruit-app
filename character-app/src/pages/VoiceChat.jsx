/**
 * VoiceChat Page - 实时语音聊天页面
 * 展示完整的5状态机 + 真实TTS + VAD 功能
 */

import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import NovaOrbCanvas from '../components/NovaOrbCanvas'
import useOrbStateMachine from '../hooks/useOrbStateMachine'
import ttsService from '../services/ttsService'
import voiceService from '../services/voiceService'
import './VoiceChat.css'

export default function VoiceChat() {
  const { characterId } = useParams()
  const {
    orbMode,
    audioEnergy,
    isProcessing,
    startListening,
    stopListening,
    startThinking,
    stopThinking,
    startSpeaking,
    reset,
    OrbStates
  } = useOrbStateMachine()

  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [aiResponse, setAiResponse] = useState('')
  const [conversationHistory, setConversationHistory] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState(null)
  const [browserSupport, setBrowserSupport] = useState(null)

  // 检查浏览器支持
  useEffect(() => {
    const support = voiceService.constructor.isSupported()
    setBrowserSupport(support)
    console.log('[VoiceChat] 浏览器支持检测:', support)

    if (!support.recognition) {
      console.warn('[VoiceChat] ⚠️ 浏览器不支持语音识别')
    }
  }, [])

  // 开始录音
  const handleStartRecording = async () => {
    console.log('[VoiceChat] 🎤 开始录音...')

    // 检查浏览器支持
    const support = voiceService.constructor.isSupported()
    console.log('[VoiceChat] 浏览器支持情况:', support)

    if (!support.recognition) {
      setError('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
      return
    }

    setError(null)
    setTranscript('')
    setInterimTranscript('')
    setIsRecording(true)

    let finalText = ''

    // 启动语音识别
    const started = voiceService.startRecognition({
      onResult: (result) => {
        console.log('[VoiceChat] 📝 识别结果:', result)
        if (result.interim) {
          setInterimTranscript(result.interim)
          console.log('[VoiceChat] 临时文本:', result.interim)
        }
        if (result.final) {
          finalText = result.final
          setTranscript(result.final)
          setInterimTranscript('')
          console.log('[VoiceChat] ✅ 最终文本:', result.final)
        }
      },
      onEnd: async () => {
        // 语音识别结束，处理用户消息
        console.log('[VoiceChat] ⏹ Recognition ended, final text:', finalText)
        if (finalText && finalText.trim().length > 0) {
          await handleUserMessage(finalText)
        } else {
          setError('没有识别到语音，请重试。提示：说话后需要停顿1-2秒让浏览器处理。')
          reset()
          setIsRecording(false)
        }
      },
      onError: (err) => {
        console.error('[VoiceChat] ❌ Speech recognition error:', err)
        let errorMsg = '语音识别失败：'
        switch(err) {
          case 'no-speech':
            errorMsg += '没有检测到语音，请确保麦克风正常工作'
            break
          case 'audio-capture':
            errorMsg += '无法访问麦克风，请检查权限'
            break
          case 'not-allowed':
            errorMsg += '麦克风权限被拒绝，请允许使用麦克风'
            break
          default:
            errorMsg += err
        }
        setError(errorMsg)
        reset()
        setIsRecording(false)
      }
    })

    if (!started) {
      setError('语音识别启动失败，请刷新页面重试')
      setIsRecording(false)
      return
    }

    // 启动光球监听模式（带 VAD）
    const success = await startListening({
      enableVAD: true,
      vadThreshold: 0.05,
      vadSilenceDuration: 1500,
      onSilence: () => {
        // 检测到静默，停止录音
        voiceService.stopRecognition()
      }
    })

    if (!success) {
      setError('无法访问麦克风，请检查权限')
      setIsRecording(false)
    }
  }

  // 手动停止录音
  const handleStopRecording = () => {
    voiceService.stopRecognition()
    stopListening()
    setIsRecording(false)
  }

  // 处理用户消息
  const handleUserMessage = async (userText) => {
    if (!userText || userText.trim().length === 0) {
      reset()
      setIsRecording(false)
      return
    }

    // 停止监听
    stopListening()
    setIsRecording(false)

    // 添加到对话历史
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: userText,
      timestamp: new Date()
    }])

    // 开始思考
    startThinking()

    try {
      // 生成 AI 回复（这里使用简单的回声作为示例）
      const aiText = await generateAIResponse(userText)
      setAiResponse(aiText)

      // 添加 AI 回复到历史
      setConversationHistory(prev => [...prev, {
        role: 'ai',
        content: aiText,
        timestamp: new Date()
      }])

      // 生成 TTS 音频
      const audioUrl = await ttsService.textToSpeech(aiText)

      stopThinking()

      if (audioUrl) {
        // 播放真实 TTS 音频
        await startSpeaking(audioUrl)
      } else {
        // 降级到浏览器 TTS
        voiceService.speak(aiText, {
          callbacks: {
            onEnd: () => {
              reset()
            }
          }
        })
      }
    } catch (error) {
      console.error('[VoiceChat] Error processing message:', error)
      setError('处理消息时出错，请重试')
      reset()
    }
  }

  // 生成 AI 回复（示例实现）
  const generateAIResponse = async (userText) => {
    // TODO: 调用真实的 AI API（如 Gemini）
    // 这里使用简单的回声作为示例

    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟 API 延迟

    const responses = [
      `我听到你说："${userText}"。这很有趣！`,
      `你提到了 "${userText}"，让我想想...`,
      `关于 "${userText}"，我有一些想法要分享。`,
      `"${userText}" 是个好问题！让我为你解答。`
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  // 清空对话历史
  const handleClearHistory = () => {
    setConversationHistory([])
    setTranscript('')
    setAiResponse('')
    setError(null)
    reset()
  }

  return (
    <div className="voice-chat-page">
      {/* 背景光球 */}
      <div className="orb-container">
        <NovaOrbCanvas
          mode={orbMode}
          energy={audioEnergy}
          particleCount={260}
        />
      </div>

      {/* 主界面 */}
      <div className="voice-chat-content">
        <header className="voice-chat-header">
          <h1>AI 语音聊天</h1>
          <p className="character-id">
            {characterId ? `与角色 #${characterId} 对话` : '演示模式'}
          </p>
        </header>

        {/* 浏览器兼容性警告 */}
        {browserSupport && !browserSupport.recognition && (
          <div className="error-message" style={{ marginBottom: '1rem' }}>
            <p>⚠️ 您的浏览器不支持语音识别功能</p>
            <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              建议使用 <strong>Chrome 浏览器</strong> 以获得最佳体验
            </p>
          </div>
        )}

        {/* 状态指示器 */}
        <div className="status-indicator">
          <div className={`status-badge status-${orbMode.toLowerCase()}`}>
            {orbMode === OrbStates.IDLE && '待机'}
            {orbMode === OrbStates.LISTENING && '监听中'}
            {orbMode === OrbStates.HEARING && '听到声音'}
            {orbMode === OrbStates.THINKING && 'AI 思考中...'}
            {orbMode === OrbStates.SPEAKING && 'AI 回复中'}
          </div>
          {isProcessing && (
            <div className="processing-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>

        {/* 当前转录 */}
        {(transcript || interimTranscript) && (
          <div className="current-transcript">
            <h3>你说：</h3>
            <p className="transcript-text">
              {transcript || interimTranscript}
              {interimTranscript && <span className="cursor">|</span>}
            </p>
          </div>
        )}

        {/* AI 回复 */}
        {aiResponse && (
          <div className="ai-response">
            <h3>AI 回复：</h3>
            <p className="ai-text">{aiResponse}</p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="error-message">
            <p>⚠️ {error}</p>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="controls">
          {!isRecording && orbMode === OrbStates.IDLE && (
            <button
              className="btn btn-primary btn-large"
              onClick={handleStartRecording}
            >
              🎤 开始对话
            </button>
          )}

          {isRecording && (
            <button
              className="btn btn-danger btn-large pulse"
              onClick={handleStopRecording}
            >
              ⏸ 停止录音
            </button>
          )}

          {conversationHistory.length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={handleClearHistory}
            >
              🗑 清空历史
            </button>
          )}
        </div>

        {/* 对话历史 */}
        {conversationHistory.length > 0 && (
          <div className="conversation-history">
            <h3>对话历史</h3>
            <div className="history-list">
              {conversationHistory.map((item, index) => (
                <div key={index} className={`history-item history-${item.role}`}>
                  <div className="history-role">
                    {item.role === 'user' ? '👤 你' : '🤖 AI'}
                  </div>
                  <div className="history-content">{item.content}</div>
                  <div className="history-time">
                    {item.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用说明 */}
        <div className="instructions">
          <h4>使用说明：</h4>
          <ul>
            <li>点击「开始对话」允许麦克风权限</li>
            <li>光球变为蓝色时开始说话</li>
            <li>停止说话1.5秒后自动结束录音（VAD）</li>
            <li>AI 思考时光球变为紫色并旋转</li>
            <li>AI 回复时光球变为青色并扩散</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
