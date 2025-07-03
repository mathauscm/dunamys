import { useState, useCallback } from 'react';

/**
 * Hook para gerenciar formulários em formato wizard/abas
 * @param {string[]} steps - Array com os nomes das etapas
 * @param {string} initialStep - Etapa inicial (opcional)
 * @returns {Object} - Estado e funções para controlar o wizard
 */
export const useFormWizard = (steps = [], initialStep = null) => {
  const [currentStep, setCurrentStep] = useState(initialStep || steps[0] || '');
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [visitedSteps, setVisitedSteps] = useState(new Set([currentStep]));

  /**
   * Navega para uma etapa específica
   * @param {string} step - Nome da etapa
   */
  const goToStep = useCallback((step) => {
    if (steps.includes(step)) {
      setCurrentStep(step);
      setVisitedSteps(prev => new Set([...prev, step]));
    }
  }, [steps]);

  /**
   * Vai para a próxima etapa
   * @returns {boolean} - True se conseguiu avançar
   */
  const nextStep = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex !== -1 && currentIndex < steps.length - 1) {
      const nextStepName = steps[currentIndex + 1];
      goToStep(nextStepName);
      return true;
    }
    return false;
  }, [currentStep, steps, goToStep]);

  /**
   * Vai para a etapa anterior
   * @returns {boolean} - True se conseguiu voltar
   */
  const previousStep = useCallback(() => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStepName = steps[currentIndex - 1];
      goToStep(prevStepName);
      return true;
    }
    return false;
  }, [currentStep, steps, goToStep]);

  /**
   * Marca uma etapa como completada
   * @param {string} step - Nome da etapa
   */
  const markStepComplete = useCallback((step) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  }, []);

  /**
   * Marca uma etapa como incompleta
   * @param {string} step - Nome da etapa
   */
  const markStepIncomplete = useCallback((step) => {
    setCompletedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(step);
      return newSet;
    });
  }, []);

  /**
   * Verifica se uma etapa foi completada
   * @param {string} step - Nome da etapa
   * @returns {boolean} - True se completada
   */
  const isStepComplete = useCallback((step) => {
    return completedSteps.has(step);
  }, [completedSteps]);

  /**
   * Verifica se uma etapa foi visitada
   * @param {string} step - Nome da etapa
   * @returns {boolean} - True se visitada
   */
  const isStepVisited = useCallback((step) => {
    return visitedSteps.has(step);
  }, [visitedSteps]);

  /**
   * Verifica se é a primeira etapa
   * @returns {boolean} - True se é a primeira
   */
  const isFirstStep = useCallback(() => {
    return steps.indexOf(currentStep) === 0;
  }, [currentStep, steps]);

  /**
   * Verifica se é a última etapa
   * @returns {boolean} - True se é a última
   */
  const isLastStep = useCallback(() => {
    return steps.indexOf(currentStep) === steps.length - 1;
  }, [currentStep, steps]);

  /**
   * Obtém o índice da etapa atual
   * @returns {number} - Índice da etapa (0-based)
   */
  const getCurrentStepIndex = useCallback(() => {
    return steps.indexOf(currentStep);
  }, [currentStep, steps]);

  /**
   * Obtém o progresso em porcentagem
   * @returns {number} - Progresso de 0 a 100
   */
  const getProgress = useCallback(() => {
    if (steps.length === 0) return 0;
    return Math.round(((getCurrentStepIndex() + 1) / steps.length) * 100);
  }, [steps.length, getCurrentStepIndex]);

  /**
   * Verifica se pode navegar para uma etapa específica
   * @param {string} step - Nome da etapa
   * @returns {boolean} - True se pode navegar
   */
  const canNavigateToStep = useCallback((step) => {
    const stepIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(currentStep);
    
    // Pode navegar para etapas anteriores ou a atual
    if (stepIndex <= currentIndex) {
      return true;
    }
    
    // Pode navegar para próximas etapas se todas as anteriores estão completas
    for (let i = 0; i < stepIndex; i++) {
      if (!completedSteps.has(steps[i])) {
        return false;
      }
    }
    
    return true;
  }, [steps, currentStep, completedSteps]);

  /**
   * Reseta o wizard para o estado inicial
   */
  const resetWizard = useCallback(() => {
    const initialStepName = initialStep || steps[0] || '';
    setCurrentStep(initialStepName);
    setCompletedSteps(new Set());
    setVisitedSteps(new Set([initialStepName]));
  }, [initialStep, steps]);

  /**
   * Verifica se o wizard está completo
   * @returns {boolean} - True se todas as etapas estão completas
   */
  const isWizardComplete = useCallback(() => {
    return steps.every(step => completedSteps.has(step));
  }, [steps, completedSteps]);

  return {
    // Estado atual
    currentStep,
    completedSteps: Array.from(completedSteps),
    visitedSteps: Array.from(visitedSteps),
    
    // Navegação
    goToStep,
    nextStep,
    previousStep,
    
    // Controle de etapas
    markStepComplete,
    markStepIncomplete,
    
    // Verificações
    isStepComplete,
    isStepVisited,
    isFirstStep,
    isLastStep,
    canNavigateToStep,
    isWizardComplete,
    
    // Informações
    getCurrentStepIndex,
    getProgress,
    totalSteps: steps.length,
    
    // Ações
    resetWizard,
    
    // Propriedades úteis para UI
    navigation: {
      canGoBack: !isFirstStep(),
      canGoForward: !isLastStep(),
      progress: getProgress()
    },
    
    // Estado dos steps para UI
    stepStates: steps.map(step => ({
      name: step,
      isCurrent: step === currentStep,
      isComplete: completedSteps.has(step),
      isVisited: visitedSteps.has(step),
      canNavigate: canNavigateToStep(step)
    }))
  };
};