const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Configuração de rate limiting centralizada
 * Remove duplicação e oferece configurações específicas por contexto
 */

/**
 * Rate limiting geral para todas as rotas da API
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100, // 10.000 em dev, 100 em prod
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting para health checks E DESENVOLVIMENTO
    if (process.env.NODE_ENV === 'development') {
      return true; // Pular completamente em desenvolvimento
    }
    return req.path === '/health' || req.path === '/api/health';
  },
  onLimitReached: (req, res, options) => {
    logger.warn(`Rate limit reached for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent')
    });
  }
});

/**
 * Rate limiting específico para autenticação
 */
const authLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 10000 : 5, // 10.000 em dev, 5 em prod
  message: {
    error: process.env.NODE_ENV === 'development' 
      ? 'Rate limiting desabilitado em desenvolvimento' 
      : 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: process.env.NODE_ENV === 'development' ? '0 minutes' : '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  skip: (req) => {
    // Pular completamente em desenvolvimento
    return process.env.NODE_ENV === 'development';
  },
  onLimitReached: (req, res, options) => {
    logger.warn(`Auth rate limit reached for IP: ${req.ip}`, {
      ip: req.ip,
      path: req.path,
      userAgent: req.get('User-Agent'),
      attempts: options.max
    });
  }
});

/**
 * Rate limiting para upload de arquivos
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 10, // Mais restritivo para uploads
  message: {
    error: 'Muitos uploads. Tente novamente em 15 minutos.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Rate limiting para APIs de senha (reset, change)
 */
const passwordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NODE_ENV === 'development' ? 1000 : 3, // Muito restritivo
  message: {
    error: 'Muitas tentativas de alteração de senha. Tente novamente em 1 hora.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  }
});

/**
 * Aplica rate limiting baseado no ambiente
 * @param {Express} app - Instância do Express
 */
const applyRateLimiting = (app) => {
  if (process.env.NODE_ENV === 'production') {
    console.log('🔒 MODO PRODUÇÃO: Rate limiting ativo');
    
    // Rate limiting geral
    app.use('/api/', generalLimiter);
    
    // Rate limiting para autenticação
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
    
    // Rate limiting para funcionalidades específicas
    app.use('/api/auth/forgot-password', passwordLimiter);
    app.use('/api/auth/reset-password', passwordLimiter);
    app.use('/api/auth/change-password', passwordLimiter);
    
    // Rate limiting para uploads (se existir rota)
    app.use('/api/upload', uploadLimiter);
    
  } else {
    console.log('🚀 MODO DESENVOLVIMENTO: Rate limiting DESABILITADO');
    // Em desenvolvimento, não aplicar nenhum rate limiting
  }
};

/**
 * Cria um rate limiter customizado
 * @param {Object} options - Opções do rate limiter
 * @returns {Function} - Middleware de rate limiting
 */
const createCustomLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Muitas tentativas. Tente novamente mais tarde.' },
    standardHeaders: true,
    legacyHeaders: false
  };

  return rateLimit({ ...defaultOptions, ...options });
};

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter,
  passwordLimiter,
  applyRateLimiting,
  createCustomLimiter
};