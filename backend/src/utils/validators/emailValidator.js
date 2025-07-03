const logger = require('../logger');

/**
 * Utilitário centralizado para validação de email
 * Consolida todas as validações de email do projeto
 */

/**
 * Regex para validação de email
 */
const EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

/**
 * Normaliza o email para armazenamento
 * @param {string} email - Email a ser normalizado
 * @returns {string} - Email normalizado
 */
const normalizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.toLowerCase().trim();
};

/**
 * Valida se o email está no formato correto
 * @param {string} email - Email a ser validado
 * @returns {boolean} - True se válido
 */
const isValidEmail = (email) => {
  if (!email) return false;
  
  const normalizedEmail = normalizeEmail(email);
  
  // Verificar formato básico
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return false;
  }
  
  // Verificar comprimento
  if (normalizedEmail.length > 320) { // RFC 5321 limit
    return false;
  }
  
  // Verificar se não há espaços
  if (normalizedEmail.includes(' ')) {
    return false;
  }
  
  // Verificar domínios suspeitos básicos
  const suspiciousDomains = [
    'tempmail',
    '10minutemail',
    'guerrillamail',
    'mailinator'
  ];
  
  const domain = normalizedEmail.split('@')[1]?.toLowerCase();
  if (domain && suspiciousDomains.some(suspicious => domain.includes(suspicious))) {
    logger.warn(`Email com domínio suspeito: ${domain}`);
    return false;
  }
  
  return true;
};

/**
 * Extrai o domínio do email
 * @param {string} email - Email 
 * @returns {string|null} - Domínio ou null se inválido
 */
const extractDomain = (email) => {
  if (!isValidEmail(email)) return null;
  
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail.split('@')[1];
};

/**
 * Mascara o email para exibição
 * @param {string} email - Email a ser mascarado
 * @returns {string} - Email mascarado (ex: j***@example.com)
 */
const maskEmail = (email) => {
  if (!isValidEmail(email)) return email;
  
  const normalizedEmail = normalizeEmail(email);
  const [local, domain] = normalizedEmail.split('@');
  
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  
  const maskedLocal = local[0] + '*'.repeat(local.length - 2) + local[local.length - 1];
  return `${maskedLocal}@${domain}`;
};

/**
 * Valida se o email pertence a um domínio institucional
 * @param {string} email - Email a ser validado
 * @param {string[]} allowedDomains - Lista de domínios permitidos
 * @returns {boolean} - True se for domínio institucional
 */
const isInstitutionalEmail = (email, allowedDomains = []) => {
  if (!isValidEmail(email)) return false;
  
  const domain = extractDomain(email);
  return allowedDomains.includes(domain);
};

/**
 * Middleware de validação para Express
 * @param {string} field - Nome do campo a ser validado
 * @param {boolean} required - Se o campo é obrigatório
 * @returns {Function} - Middleware function
 */
const validateEmailMiddleware = (field = 'email', required = true) => {
  return (req, res, next) => {
    const emailValue = req.body[field];
    
    if (!emailValue) {
      if (required) {
        return res.status(400).json({
          error: `Campo ${field} é obrigatório`
        });
      }
      return next();
    }
    
    if (!isValidEmail(emailValue)) {
      logger.warn(`Validação de email falhou para ${emailValue}`);
      return res.status(400).json({
        error: `${field} inválido. Verifique o formato do email`,
        example: 'exemplo@dominio.com'
      });
    }
    
    // Normalizar email
    req.body[field] = normalizeEmail(emailValue);
    next();
  };
};

/**
 * Valida email com domínios permitidos
 * @param {string[]} allowedDomains - Lista de domínios permitidos
 * @returns {Function} - Middleware function
 */
const validateInstitutionalEmailMiddleware = (allowedDomains = []) => {
  return (req, res, next) => {
    const email = req.body.email;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email é obrigatório'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        error: 'Email inválido'
      });
    }
    
    if (!isInstitutionalEmail(email, allowedDomains)) {
      return res.status(400).json({
        error: 'Email deve pertencer a um domínio autorizado',
        allowedDomains
      });
    }
    
    req.body.email = normalizeEmail(email);
    next();
  };
};

module.exports = {
  normalizeEmail,
  isValidEmail,
  extractDomain,
  maskEmail,
  isInstitutionalEmail,
  validateEmailMiddleware,
  validateInstitutionalEmailMiddleware
};