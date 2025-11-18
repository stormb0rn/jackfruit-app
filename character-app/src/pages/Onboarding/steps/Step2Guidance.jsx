import { useState, useEffect } from 'react'
import '../styles/onboarding.css'

/**
 * Step 2: 助手引导 (Guidance)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "video",
 *     background_url: "https://...",
 *     assistant_avatar_url: "https://..."
 *   },
 *   content: {
 *     greeting: "Hi, I'm your guide.",
 *     messages: [
 *       "I will help you create your second life.",
 *       "Are you ready to begin?"
 *     ]
 *   },
 *   interaction: {
 *     type: "button",
 *     button_text: "[ LET'S GO ]"
 *   }
 * }
 */
export const Step2Guidance = ({ config, globalStyles, onComplete }) => {
  const [messagesVisible, setMessagesVisible] = useState([])
  const [showButton, setShowButton] = useState(false)

  useEffect(() => {
    // 重置状态
    setMessagesVisible([])
    setShowButton(false)

    // 先显示 greeting
    const greeting = config.content?.greeting
    const messages = config.content?.messages || []
    const allMessages = greeting ? [greeting, ...messages] : messages

    const timers = []
    let delay = 500 // 初始延迟

    allMessages.forEach((msg, index) => {
      const timer = setTimeout(() => {
        setMessagesVisible(prev => {
          if (prev.includes(msg)) return prev
          return [...prev, msg]
        })

        // 最后一条消息显示后，显示按钮
        if (index === allMessages.length - 1) {
          setTimeout(() => {
            setShowButton(true)
          }, 600)
        }
      }, delay)
      timers.push(timer)
      delay += 1200 // 每条消息延迟 1.2s
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [config.content])

  const handleContinue = () => {
    console.log('[Step2Guidance] User clicked continue')
    onComplete({})
  }

  return (
    <div className="onboarding-step step-2-guidance">
      {/* 背景层 */}
      {config.visual?.background_type === 'video' && config.visual?.background_url && (
        <div className="background-layer">
          <video
            src={config.visual.background_url}
            autoPlay
            loop
            muted
            playsInline
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0
            }}
          />
          <div
            className="background-overlay"
            style={{
              background: globalStyles?.background_overlay || 'rgba(0, 0, 0, 0.7)'
            }}
          />
        </div>
      )}

      {/* 内容层 */}
      <div className="content-layer">
        {/* 助手头像 */}
        {config.visual?.assistant_avatar_url && (
          <div className="assistant-avatar fade-in">
            <img
              src={config.visual.assistant_avatar_url}
              alt="Assistant"
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                border: `2px solid ${globalStyles?.primary_color || '#00FF41'}`,
                marginBottom: 24
              }}
            />
          </div>
        )}

        {/* 对话消息 */}
        <div className="guidance-messages">
          {messagesVisible.map((msg, index) => (
            <div
              key={index}
              className="guidance-message fade-in"
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: '#FFFFFF',
                fontSize: 20,
                marginBottom: 16,
                opacity: 0,
                animation: `fadeIn 0.5s ease-in ${index * 0.3}s forwards`
              }}
            >
              &gt; {msg}
            </div>
          ))}
        </div>

        {/* 按钮 */}
        {showButton && (
          <div className="button-container fade-in">
            <button
              className="terminal-button"
              onClick={handleContinue}
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41',
                borderColor: globalStyles?.primary_color || '#00FF41'
              }}
            >
              {config.interaction?.button_text || '[ CONTINUE ]'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Step2Guidance
