import { useState, useEffect } from 'react'
import '../styles/onboarding.css'

/**
 * Step 6: 确认与加载 (Finalizing)
 *
 * 配置示例:
 * {
 *   visual: {
 *     background_type: "solid"
 *   },
 *   content: {
 *     title: "FINALIZING YOUR IDENTITY...",
 *     steps: [
 *       "Saving profile...",
 *       "Setting up world...",
 *       "Preparing experience..."
 *     ],
 *     completion_message: "YOUR SECOND LIFE AWAITS"
 *   },
 *   interaction: {
 *     type: "automatic",
 *     delay: 3000
 *   }
 * }
 */
export const Step6Finalizing = ({ config, globalStyles, onComplete, userData }) => {
  const [currentStep, setCurrentStep] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const steps = config.content?.steps || []
    const timers = []

    steps.forEach((_, index) => {
      const timer = setTimeout(() => {
        setCurrentStep(index + 1)

        // 所有步骤完成后
        if (index === steps.length - 1) {
          setTimeout(() => {
            setIsComplete(true)

            // 自动进入下一步
            const delay = config.interaction?.delay || 2000
            setTimeout(() => {
              console.log('[Step6Finalizing] Finalization complete')
              onComplete({ finalized: true })
            }, delay)
          }, 800)
        }
      }, index * 1500 + 500)
      timers.push(timer)
    })

    return () => {
      timers.forEach(timer => clearTimeout(timer))
    }
  }, [config.content?.steps, config.interaction?.delay])

  const steps = config.content?.steps || []

  return (
    <div className="onboarding-step step-6-finalizing">
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

        {/* 进度步骤 */}
        <div className="finalizing-steps">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`finalizing-step ${index < currentStep ? 'completed' : index === currentStep ? 'active' : ''}`}
              style={{
                fontFamily: globalStyles?.font_family || "'VT323', monospace",
                color: index < currentStep
                  ? (globalStyles?.primary_color || '#00FF41')
                  : index === currentStep
                  ? '#FFFFFF'
                  : 'rgba(255, 255, 255, 0.3)',
                fontSize: 20,
                marginBottom: 16,
                transition: 'all 0.3s ease'
              }}
            >
              {index < currentStep && '✓ '}
              {index === currentStep && '⟳ '}
              &gt; {step}
            </div>
          ))}
        </div>

        {/* 完成消息 */}
        {isComplete && config.content?.completion_message && (
          <div
            className="completion-message fade-in"
            style={{
              marginTop: 48,
              fontFamily: globalStyles?.font_family || "'VT323', monospace",
              color: globalStyles?.primary_color || '#00FF41',
              fontSize: 28,
              textAlign: 'center',
              textShadow: `0 0 10px ${globalStyles?.primary_color || '#00FF41'}`
            }}
          >
            {config.content.completion_message}
          </div>
        )}

        {/* 进度条 */}
        <div
          className="progress-bar-container"
          style={{
            marginTop: 48,
            width: '100%',
            height: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          <div
            className="progress-bar"
            style={{
              height: '100%',
              backgroundColor: globalStyles?.primary_color || '#00FF41',
              width: `${(currentStep / steps.length) * 100}%`,
              transition: 'width 0.5s ease',
              boxShadow: `0 0 10px ${globalStyles?.primary_color || '#00FF41'}`
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default Step6Finalizing
