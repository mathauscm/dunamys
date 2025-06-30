const crypto = require('crypto');
const { format, addDays, parseISO, isValid } = require('date-fns');
const { ptBR } = require('date-fns/locale');

/**
 * ============================================================================
 * FUNÇÕES DE CRIPTOGRAFIA E SEGURANÇA
 * ============================================================================
 */

/**
 * Gerar hash seguro para senhas ou tokens
 * @param {string} data - Dados para gerar hash
 * @param {string} algorithm - Algoritmo de hash (padrão: sha256)
 * @returns {string} Hash gerado
 */
const generateHash = (data, algorithm = 'sha256') => {
    return crypto.createHash(algorithm).update(data).digest('hex');
};

/**
 * Gerar token aleatório seguro
 * @param {number} length - Tamanho do token (padrão: 32)
 * @returns {string} Token aleatório
 */
const generateRandomToken = (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
};

/**
 * Gerar código numérico aleatório
 * @param {number} digits - Número de dígitos (padrão: 6)
 * @returns {string} Código numérico
 */
const generateNumericCode = (digits = 6) => {
    const min = Math.pow(10, digits - 1);
    const max = Math.pow(10, digits) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
};

/**
 * Mascarar dados sensíveis para logs
 * @param {string} data - Dados a serem mascarados
 * @param {number} visibleChars - Caracteres visíveis no início/fim
 * @returns {string} Dados mascarados
 */
const maskSensitiveData = (data, visibleChars = 3) => {
    if (!data || typeof data !== 'string') return data;

    if (data.length <= visibleChars * 2) {
        return '*'.repeat(data.length);
    }

    const start = data.substring(0, visibleChars);
    const end = data.substring(data.length - visibleChars);
    const middle = '*'.repeat(data.length - (visibleChars * 2));

    return `${start}${middle}${end}`;
};

/**
 * ============================================================================
 * FUNÇÕES DE FORMATAÇÃO DE DADOS
 * ============================================================================
 */

/**
 * Formatar telefone brasileiro
 * @param {string} phone - Telefone sem formatação
 * @returns {string} Telefone formatado
 */
const formatPhone = (phone) => {
    if (!phone) return '';

    // Remove todos os caracteres não numéricos
    const cleaned = phone.replace(/\D/g, '');

    // Formato para celular (11 dígitos): (11) 99999-9999
    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Formato para fixo (10 dígitos): (11) 9999-9999
    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    return phone; // Retorna original se não conseguir formatar
};

/**
 * Limpar formatação de telefone
 * @param {string} phone - Telefone formatado
 * @returns {string} Telefone apenas com números
 */
const cleanPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
};

/**
 * Formatar CPF
 * @param {string} cpf - CPF sem formatação
 * @returns {string} CPF formatado
 */
const formatCPF = (cpf) => {
    if (!cpf) return '';

    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length === 11) {
        return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    return cpf;
};

/**
 * Formatar moeda brasileira
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado em reais
 */
const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

/**
 * Capitalizar primeira letra de cada palavra
 * @param {string} str - String a ser formatada
 * @returns {string} String com primeira letra maiúscula
 */
const capitalizeWords = (str) => {
    if (!str) return '';

    return str.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
};

/**
 * Truncar texto com reticências
 * @param {string} text - Texto a ser truncado
 * @param {number} maxLength - Tamanho máximo
 * @returns {string} Texto truncado
 */
const truncateText = (text, maxLength = 100) => {
    if (!text || text.length <= maxLength) return text;

    return text.substring(0, maxLength - 3) + '...';
};

/**
 * ============================================================================
 * FUNÇÕES DE VALIDAÇÃO
 * ============================================================================
 */

/**
 * Validar email
 * @param {string} email - Email a ser validado
 * @returns {boolean} true se válido
 */
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validar telefone brasileiro
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} true se válido
 */
const isValidPhone = (phone) => {
    const cleaned = cleanPhone(phone);
    return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Validar CPF
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} true se válido
 */
const isValidCPF = (cpf) => {
    if (!cpf) return false;

    const cleaned = cpf.replace(/\D/g, '');

    if (cleaned.length !== 11) return false;

    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Validação do algoritmo do CPF
    let sum = 0;
    let remainder;

    for (let i = 1; i <= 9; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(9, 10))) return false;

    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
    }

    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.substring(10, 11))) return false;

    return true;
};

/**
 * Validar força da senha
 * @param {string} password - Senha a ser validada
 * @returns {Object} Resultado da validação
 */
