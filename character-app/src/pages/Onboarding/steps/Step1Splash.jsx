import { useState, useEffect } from 'react'
import '../styles/onboarding.css'

/**
 * Step 1: 启动与世界观 (Splash)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "video",
 *     background_url: "https://...",
 *     background_audio_url: "https://..."  // 可选背景音频
 *   },
 *   content: {
 *     title: "START YOUR SECOND LIFE",
 *     lines: ["> WELCOME.", "> BOOTING SYSTEM..."]
 *   },
 *   interaction: {
 *     type: "button",
 *     button_text: "[ INITIATE ]"
 *   }
 * }
 */
export const Step1Splash = ({ config, globalStyles, onComplete }) => {
  const [linesVisible, setLinesVisible] = useState([])
  const [showButton, setShowButton] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)

  useEffect(() => {
    console.log('[Step1Splash] Config received:', config)
    console.log('[Step1Splash] GlobalStyles received:', globalStyles)

    // 重置状态
    setLinesVisible([])
    setShowButton(false)

    // 打字机效果：逐行显示
    const lines = config.content?.lines || []
    console.log('[Step1Splash] Lines to display:', lines)
    const timers = []
    let delay = 0

    lines.forEach((line, index) => {
      const timer = setTimeout(() => {
        setLinesVisible(prev => {
          // 避免重复添加
          if (prev.includes(line)) return prev
          return [...prev, line]
        })

        // 最后一行显示后，显示按钮
        if (index === lines.length - 1) {
          setTimeout(() => {
            setShowButton(true)
          }, 500)
        }
      }, delay)
      timers.push(timer)
      delay += 800  // 每行延迟 800ms
    })

    // 清理函数
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [config.content?.lines])

  const handleContinue = () => {
    console.log('[Step1Splash] User clicked continue')
    onComplete({})
  }

  // 播放背景音频
  const playBackgroundAudio = () => {
    if (config.visual?.background_audio_url && !audioPlaying) {
      const audio = document.getElementById('onboarding-background-audio')
      if (audio) {
        audio.play().catch(err => {
          console.log('[Step1Splash] Audio autoplay prevented:', err.message)
        })
        setAudioPlaying(true)
      }
    }
  }

  return (
    <div className="onboarding-step step-1-splash" onClick={playBackgroundAudio}>
      {/* 背景音频 */}
      {config.visual?.background_audio_url && (
        <audio
          id="onboarding-background-audio"
          src={config.visual.background_audio_url}
          loop
          style={{ display: 'none' }}
        />
      )}

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
        {/* 标题 */}
        {config.content?.title && (
          <h1
            className="splash-title"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF'
            }}
          >
            {config.content.title}
          </h1>
        )}

        {/* 逐行文本（打字机效果） */}
        <div className="terminal-lines">
          {linesVisible.map((line, index) => (
            <p
              key={index}
              className="terminal-line typewriter"
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41'
              }}
            >
              {line}
            </p>
          ))}
        </div>

        {/* 按钮（在所有文本显示后出现） */}
        {linesVisible.length === (config.content?.lines?.length || 0) && (
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

export default Step1Splash
