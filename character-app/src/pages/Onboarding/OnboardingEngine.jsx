import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingConfig } from './hooks/useOnboardingConfig'
import { useStepNavigation } from './hooks/useStepNavigation'
import { useUserData } from './hooks/useUserData'
import { MobileFrame } from '../../components/layout/MobileFrame'

// 导入所有步骤组件
import Step1Splash from './steps/Step1Splash'
import Step2IdentityInput from './steps/Step2IdentityInput'
import Step3AIDialogue from './steps/Step3AIDialogue'
import Step4Creation from './steps/Step4Creation'
import Step5Finalizing from './steps/Step5Finalizing'
import Step6Entry from './steps/Step6Entry'

import './styles/onboarding.css'

/**
 * 步骤组件映射（前端逻辑步骤 → 组件）
 * 注：组件命名已统一为 Step1-6，但数据库字段保持旧命名（向后兼容）
 */
const STEP_COMPONENTS = {
  1: Step1Splash,
  2: Step2IdentityInput,
  3: Step3AIDialogue,
  4: Step4Creation,
  5: Step5Finalizing,
  6: Step6Entry
}

/**
 * 步骤配置键名映射（前端步骤 → 数据库字段）
 * 保持映射到旧数据库字段名，无需数据库迁移
 */
const STEP_CONFIG_KEYS = {
  1: 'step_1_splash',
  2: 'step_3_identity_input',  // 历史遗留字段名
  3: 'step_4_choice',           // 历史遗留字段名（现用于 AI Dialogue）
  4: 'step_5_creation',         // 历史遗留字段名
  5: 'step_6_finalizing',       // 历史遗留字段名
  6: 'step_7_entry'             // 历史遗留字段名
}

