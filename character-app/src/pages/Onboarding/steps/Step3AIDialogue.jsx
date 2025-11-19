import { useState, useEffect } from 'react'
import NovaOrbCanvas from '../../../components/NovaOrbCanvas'
import audioService from '../../../services/audioService'
import '../styles/onboarding.css'

/**
 * Step 4: AI 对话流程 (AI Dialogue)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "solid"
 *   },
 *   content: {
 *     conversation_flow: [
 *       {
 *         id: 1,
 *         ai_question: "Before we begin, tell me - what brings you here?",
 *         user_options: [
 *           { id: "explore", text: "I want to explore new identities" },
 *           { id: "escape", text: "I need to escape my reality" }
 *         ],
 *         next_question_map: {
 *           "explore": 2,
 *           "escape": 2
 *         }
 *       },
 *       {
 *         id: 2,
 *         ai_question: "Are you ready to begin your transformation?",
 *         user_options: [
 *           { id: "stay", text: "STAY AS MYSELF", final: true },
 *           { id: "become", text: "BECOME SOMEONE ELSE", final: true }
 *         ]
 *       }
 *     ]
 *   },
 *   interaction: {
 *     type: "ai_dialogue"
 *   }
 * }
 */
export const Step4AIDialogue = ({ config, globalStyles, onComplete }) => {
  const [currentQuestionId, setCurrentQuestionId] = useState(1)
  const [conversationHistory, setConversationHistory] = useState([])
  const [showQuestion, setShowQuestion] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)
  const [glitching, setGlitching] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioEnergy, setAudioEnergy] = useState(0) // 音频能量
  const [orbMode, setOrbMode] = useState('IDLE') // NOVA Orb 状态

  // 获取当前问题配置
  const conversationFlow = config.content?.conversation_flow || []
  const currentQuestion = conversationFlow.find(q => q.id === currentQuestionId)

  // 启动麦克风监听
  useEffect(() => {
    console.log('[Step4AIDialogue] Starting microphone')
    audioService.startMicrophone((energy) => {
      setAudioEnergy(energy)
    })

    // 组件卸载时清理
    return () => {
      audioService.stopMicrophone()
      console.log('[Step4AIDialogue] Microphone stopped')
    }
  }, [])

  // 根据问题显示状态切换 Orb 模式
  useEffect(() => {
    if (showQuestion && !selectedOption) {
      setOrbMode('SPEAKING')  // AI 显示问题时：说话状态
    } else {
      setOrbMode('IDLE')   // 其他时候：待机状态
    }
  }, [showQuestion, selectedOption])

  // 播放背景音频
  const playBackgroundAudio = () => {
    if (config.visual?.background_audio_url && !audioPlaying) {
      const audio = document.getElementById('step4-background-audio')
      if (audio) {
        audio.play().catch(err => {
          console.log('[Step4AIDialogue] Audio autoplay prevented:', err.message)
        })
        setAudioPlaying(true)
      }
    }
  }

  // 显示问题动画
  useEffect(() => {
    if (!currentQuestion) return

    console.log('[Step4AIDialogue] Showing question:', currentQuestion.id)

    // 重置状态
    setShowQuestion(false)
    setShowOptions(false)
    setSelectedOption(null)

    // 延迟显示问题（打字机效果）
    const questionTimer = setTimeout(() => {
      setShowQuestion(true)
    }, 300)

    // 延迟显示选项
    const optionsTimer = setTimeout(() => {
      setShowOptions(true)
    }, 2000) // 2秒后显示选项（给打字机效果时间）

    return () => {
      clearTimeout(questionTimer)
      clearTimeout(optionsTimer)
    }
  }, [currentQuestionId, currentQuestion])

  // 处理用户选择
  const handleOptionClick = (option) => {
    if (selectedOption) return // 防止重复点击

    console.log('[Step4AIDialogue] User selected:', option.id)

    setSelectedOption(option.id)
    setGlitching(true)
    playBackgroundAudio()

    // 记录对话历史
    const newHistory = [
      ...conversationHistory,
      {
        question: currentQuestion.ai_question,
        answer: option.text,
        optionId: option.id
      }
    ]
    setConversationHistory(newHistory)

    // Glitch 动画持续 1 秒
    setTimeout(() => {
      setGlitching(false)

      // 检查是否是最终选择
      if (option.final) {
        console.log('[Step4AIDialogue] Final choice made:', option.id)
        console.log('[Step4AIDialogue] Conversation history:', newHistory)
        onComplete({
          choice: option.id,
          conversation_history: newHistory
        })
      } else {
        // 跳转到下一个问题
        const nextQuestionId = currentQuestion.next_question_map?.[option.id]
        if (nextQuestionId) {
          console.log('[Step4AIDialogue] Moving to next question:', nextQuestionId)
          setCurrentQuestionId(nextQuestionId)
        } else {
          console.error('[Step4AIDialogue] No next question found for option:', option.id)
        }
      }
    }, 1000)
  }

  // 如果没有配置对话流程，显示错误
  if (!conversationFlow || conversationFlow.length === 0) {
    return (
      <div className="onboarding-step step-4-ai-dialogue">
        <div className="content-layer">
          <div style={{
            fontFamily: globalStyles?.font_family || "'VT323', monospace",
            color: '#FF0000',
            fontSize: 24,
            textAlign: 'center'
          }}>
            &gt; ERROR: No conversation flow configured
          </div>
        </div>
      </div>
    )
  }

  // 如果找不到当前问题，显示错误
  if (!currentQuestion) {
    return (
      <div className="onboarding-step step-4-ai-dialogue">
        <div className="content-layer">
          <div style={{
            fontFamily: globalStyles?.font_family || "'VT323', monospace",
            color: '#FF0000',
            fontSize: 24,
            textAlign: 'center'
          }}>
            &gt; ERROR: Question {currentQuestionId} not found
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="onboarding-step step-4-ai-dialogue">
      {/* Speech 音频（单次播放） */}
      {config.visual?.background_audio_url && (
        <audio
          id="step4-background-audio"
          src={config.visual.background_audio_url}
          style={{ display: 'none' }}
        />
      )}

      {/* NOVA Core AI 助手可视化 */}
      <div
        style={{
          position: 'fixed',
          bottom: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '200px',
          height: '200px',
          zIndex: 100
        }}
      >
        <NovaOrbCanvas
          mode={orbMode}  // 动态切换：SPEAKING（显示问题）或 IDLE（静默）
          energy={audioEnergy}
          particleCount={150}
          colors={{
            idle: '#3d4e5e',
            speak: globalStyles?.primary_color || '#48dbfb'
          }}
        />
      </div>

      <div className={`content-layer ${glitching ? 'glitch-active' : ''}`}>
        {/* 历史对话记录（淡化显示） */}
        {conversationHistory.length > 0 && (
          <div className="conversation-history">
            {conversationHistory.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-question">
                  &gt; {item.question}
                </div>
                <div className="history-answer">
                  → {item.answer}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 当前 AI 问题 */}
        {showQuestion && (
          <div
            className="ai-question typewriter"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41',
              fontSize: 'clamp(20px, 5vw, 32px)',
              textAlign: 'center',
              marginBottom: 48,
              textShadow: `0 0 10px ${globalStyles?.primary_color || '#00FF41'}`,
              lineHeight: 1.4
            }}
          >
            &gt; {currentQuestion.ai_question}
          </div>
        )}

        {/* 用户选项 */}
        {showOptions && (
          <div className="dialogue-options fade-in">
            {currentQuestion.user_options?.map((option, index) => (
              <div
                key={option.id}
                className={`dialogue-option ${selectedOption === option.id ? 'selected' : ''}`}
                onClick={() => handleOptionClick(option)}
                style={{
                  border: `2px solid ${
                    selectedOption === option.id
                      ? globalStyles?.primary_color || '#00FF41'
                      : 'rgba(255, 255, 255, 0.3)'
                  }`,
                  backgroundColor: selectedOption === option.id
                    ? 'rgba(0, 255, 65, 0.1)'
                    : 'transparent',
                  padding: '20px 32px',
                  marginBottom: index < currentQuestion.user_options.length - 1 ? 20 : 0,
                  cursor: selectedOption ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: selectedOption === option.id
                    ? `0 0 20px ${globalStyles?.primary_color || '#00FF41'}`
                    : 'none',
                  opacity: selectedOption && selectedOption !== option.id ? 0.3 : 1,
                  fontFamily: globalStyles?.font_family || "'VT323', monospace",
                  color: selectedOption === option.id
                    ? (globalStyles?.primary_color || '#00FF41')
                    : '#FFFFFF',
                  fontSize: 'clamp(18px, 4vw, 24px)',
                  textAlign: 'center'
                }}
              >
                &gt; {option.text}
              </div>
            ))}
          </div>
        )}

        {/* HUD 装饰元素 */}
        <div className="hud-corners">
          <div className="hud-corner hud-corner-tl" />
          <div className="hud-corner hud-corner-tr" />
          <div className="hud-corner hud-corner-bl" />
          <div className="hud-corner hud-corner-br" />
        </div>
      </div>
    </div>
  )
}

export default Step4AIDialogue