const validatePasswordStrength = (password) => {
    const result = {
        isValid: false,
        score: 0,
        errors: [],
        suggestions: []
    };

    if (!password) {
        result.errors.push('Senha é obrigatória');
        return result;
    }

    if (password.length < 6) {
        result.errors.push('Senha deve ter pelo menos 6 caracteres');
    } else {
        result.score += 1;
    }

    if (password.length >= 8) {
        result.score += 1;
    } else {
        result.suggestions.push('Use pelo menos 8 caracteres');
    }

    if (/[a-z]/.test(password)) {
        result.score += 1;
    } else {
        result.suggestions.push('Inclua letras minúsculas');
    }

    if (/[A-Z]/.test(password)) {
        result.score += 1;
    } else {
        result.suggestions.push('Inclua letras maiúsculas');
    }

    if (/\d/.test(password)) {
        result.score += 1;
    } else {
        result.suggestions.push('Inclua números');
    }

    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        result.score += 1;
    } else {
        result.suggestions.push('Inclua caracteres especiais');
    }

    result.isValid = result.score >= 3 && result.errors.length === 0;

    return result;
};

/**
 * ============================================================================
 * FUNÇÕES DE DATA E HORA
 * ============================================================================
 */

/**
 * Formatar data para o padrão brasileiro
 * @param {Date|string} date - Data a ser formatada
 * @param {string} formatStr - Formato desejado
 * @returns {string} Data formatada
 */
const formatDate = (date, formatStr = 'dd/MM/yyyy') => {
    if (!date) return '';

    let dateObj = date;
    if (typeof date === 'string') {
        dateObj = parseISO(date);
    }

    if (!isValid(dateObj)) return '';

    return format(dateObj, formatStr, { locale: ptBR });
};

/**
 * Formatar data e hora
 * @param {Date|string} date - Data a ser formatada
 * @returns {string} Data e hora formatadas
 */
const formatDateTime = (date) => {
    return formatDate(date, 'dd/MM/yyyy HH:mm');
};

/**
 * Calcular diferença em dias entre duas datas
 * @param {Date|string} startDate - Data inicial
 * @param {Date|string} endDate - Data final
 * @returns {number} Diferença em dias
 */
const daysDifference = (startDate, endDate) => {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;

    if (!isValid(start) || !isValid(end)) return 0;

    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Verificar se data está no futuro
 * @param {Date|string} date - Data a ser verificada
 * @returns {boolean} true se for futura
 */
const isFutureDate = (date) => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) return false;

    return dateObj > new Date();
};

/**
 * Obter próximos dias úteis
 * @param {number} count - Quantidade de dias
 * @param {Date} startDate - Data inicial (padrão: hoje)
 * @returns {Array} Array de datas
 */
const getNextBusinessDays = (count, startDate = new Date()) => {
    const dates = [];
    let currentDate = new Date(startDate);

    while (dates.length < count) {
        currentDate = addDays(currentDate, 1);

        // Pular fins de semana (0 = domingo, 6 = sábado)
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
            dates.push(new Date(currentDate));
        }
    }

    return dates;
};

/**
 * ============================================================================
 * FUNÇÕES DE ARRAY E OBJETO
 * ============================================================================
 */

/**
 * Agrupar array por propriedade
 * @param {Array} array - Array a ser agrupado
 * @param {string} key - Propriedade para agrupamento
 * @returns {Object} Objeto agrupado
 */
