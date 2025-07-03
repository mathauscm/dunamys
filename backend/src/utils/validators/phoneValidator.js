const logger = require('../logger');

/**
 * Utilitário centralizado para validação de telefone
 * Consolida todas as validações de telefone do projeto
 */

/**
 * Remove caracteres não numéricos do telefone
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone apenas com números
 */
const cleanPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
};

/**
 * Valida se o número de telefone está no formato correto
 * @param {string} phone - Número de telefone
 * @returns {boolean} - True se válido
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const cleanedPhone = cleanPhone(phone);
  
  // Telefone deve ter 10 ou 11 dígitos (com ou sem 9º dígito)
  if (!/^\d{10,11}$/.test(cleanedPhone)) {
    return false;
  }
  
  // Validar DDD (primeiros 2 dígitos)
  const ddd = parseInt(cleanedPhone.substring(0, 2));
  const validDDDs = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
    21, 22, 24, // RJ/ES
    27, 28, // ES
    31, 32, 33, 34, 35, 37, 38, // MG
    41, 42, 43, 44, 45, 46, // PR
    47, 48, 49, // SC
    51, 53, 54, 55, // RS
    61, // DF/GO
    62, 64, // GO
    63, // TO
    65, 66, // MT
    67, // MS
    68, // AC
    69, // RO
    71, 73, 74, 75, 77, // BA
    79, // SE
    81, 87, // PE
    82, // AL
    83, // PB
    84, // RN
    85, 88, // CE
    86, 89, // PI
    91, 93, 94, // PA
    92, 97, // AM
    95, // RR
    96, // AP
    98, 99 // MA
  ];
  
  if (!validDDDs.includes(ddd)) {
    return false;
  }
  
  return true;
};

/**
 * Formata o número de telefone para exibição
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone formatado (11) 99999-9999
 */
const formatPhone = (phone) => {
  if (!phone) return '';
  
  const cleanedPhone = cleanPhone(phone);
  
  if (!isValidPhone(cleanedPhone)) {
    return phone; // Retorna original se inválido
  }
  
  if (cleanedPhone.length === 10) {
    // Formato: (11) 9999-9999
    return `(${cleanedPhone.substring(0, 2)}) ${cleanedPhone.substring(2, 6)}-${cleanedPhone.substring(6)}`;
  } else if (cleanedPhone.length === 11) {
    // Formato: (11) 99999-9999
    return `(${cleanedPhone.substring(0, 2)}) ${cleanedPhone.substring(2, 7)}-${cleanedPhone.substring(7)}`;
  }
  
  return phone;
};

/**
 * Normaliza o telefone para armazenamento no banco
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone limpo para banco
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  
  const cleanedPhone = cleanPhone(phone);
  
  if (!isValidPhone(cleanedPhone)) {
    throw new Error('Número de telefone inválido');
  }
  
  return cleanedPhone;
};

/**
 * Valida e formata telefone para WhatsApp
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone no formato WhatsApp (5511999999999)
 */
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  
  const cleanedPhone = cleanPhone(phone);
  
  if (!isValidPhone(cleanedPhone)) {
    throw new Error('Número de telefone inválido para WhatsApp');
  }
  
  // Adicionar código do país (55 para Brasil)
  return `55${cleanedPhone}`;
};

/**
 * Middleware de validação para Express
 * @param {string} field - Nome do campo a ser validado
 * @returns {Function} - Middleware function
 */
const validatePhoneMiddleware = (field = 'phone') => {
  return (req, res, next) => {
    const phoneValue = req.body[field];
    
    if (!phoneValue) {
      return res.status(400).json({
        error: `Campo ${field} é obrigatório`
      });
    }
    
    try {
      const normalizedPhone = normalizePhone(phoneValue);
      req.body[field] = normalizedPhone; // Armazenar telefone normalizado
      req.body[`${field}Formatted`] = formatPhone(normalizedPhone); // Versão formatada
      next();
    } catch (error) {
      logger.warn(`Validação de telefone falhou para ${phoneValue}:`, error.message);
      return res.status(400).json({
        error: `${field} inválido. Use o formato (11) 99999-9999`,
        details: error.message
      });
    }
  };
};

module.exports = {
  cleanPhone,
  isValidPhone,
  formatPhone,
  normalizePhone,
  formatPhoneForWhatsApp,
  validatePhoneMiddleware
};