/**
 * Utilitário centralizado para validação de telefone no frontend
 * Sincronizado com a validação do backend
 */

/**
 * Remove caracteres não numéricos do telefone
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone apenas com números
 */
export const cleanPhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  return phone.replace(/\D/g, '');
};

/**
 * Lista de DDDs válidos no Brasil
 */
const VALID_DDDS = [
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

/**
 * Valida se o número de telefone está no formato correto
 * @param {string} phone - Número de telefone
 * @returns {boolean} - True se válido
 */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const cleanedPhone = cleanPhone(phone);
  
  // Telefone deve ter 10 ou 11 dígitos
  if (!/^\d{10,11}$/.test(cleanedPhone)) {
    return false;
  }
  
  // Validar DDD
  const ddd = parseInt(cleanedPhone.substring(0, 2));
  if (!VALID_DDDS.includes(ddd)) {
    return false;
  }
  
  return true;
};

/**
 * Formata o número de telefone para exibição
 * @param {string} phone - Número de telefone
 * @returns {string} - Telefone formatado (11) 99999-9999
 */
export const formatPhone = (phone) => {
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
 * Formata telefone enquanto o usuário digita
 * @param {string} value - Valor atual do input
 * @returns {string} - Valor formatado
 */
export const formatPhoneInput = (value) => {
  const cleaned = cleanPhone(value);
  
  if (cleaned.length === 0) return '';
  if (cleaned.length <= 2) return `(${cleaned}`;
  if (cleaned.length <= 6) return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2)}`;
  if (cleaned.length <= 10) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
  }
  if (cleaned.length === 11) {
    return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
  }
  
  // Limitar a 11 dígitos
  const truncated = cleaned.substring(0, 11);
  return `(${truncated.substring(0, 2)}) ${truncated.substring(2, 7)}-${truncated.substring(7)}`;
};

/**
 * Valida telefone com mensagem de erro
 * @param {string} phone - Número de telefone
 * @returns {Object} - { isValid: boolean, error?: string }
 */
export const validatePhone = (phone) => {
  if (!phone) {
    return { isValid: false, error: 'Telefone é obrigatório' };
  }
  
  const cleanedPhone = cleanPhone(phone);
  
  if (cleanedPhone.length < 10) {
    return { isValid: false, error: 'Telefone deve ter pelo menos 10 dígitos' };
  }
  
  if (cleanedPhone.length > 11) {
    return { isValid: false, error: 'Telefone deve ter no máximo 11 dígitos' };
  }
  
  const ddd = parseInt(cleanedPhone.substring(0, 2));
  if (!VALID_DDDS.includes(ddd)) {
    return { isValid: false, error: 'DDD inválido' };
  }
  
  return { isValid: true };
};

/**
 * Obtém a máscara do telefone baseada no comprimento
 * @param {string} phone - Número de telefone
 * @returns {string} - Máscara do telefone
 */
export const getPhoneMask = (phone) => {
  const cleaned = cleanPhone(phone);
  
  if (cleaned.length <= 10) {
    return '(99) 9999-9999';
  }
  
  return '(99) 99999-9999';
};

/**
 * Normaliza o telefone para envio ao backend
 * @param {string} phone - Número de telefone formatado
 * @returns {string} - Telefone limpo
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  
  const cleaned = cleanPhone(phone);
  
  if (!isValidPhone(cleaned)) {
    throw new Error('Número de telefone inválido');
  }
  
  return cleaned;
};