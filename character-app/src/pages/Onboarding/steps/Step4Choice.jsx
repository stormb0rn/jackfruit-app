import { useState } from 'react'
import '../styles/onboarding.css'

/**
 * Step 4: 核心选择 (Choice)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "solid"
 *   },
 *   content: {
 *     question: "WHAT DO YOU WANT?",
 *     options: [
 *       {
 *         id: "stay",
 *         label: "STAY AS MYSELF",
 *         subtitle: "Keep your identity, enhance yourself"
 *       },
 *       {
 *         id: "become",
 *         label: "BECOME SOMEONE ELSE",
 *         subtitle: "Transform into a new persona"
 *       }
 *     ]
 *   },
 *   interaction: {
 *     type: "selection"
 *   }
 * }
 */
export const Step4Choice = ({ config, globalStyles, onComplete }) => {
  const [selectedOption, setSelectedOption] = useState(null)
  const [hoveredOption, setHoveredOption] = useState(null)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [glitching, setGlitching] = useState(false)

  // 播放背景音频
  const playBackgroundAudio = () => {
    if (config.visual?.background_audio_url && !audioPlaying) {
      const audio = document.getElementById('step4-background-audio')
      if (audio) {
        audio.play().catch(err => {
          console.log('[Step4Choice] Audio autoplay prevented:', err.message)
        })
        setAudioPlaying(true)
      }
    }
  }

  const handleSelect = (optionId) => {
    setSelectedOption(optionId)
    setGlitching(true) // 触发故障效果
    playBackgroundAudio() // 选择选项时播放音频

    // 故障动画持续 1 秒后继续
    setTimeout(() => {
      setGlitching(false)
      console.log('[Step4Choice] User selected:', optionId)
      onComplete({ choice: optionId })
    }, 1000)
  }

  return (
    <div className="onboarding-step step-4-choice">
      {/* Speech 音频（单次播放） */}
      {config.visual?.background_audio_url && (
        <audio
          id="step4-background-audio"
          src={config.visual.background_audio_url}
          style={{ display: 'none' }}
        />
      )}

      <div className={`content-layer ${glitching ? 'glitch-active' : ''}`}>
        {/* 问题标题 */}
        {config.content?.question && (
          <h1
            className="splash-title"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF',
              marginBottom: 64
            }}
          >
            {config.content.question}
          </h1>
        )}

        {/* 选项卡片 */}
        <div className="choice-options">
          {(config.content?.options || []).map((option, index) => (
            <div
              key={option.id}
              className={`choice-option ${selectedOption === option.id ? 'selected' : ''} ${hoveredOption === option.id ? 'hovered' : ''}`}
              onClick={() => handleSelect(option.id)}
              onMouseEnter={() => setHoveredOption(option.id)}
              onMouseLeave={() => setHoveredOption(null)}
              style={{
                border: `2px solid ${
                  selectedOption === option.id
                    ? globalStyles?.primary_color || '#00FF41'
                    : hoveredOption === option.id
                    ? globalStyles?.primary_color || '#00FF41'
                    : 'rgba(255, 255, 255, 0.3)'
                }`,
                backgroundColor: selectedOption === option.id ? 'rgba(0, 255, 65, 0.1)' : 'transparent',
                padding: '24px',
                marginBottom: index < (config.content?.options || []).length - 1 ? 24 : 0,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: hoveredOption === option.id || selectedOption === option.id
                  ? `0 0 20px ${globalStyles?.primary_color || '#00FF41'}`
                  : 'none'
              }}
            >
              <div
                className="option-label"
                style={{
                  fontFamily: globalStyles?.font_family || "'VT323', monospace",
                  color: selectedOption === option.id ? (globalStyles?.primary_color || '#00FF41') : '#FFFFFF',
                  fontSize: 24,
                  marginBottom: 8
                }}
              >
                &gt; {option.label}
              </div>
              {option.subtitle && (
                <div
                  className="option-subtitle"
                  style={{
                    fontFamily: globalStyles?.font_family || "'VT323', monospace",
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontSize: 16
                  }}
                >
                  {option.subtitle}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Step4Choice
