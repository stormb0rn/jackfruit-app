import { useState, useCallback } from 'react'

export const useStepNavigation = (totalSteps = 7) => {
  const [currentStepNumber, setCurrentStepNumber] = useState(1)

  const goToNextStep = useCallback(() => {
    setCurrentStepNumber(prev => Math.min(prev + 1, totalSteps))
  }, [totalSteps])

  const goToPrevStep = useCallback(() => {
    setCurrentStepNumber(prev => Math.max(prev - 1, 1))
  }, [])

  const goToStep = useCallback((stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= totalSteps) {
      setCurrentStepNumber(stepNumber)
    }
  }, [totalSteps])

  const isLastStep = currentStepNumber === totalSteps
  const isFirstStep = currentStepNumber === 1

  return {
    currentStepNumber,
    goToNextStep,
    goToPrevStep,
    goToStep,
    isLastStep,
    isFirstStep
  }
}

export default useStepNavigation
