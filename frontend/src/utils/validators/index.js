/**
 * Barrel export para todos os validadores do frontend
 * Centraliza as importações de validadores
 */

export * from './phoneValidator';

// Re-export individual validators for convenience
export { 
  cleanPhone, 
  isValidPhone, 
  formatPhone, 
  formatPhoneInput,
  validatePhone,
  normalizePhone 
} from './phoneValidator';