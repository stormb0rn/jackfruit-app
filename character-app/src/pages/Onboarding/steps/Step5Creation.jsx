import { useState, useEffect } from 'react'
import '../styles/onboarding.css'

/**
 * Step 5: 身份创造 (Creation)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "solid"
 *   },
 *   content: {
 *     title: "GENERATING YOUR NEW IDENTITY...",
 *     stages: [
 *       "ANALYZING INPUT...",
 *       "PROCESSING IMAGE...",
 *       "CREATING PERSONA...",
 *       "FINALIZING..."
 *     ]
 *   },
 *   ai_generation: {
 *     enabled: true,
 *     model: "gemini-2.0",
 *     prompt_template: "Create a character based on: {user_data}"
 *   }
 * }
 */
export const Step5Creation = ({ config, globalStyles, onComplete, userData }) => {
  const [currentStage, setCurrentStage] = useState(0)
  const [generatedData, setGeneratedData] = useState(null)
  const [isGenerating, setIsGenerating] = useState(true)

  useEffect(() => {
    // 模拟 AI 生成过程
    const stages = config.content?.stages || []
    const timers = []

    stages.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCurrentStage(index)

        // 最后一个阶段完成后
        if (index === stages.length - 1) {
          setTimeout(() => {
            // TODO: 调用实际的 AI 生成 API
            const mockGenerated = {
              character_name: userData?.name || 'Mystery User',
              avatar_url: userData?.photo_url || '',
              description: 'A unique persona created from your essence',
              personality_traits: ['creative', 'curious', 'adventurous']
            }
            setGeneratedData(mockGenerated)
            setIsGenerating(false)

            // 自动进入下一步
            setTimeout(() => {
              console.log('[Step5Creation] Generation complete:', mockGenerated)
              onComplete({ generated_character: mockGenerated })
            }, 1500)
          }, 1000)
        }
      }, index * 2000 + 500)
      timers.push(timer)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [config.content?.stages, userData])

  const stages = config.content?.stages || []

  return (
    <div className="onboarding-step step-5-creation">
      <div className="content-layer">
        {/* 标题 */}
        {config.content?.title && (
          <h1
            className="splash-title"
            style={{
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: '#FFFFFF',
              marginBottom: 48
            }}
          >
            {config.content.title}
          </h1>
        )}

        {/* 生成阶段进度 */}
        <div className="generation-stages">
          {stages.map((stage, index) => (
            <div
              key={index}
              className={`generation-stage ${index <= currentStage ? 'active' : ''}`}
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: index <= currentStage
                  ? (globalStyles?.primary_color || '#00FF41')
                  : 'rgba(255, 255, 255, 0.3)',
                fontSize: 20,
                marginBottom: 16,
                transition: 'all 0.3s ease',
                opacity: index <= currentStage ? 1 : 0.3
              }}
            >
              {index < currentStage && '✓ '}
              {index === currentStage && isGenerating && '⟳ '}
              &gt; {stage}
            </div>
          ))}
        </div>

        {/* 生成完成后显示预览 */}
        {!isGenerating && generatedData && (
          <div className="generation-result fade-in" style={{ marginTop: 32 }}>
            <div
              style={{
                border: `2px solid ${globalStyles?.primary_color || '#00FF41'}`,
                padding: 24,
                backgroundColor: 'rgba(0, 255, 65, 0.05)'
              }}
            >
              <div
                style={{
                  fontFamily: globalStyles?.font_family || "'VT323', monospace",
                  color: globalStyles?.primary_color || '#00FF41',
                  fontSize: 24,
                  marginBottom: 12
                }}
              >
                &gt; {generatedData.character_name}
              </div>
              <div
                style={{
                  fontFamily: globalStyles?.font_family || "'VT323', monospace",
                  color: '#FFFFFF',
                  fontSize: 16,
                  opacity: 0.8
                }}
              >
                {generatedData.description}
              </div>
            </div>
          </div>
        )}

        {/* Loading 动画 */}
        {isGenerating && (
          <div className="loading-animation" style={{ marginTop: 48 }}>
            <div
              className="pulse"
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                border: `3px solid ${globalStyles?.primary_color || '#00FF41'}`,
                margin: '0 auto',
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default Step5Creation
