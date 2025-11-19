import { useState, useEffect } from 'react'
import NovaOrbCanvas from '../../../components/NovaOrbCanvas'
import audioService from '../../../services/audioService'
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
  const [phase, setPhase] = useState(1) // 1 = 初始阶段, 2 = 对话阶段
  const [linesVisible, setLinesVisible] = useState([])
  const [currentTypingLine, setCurrentTypingLine] = useState('') // 当前正在打字的行
  const [isTyping, setIsTyping] = useState(false) // 是否正在打字
  const [showButton, setShowButton] = useState(false)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioEnergy, setAudioEnergy] = useState(0) // 音频能量 (0.0-1.0)

  useEffect(() => {
    console.log('[Step1Splash] Config received:', config)
    console.log('[Step1Splash] GlobalStyles received:', globalStyles)
    console.log('[Step1Splash] Current phase:', phase)

    // 重置状态
    setLinesVisible([])
    setCurrentTypingLine('')
    setIsTyping(false)
    setShowButton(false)

    // 打字机效果：逐字符显示
    const allLines = config.content?.lines || []
    console.log('[Step1Splash] All lines:', allLines)

    // 根据阶段选择要显示的行
    const linesToShow = phase === 1 ? allLines.slice(0, 3) : allLines.slice(3, 5)
    console.log('[Step1Splash] Lines to display in phase', phase, ':', linesToShow)

    const timers = []
    let totalDelay = 0

    linesToShow.forEach((line, lineIndex) => {
      // 每行开始前的延迟
      const lineStartDelay = totalDelay

      // 逐字符打字
      for (let charIndex = 0; charIndex <= line.length; charIndex++) {
        const timer = setTimeout(() => {
          if (charIndex === 0) {
            setIsTyping(true)
          }

          setCurrentTypingLine(line.substring(0, charIndex))

          // 当前行打完了
          if (charIndex === line.length) {
            setTimeout(() => {
              setLinesVisible(prev => [...prev, line])
              setCurrentTypingLine('')
              setIsTyping(false)

              // 最后一行打完后，显示按钮
              if (lineIndex === linesToShow.length - 1) {
                setTimeout(() => {
                  setShowButton(true)
                }, 300)
              }
            }, 100) // 稍微停顿后再将完整行移到已完成列表
          }
        }, lineStartDelay + charIndex * 50) // 每个字符延迟 50ms

        timers.push(timer)
      }

      // 计算下一行的开始延迟：当前行字符数 * 50ms + 行间延迟 300ms
      totalDelay += (line.length + 1) * 50 + 300
    })

    // 清理函数
    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [config.content?.lines, phase])

  // Phase 2 自动完成逻辑
  useEffect(() => {
    if (phase === 2 && showButton) {
      console.log('[Step1Splash] Phase 2 started, will auto-complete in 3s')
      const autoCompleteTimer = setTimeout(() => {
        console.log('[Step1Splash] Auto-completing Phase 2')
        onComplete({})
      }, 3000) // 3 秒后自动跳转

      return () => clearTimeout(autoCompleteTimer)
    }
  }, [phase, showButton, onComplete])

  // 启动麦克风监听（Phase 2）
  useEffect(() => {
    if (phase === 2) {
      console.log('[Step1Splash] Starting microphone for Phase 2')
      audioService.startMicrophone((energy) => {
        setAudioEnergy(energy)
      })
    }

    // 组件卸载时清理
    return () => {
      if (phase === 2) {
        audioService.stopMicrophone()
        console.log('[Step1Splash] Microphone stopped')
      }
    }
  }, [phase])

  const handleInitiate = () => {
    console.log('[Step1Splash] User clicked initiate, switching to phase 2')
    setPhase(2)
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
      {/* Speech 音频（单次播放） */}
      {config.visual?.background_audio_url && (
        <audio
          id="onboarding-background-audio"
          src={config.visual.background_audio_url}
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
        {/* 逐行文本（打字机效果） */}
        <div className="terminal-lines">
          {/* 已完成的行 */}
          {linesVisible.map((line, index) => (
            <p
              key={index}
              className="terminal-line"
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41'
              }}
            >
              {line}
            </p>
          ))}
          {/* 当前正在打字的行 */}
          {currentTypingLine && (
            <p
              className="terminal-line typewriter"
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41'
              }}
            >
              {currentTypingLine}
            </p>
          )}
        </div>

        {/* 阶段1: 显示 [INITIATE] 按钮 */}
        {phase === 1 && showButton && (
          <div className="button-container fade-in">
            <button
              className="terminal-button"
              onClick={handleInitiate}
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: globalStyles?.primary_color || '#00FF41',
                borderColor: globalStyles?.primary_color || '#00FF41'
              }}
            >
              {config.interaction?.button_text || '[ INITIATE ]'}
            </button>
            <p
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: 14,
                marginTop: 12,
                textAlign: 'center'
              }}
            >
              open camera and audio to interact with Pika
            </p>
          </div>
        )}

        {/* 阶段2: 显示 NOVA Core（自动过场，无按钮） */}
        {phase === 2 && (
          <div
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '350px',
              height: '350px',
              zIndex: 100
            }}
          >
            <NovaOrbCanvas
              mode="LISTENING"  // Phase 2 是监听状态
              energy={audioEnergy}
              particleCount={260}
              colors={{
                listen: globalStyles?.primary_color || '#2b6cb0'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Step1Splash
