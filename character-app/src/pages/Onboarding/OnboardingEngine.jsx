import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnboardingConfig } from './hooks/useOnboardingConfig'
import { useStepNavigation } from './hooks/useStepNavigation'
import { useUserData } from './hooks/useUserData'
import { MobileFrame } from '../../components/layout/MobileFrame'

// 导入所有步骤组件
import Step1Splash from './steps/Step1Splash'
import Step2Guidance from './steps/Step2Guidance'
import Step3IdentityInput from './steps/Step3IdentityInput'
import Step4Choice from './steps/Step4Choice'
import Step5Creation from './steps/Step5Creation'
import Step6Finalizing from './steps/Step6Finalizing'
import Step7Entry from './steps/Step7Entry'

import './styles/onboarding.css'

// 步骤组件映射
const STEP_COMPONENTS = {
  1: Step1Splash,
  2: Step2Guidance,
  3: Step3IdentityInput,
  4: Step4Choice,
  5: Step5Creation,
  6: Step6Finalizing,
  7: Step7Entry
}

// 步骤配置键名映射
const STEP_CONFIG_KEYS = {
  1: 'step_1_splash',
  2: 'step_2_guidance',
  3: 'step_3_identity_input',
  4: 'step_4_choice',
  5: 'step_5_creation',
  6: 'step_6_finalizing',
  7: 'step_7_entry'
}

export const OnboardingEngine = () => {
  const navigate = useNavigate()

  // 加载配置
  const { config, loading: configLoading, error: configError } = useOnboardingConfig()

  // 状态机（支持完整 7 步流程）
  const { currentStepNumber, goToNextStep, goToStep } = useStepNavigation(7)

  // 用户数据管理
  const { sessionId, userData, updateUserData, initSession } = useUserData()

  // 初始化会话
  useEffect(() => {
    if (config && !sessionId) {
      initSession(config.config_id)
    }
  }, [config, sessionId])

  // Loading 状态
  if (configLoading) {
    return (
      <MobileFrame>
        <div className="onboarding-loading">
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 16, fontSize: 48 }}>⏳</div>
            <div>&gt; INITIALIZING SYSTEM...</div>
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

    // Step 7 完成后跳转到角色主页
    if (currentStepNumber === 7) {
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
        <StepComponent
          config={stepConfig}
          globalStyles={config.global_styles}
          onComplete={handleStepComplete}
          currentStep={currentStepNumber}
          userData={userData}
        />
      </div>
    </MobileFrame>
  )
}

export default OnboardingEngine
