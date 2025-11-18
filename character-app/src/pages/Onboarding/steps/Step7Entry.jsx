import { useEffect } from 'react'
import '../styles/onboarding.css'

/**
 * Step 7: 进入世界 (Entry)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "video",
 *     background_url: "https://..."
 *   },
 *   content: {
 *     title: "WELCOME TO YOUR SECOND LIFE",
 *     subtitle: "CLICK ANYWHERE TO ENTER"
 *   },
 *   interaction: {
 *     type: "any_click",
 *     redirect_delay: 500
 *   }
 * }
 */
export const Step7Entry = ({ config, globalStyles, onComplete }) => {
  useEffect(() => {
    // 添加全局点击监听
    const handleClick = () => {
      console.log('[Step7Entry] User clicked to enter')
      onComplete({})
    }

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClick)
      document.addEventListener('keypress', handleClick)
    }, 1000)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keypress', handleClick)
    }
  }, [onComplete])

  return (
    <div className="onboarding-step step-7-entry">
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
          {/* 较少的叠加层，让视频更清晰 */}
          <div
            className="background-overlay"
            style={{
              background: 'rgba(0, 0, 0, 0.3)'
            }}
          />
        </div>
      )}

      {/* 内容层 */}
      <div className="content-layer entry-content">
        {/* 标题 */}
        {config.content?.title && (
          <h1
            className="entry-title fade-in"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF',
              fontSize: 'clamp(32px, 8vw, 56px)',
              textAlign: 'center',
              marginBottom: 24,
              textShadow: '0 0 20px rgba(255, 255, 255, 0.8)'
            }}
          >
            {config.content.title}
          </h1>
        )}

        {/* 副标题/提示 */}
        {config.content?.subtitle && (
          <p
            className="entry-subtitle fade-in pulse"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41',
              fontSize: 'clamp(18px, 4vw, 28px)',
              textAlign: 'center',
              animation: 'pulse 2s ease-in-out infinite'
            }}
          >
            {config.content.subtitle}
          </p>
        )}
      </div>
    </div>
  )
}

export default Step7Entry
