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

  const handleSelect = (optionId) => {
    setSelectedOption(optionId)
    // 短暂延迟后自动继续
    setTimeout(() => {
      console.log('[Step4Choice] User selected:', optionId)
      onComplete({ choice: optionId })
    }, 500)
  }

  return (
    <div className="onboarding-step step-4-choice">
      <div className="content-layer">
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