const groupBy = (array, key) => {
    return array.reduce((result, currentValue) => {
        const groupKey = currentValue[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(currentValue);
        return result;
    }, {});
};

/**
 * Remover propriedades undefined/null de um objeto
 * @param {Object} obj - Objeto a ser limpo
 * @returns {Object} Objeto sem propriedades vazias
 */
const removeEmptyProperties = (obj) => {
    return Object.keys(obj).reduce((acc, key) => {
        const value = obj[key];
        if (value !== null && value !== undefined && value !== '') {
            acc[key] = value;
        }
        return acc;
    }, {});
};

/**
 * Deep clone de objeto
 * @param {any} obj - Objeto a ser clonado
 * @returns {any} Objeto clonado
 */
const deepClone = (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
};

/**
 * Paginar array
 * @param {Array} array - Array a ser paginado
 * @param {number} page - Página atual (começa em 1)
 * @param {number} limit - Itens por página
 * @returns {Object} Resultado da paginação
 */
const paginate = (array, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const paginatedItems = array.slice(offset, offset + limit);

    return {
        data: paginatedItems,
        pagination: {
            page,
            limit,
            total: array.length,
            pages: Math.ceil(array.length / limit),
            hasNext: page < Math.ceil(array.length / limit),
            hasPrev: page > 1
        }
    };
};

/**
 * ============================================================================
 * FUNÇÕES DE RESPOSTA HTTP
 * ============================================================================
 */

/**
 * Resposta de sucesso padronizada
 * @param {Object} res - Response object do Express
 * @param {any} data - Dados a serem retornados
 * @param {string} message - Mensagem de sucesso
 * @param {number} statusCode - Código de status HTTP
 */
const successResponse = (res, data = null, message = 'Sucesso', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

/**
 * Resposta de erro padronizada
 * @param {Object} res - Response object do Express
 * @param {string} message - Mensagem de erro
 * @param {number} statusCode - Código de status HTTP
 * @param {any} details - Detalhes adicionais do erro
 */
const errorResponse = (res, message = 'Erro interno', statusCode = 500, details = null) => {
    return res.status(statusCode).json({
        success: false,
        error: message,
        details,
        timestamp: new Date().toISOString()
    });
};

/**
 * Resposta paginada
 * @param {Object} res - Response object do Express
 * @param {Object} paginatedData - Dados paginados
 * @param {string} message - Mensagem
 */
const paginatedResponse = (res, paginatedData, message = 'Dados recuperados com sucesso') => {
    return res.json({
        success: true,
        message,
        ...paginatedData,
        timestamp: new Date().toISOString()
    });
};

/**
 * ============================================================================
 * FUNÇÕES DE SLUG E URL
 * ============================================================================
 */

/**
 * Gerar slug a partir de string
 * @param {string} text - Texto para gerar slug
 * @returns {string} Slug gerado
 */
const generateSlug = (text) => {
    if (!text) return '';

    return text
        .toLowerCase()
        .trim()
        .replace(/[áàâãäå]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôõö]/g, 'o')
        .replace(/[úùûü]/g, 'u')
        .replace(/[ç]/g, 'c')
        .replace(/[ñ]/g, 'n')
        .replace(/[^a-z0-9 -]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

/**
 * ============================================================================
 * FUNÇÕES DE PERFORMANCE
 * ============================================================================
 */

/**
 * Debounce function
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Delay em milliseconds
 * @returns {Function} Função com debounce
 */
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
};

/**
 * Throttle function
 * @param {Function} func - Função a ser executada
 * @param {number} delay - Delay em milliseconds
 * @returns {Function} Função com throttle
 */
const throttle = (func, delay) => {
    let timeoutId;
    let lastExecTime = 0;
    return (...args) => {
        const currentTime = Date.now();

        if (currentTime - lastExecTime > delay) {
            func.apply(null, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(null, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
};

/**
 * Medir tempo de execução
 * @param {Function} func - Função a ser medida
 * @param {string} label - Label para identificação
 * @returns {any} Resultado da função
 */
const measureExecutionTime = async (func, label = 'Function') => {
    const startTime = process.hrtime.bigint();

    try {
        const result = await func();
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        console.log(`${label} executed in ${executionTime.toFixed(2)}ms`);

        return result;
    } catch (error) {
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;

        console.log(`${label} failed after ${executionTime.toFixed(2)}ms`);
        throw error;
    }
};

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

module.exports = {
    // Criptografia e Segurança
    generateHash,
    generateRandomToken,
    generateNumericCode,
    maskSensitiveData,

    // Formatação
    formatPhone,
    cleanPhone,
    formatCPF,
    formatCurrency,
    capitalizeWords,
    truncateText,

    // Validação
    isValidEmail,
    isValidPhone,
    isValidCPF,
    validatePasswordStrength,

    // Data e Hora
    formatDate,
    formatDateTime,
    daysDifference,
    isFutureDate,
    getNextBusinessDays,

    // Array e Objeto
    groupBy,
    removeEmptyProperties,
    deepClone,
    paginate,

    // Resposta HTTP
    successResponse,
    errorResponse,
    paginatedResponse,

    // Slug e URL
    generateSlug,

    // Performance
    debounce,
    throttle,
    measureExecutionTime
};

/**
 * ============================================================================
 * EXEMPLOS DE USO
 * ============================================================================
 */

/*
// EXEMPLO 1: Formatação de dados
const phone = formatPhone('11999887766'); // (11) 99988-7766
const maskedEmail = maskSensitiveData('usuario@email.com', 3); // usu*****com

// EXEMPLO 2: Validação
const emailValid = isValidEmail('test@email.com'); // true
const passwordCheck = validatePasswordStrength('MinhaSenh@123');
// { isValid: true, score: 6, errors: [], suggestions: [] }

// EXEMPLO 3: Resposta HTTP
app.get('/users', (req, res) => {
  const users = getUsersFromDatabase();
  return successResponse(res, users, 'Usuários recuperados com sucesso');
});

// EXEMPLO 4: Paginação
const allUsers = getUsersFromDatabase();
const paginatedUsers = paginate(allUsers, 1, 10);
// { data: [...], pagination: { page: 1, limit: 10, total: 50, pages: 5 } }

// EXEMPLO 5: Agrupamento
const schedulesByMonth = groupBy(schedules, 'month');
// { 'Janeiro': [...], 'Fevereiro': [...] }

// EXEMPLO 6: Performance
const result = await measureExecutionTime(
  () => expensiveOperation(),
  'Expensive Operation'
);
*/