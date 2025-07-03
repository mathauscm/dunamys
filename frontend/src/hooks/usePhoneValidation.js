import { useState, useCallback } from 'react';
import { 
  formatPhoneInput, 
  validatePhone, 
  normalizePhone,
  cleanPhone
} from '../utils/validators/phoneValidator';

/**
 * Hook customizado para validação e formatação de telefone
 * @param {string} initialValue - Valor inicial do telefone
 * @returns {Object} - Estado e funções para gerenciar telefone
 */
export const usePhoneValidation = (initialValue = '') => {
  const [phone, setPhone] = useState(initialValue);
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(false);

  /**
   * Atualiza o valor do telefone com formatação automática
   * @param {string} value - Novo valor do telefone
   */
  const updatePhone = useCallback((value) => {
    // Formatação automática
    const formattedValue = formatPhoneInput(value);
    setPhone(formattedValue);

    // Validação
    const validation = validatePhone(formattedValue);
    setIsValid(validation.isValid);
    setError(validation.error || '');
  }, []);

  /**
   * Manipulador de mudança para inputs
   * @param {Event} event - Evento de mudança
   */
  const handleChange = useCallback((event) => {
    const value = event.target.value;
    updatePhone(value);
  }, [updatePhone]);

  /**
   * Obtém o valor normalizado para envio ao backend
   * @returns {string} - Telefone normalizado
   */
  const getNormalizedValue = useCallback(() => {
    try {
      return normalizePhone(phone);
    } catch (error) {
      console.warn('Erro ao normalizar telefone:', error);
      return cleanPhone(phone);
    }
  }, [phone]);

  /**
   * Limpa o telefone
   */
  const clearPhone = useCallback(() => {
    setPhone('');
    setError('');
    setIsValid(false);
  }, []);

  /**
   * Define um valor inicial formatado
   * @param {string} value - Valor a ser definido
   */
  const setInitialValue = useCallback((value) => {
    if (value) {
      updatePhone(value);
    } else {
      clearPhone();
    }
  }, [updatePhone, clearPhone]);

  /**
   * Valida o telefone atual sem alterar o estado
   * @returns {Object} - Resultado da validação
   */
  const validate = useCallback(() => {
    return validatePhone(phone);
  }, [phone]);

  return {
    // Estado
    phone,
    error,
    isValid,
    
    // Ações
    updatePhone,
    handleChange,
    clearPhone,
    setInitialValue,
    
    // Utilitários
    getNormalizedValue,
    validate,
    
    // Propriedades para input
    inputProps: {
      value: phone,
      onChange: handleChange,
      placeholder: '(11) 99999-9999',
      maxLength: 15,
      type: 'tel'
    },
    
    // Estado de validação para UI
    validationState: {
      isValid,
      hasError: !!error,
      error
    }
  };
};