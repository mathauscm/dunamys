const express = require('express');
const helmet = require('helmet');
const logger = require('../utils/logger');

/**
 * Configuração de middlewares centralizada
 * Organiza todos os middlewares de segurança e parsing
 */

/**
 * Configuração do Helmet para segurança
 */
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false
};

/**
 * Middleware de parsing de JSON com validação
 */
const jsonParsingMiddleware = express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({
        error: 'Invalid JSON format',
        details: e.message
      });
      throw new Error('Invalid JSON');
    }
  }
});

/**
 * Middleware de parsing de URL
 */
const urlParsingMiddleware = express.urlencoded({
  extended: true,
  limit: '10mb'
});

/**
 * Middleware de logging de requisições
 */
const requestLoggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  // Log request com mais detalhes em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log(`📥 ${req.method} ${req.path}`, {
      origin: req.get('Origin'),
      userAgent: req.get('User-Agent')?.substring(0, 50),
      authorization: req.get('Authorization') ? 'Present' : 'Missing'
    });
  }

  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📤 ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
    
    logger.info(`${req.method} ${req.path} - ${res.statusCode}`, {
      duration: `${duration}ms`,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });
  });

  next();
};

/**
 * Middleware de tratamento de erros específicos
 */
const specificErrorMiddleware = (err, req, res, next) => {
  // Erro de JSON malformado
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn(`JSON syntax error from ${req.ip}:`, err.message);
    return res.status(400).json({
      error: 'JSON inválido',
      details: 'Verifique a sintaxe do JSON enviado'
    });
  }

  // Erro de limite de payload
  if (err.type === 'entity.too.large') {
    logger.warn(`Payload too large from ${req.ip}`);
    return res.status(413).json({
      error: 'Payload muito grande',
      details: 'O tamanho da requisição excede o limite permitido'
    });
  }

  next(err);
};

/**
 * Aplica todos os middlewares básicos
 * @param {Express} app - Instância do Express
 */
const applyBasicMiddlewares = (app) => {
  // Trust proxy para deployment atrás de reverse proxy
  app.set('trust proxy', 1);

  // Helmet para headers de segurança
  app.use(helmet(helmetConfig));

  // Body parsing middlewares
  app.use(jsonParsingMiddleware);
  app.use(urlParsingMiddleware);

  // Request logging
  app.use(requestLoggingMiddleware);

  // Error handling específico
  app.use(specificErrorMiddleware);

  console.log('✅ Middlewares básicos aplicados');
};

/**
 * Configura middlewares de arquivos estáticos
 * @param {Express} app - Instância do Express
 */
const applyStaticMiddlewares = (app) => {
  const path = require('path');

  // Serve static files
  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
  app.use('/public', express.static(path.join(__dirname, '../../public')));

  console.log('✅ Middlewares de arquivos estáticos aplicados');
};

/**
 * Middleware de debug para desenvolvimento
 */
const debugMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Debug Info:', {
      method: req.method,
      path: req.path,
      query: req.query,
      body: req.method !== 'GET' ? req.body : undefined,
      headers: {
        'content-type': req.get('content-type'),
        'authorization': req.get('authorization') ? 'Present' : 'Missing',
        'user-agent': req.get('user-agent')?.substring(0, 50)
      }
    });
  }
  next();
};

/**
 * Aplica middlewares de desenvolvimento
 * @param {Express} app - Instância do Express
 */
const applyDevelopmentMiddlewares = (app) => {
  if (process.env.NODE_ENV === 'development') {
    app.use(debugMiddleware);
    console.log('🚀 Middlewares de desenvolvimento aplicados');
  }
};

module.exports = {
  helmetConfig,
  jsonParsingMiddleware,
  urlParsingMiddleware,
  requestLoggingMiddleware,
  specificErrorMiddleware,
  debugMiddleware,
  applyBasicMiddlewares,
  applyStaticMiddlewares,
  applyDevelopmentMiddlewares
};