export const OnboardingEngine = () => {
  const navigate = useNavigate()
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  // 加载配置
  const { config, loading: configLoading, error: configError, fromCache } = useOnboardingConfig()

  // 状态机（现在是 6 步流程，跳过了 step_2_guidance）
  const { currentStepNumber, goToNextStep, goToStep } = useStepNavigation(6)

  // 用户数据管理
  const { sessionId, userData, updateUserData, initSession } = useUserData()

  // Loading 步骤动画（模拟加载进度）
  useEffect(() => {
    if (!configLoading || fromCache) {
      setLoadingStep(0)
      return
    }

    // 多段式加载提示
    const timers = [
      setTimeout(() => setLoadingStep(1), 300),   // "Loading character profile..."
      setTimeout(() => setLoadingStep(2), 800),   // "Preparing experience..."
      setTimeout(() => setLoadingStep(3), 1300)   // "Almost ready..."
    ]

    return () => timers.forEach(timer => clearTimeout(timer))
  }, [configLoading, fromCache])

  // 初始化会话
  useEffect(() => {
    if (config && !sessionId) {
      initSession(config.config_id)
    }
  }, [config, sessionId])

  // 自动播放背景音乐（静音方式）并在用户交互后取消静音
  useEffect(() => {
    if (config?.global_styles?.background_music_url && !musicPlaying) {
      const audio = document.getElementById('global-background-music')
      if (!audio) return

      // 尝试静音自动播放
      audio.muted = true
      audio.play()
        .then(() => {
          console.log('[OnboardingEngine] Background music started (muted)')

          // 监听用户的第一次交互，然后取消静音
          const unmute = () => {
            audio.muted = false
            setMusicPlaying(true)
            console.log('[OnboardingEngine] Background music unmuted')
            document.removeEventListener('click', unmute)
            document.removeEventListener('touchstart', unmute)
            document.removeEventListener('keydown', unmute)
          }

          document.addEventListener('click', unmute)
          document.addEventListener('touchstart', unmute)
          document.addEventListener('keydown', unmute)

          return () => {
            document.removeEventListener('click', unmute)
            document.removeEventListener('touchstart', unmute)
            document.removeEventListener('keydown', unmute)
          }
        })
        .catch(err => {
          console.log('[OnboardingEngine] Music autoplay failed:', err.message)

          // 如果静音播放也失败，等待用户交互
          const playOnInteraction = () => {
            audio.muted = false
            audio.play()
              .then(() => {
                setMusicPlaying(true)
                console.log('[OnboardingEngine] Background music started after user interaction')
              })
              .catch(e => console.error('[OnboardingEngine] Failed to play music:', e))

            document.removeEventListener('click', playOnInteraction)
            document.removeEventListener('touchstart', playOnInteraction)
          }

          document.addEventListener('click', playOnInteraction)
          document.addEventListener('touchstart', playOnInteraction)
        })
    }
  }, [config?.global_styles?.background_music_url, musicPlaying])

  // Loading 状态
  if (configLoading) {
    const loadingMessages = [
      '> INITIALIZING SYSTEM...',
      '> Loading character profile...',
      '> Preparing experience...',
      '> Almost ready...'
    ]

    return (
      <MobileFrame>
        <div className="onboarding-loading">
          <div className="loading-content">
            {/* 多段式加载文本 */}
            <div className="loading-messages">
              {loadingMessages.map((message, index) => (
                <div
                  key={index}
                  className={`loading-message ${index <= loadingStep ? 'visible' : ''}`}
                  style={{
                    opacity: index <= loadingStep ? 1 : 0.3,
                    transition: 'opacity 0.3s ease'
                  }}
                >
                  {message}
                </div>
              ))}
            </div>

            {/* 进度点动画 */}
            <div className="loading-dots">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        </div>
      </MobileFrame>
    )
  }

  // Error 状态
  if (configError || !config) {
    return (
      <MobileFrame>
        <div className="onboarding-error">
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ marginBottom: 16, fontSize: 48 }}>❌</div>
            <div>&gt; SYSTEM ERROR</div>
            <div style={{ fontSize: 14, marginTop: 8, opacity: 0.8 }}>
              {configError || 'No active onboarding configuration found'}
            </div>
            <div style={{ fontSize: 12, marginTop: 16 }}>
              &gt; Please configure onboarding in the admin panel
            </div>
          </div>
        </div>
      </MobileFrame>
    )
  }

  // 获取当前步骤配置
  const stepConfigKey = STEP_CONFIG_KEYS[currentStepNumber]
  const stepConfig = config[stepConfigKey]

  if (!stepConfig) {
    console.error(`[OnboardingEngine] Missing config for step ${currentStepNumber}`)
    return (
      <MobileFrame>
        <div className="onboarding-error">
          <div style={{ textAlign: 'center' }}>
            <div>&gt; CONFIGURATION ERROR</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              Step {currentStepNumber} config not found
            </div>
          </div>
        </div>
      </MobileFrame>
    )
  }

  // 获取对应的步骤组件
  const StepComponent = STEP_COMPONENTS[currentStepNumber]

  if (!StepComponent) {
    console.error(`[OnboardingEngine] No component for step ${currentStepNumber}`)
    return (
      <MobileFrame>
        <div className="onboarding-error">
          <div style={{ textAlign: 'center' }}>
            <div>&gt; STEP NOT IMPLEMENTED</div>
            <div style={{ fontSize: 14, marginTop: 8 }}>
              Step {currentStepNumber} is not available in DEMO mode
            </div>
          </div>
        </div>
      </MobileFrame>
    )
  }

  // 处理步骤完成
  const handleStepComplete = async (stepData) => {
    console.log(`[OnboardingEngine] Step ${currentStepNumber} completed:`, stepData)

    // 更新用户数据
    if (stepData && Object.keys(stepData).length > 0) {
      updateUserData(stepData)
    }

    // Step 6 (原 Step 7) 完成后跳转到角色主页
    if (currentStepNumber === 6) {
      handleRedirect()
      return
    }

    // 正常流程：继续下一步
    goToNextStep()
  }

  // 跳转到目标角色
  const handleRedirect = () => {
    const targetCharacterId = config.target_character_id

    console.log('[OnboardingEngine] Redirecting to character:', targetCharacterId)

    if (config.flow_type === 'fixed_character' && targetCharacterId) {
      setTimeout(() => {
        navigate(`/character/${targetCharacterId}`)
      }, 500)
    } else {
      console.error('[OnboardingEngine] No target character configured')
      // Fallback: 跳转到角色列表
      navigate('/characters')
    }
  }

  return (
    <MobileFrame>
      <div className="onboarding-engine">
        {/* 全局背景音乐（循环播放，贯穿所有步骤） */}
        {config?.global_styles?.background_music_url && (
          <audio
            id="global-background-music"
            src={config.global_styles.background_music_url}
            loop
            style={{ display: 'none' }}
          />
        )}

        {/* 步骤指示器（左下角） */}
        <div className="step-indicator">
          <div className="step-number">Step {currentStepNumber}/6</div>
          <div className="step-name">{stepConfigKey}</div>
        </div>

        <StepComponent
          config={stepConfig}
          globalStyles={config?.global_styles}
          onComplete={handleStepComplete}
          currentStep={currentStepNumber}
          userData={userData}
        />
      </div>
    </MobileFrame>
  )
}

export default OnboardingEngine
