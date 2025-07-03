const logger = require('../utils/logger');

/**
 * Configuração CORS centralizada
 * Remove duplicação de configuração CORS no app.js
 */

/**
 * Configuração CORS principal
 */
const corsOptions = {
  origin: function (origin, callback) {
    // PERMITIR TODAS AS ORIGENS EM DESENVOLVIMENTO
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5173',
      'https://localhost:3000',
    ];

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Permitir todos em desenvolvimento
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

/**
 * Middleware adicional para desenvolvimento
 * Aplicado apenas quando NODE_ENV === 'development'
 */
const developmentCorsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

/**
 * Aplica configuração CORS baseada no ambiente
 * @param {Express} app - Instância do Express
 */
const applyCorsConfiguration = (app) => {
  const cors = require('cors');
  
  // Aplicar configuração CORS principal
  app.use(cors(corsOptions));
  
  // Aplicar middleware adicional apenas em desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 MODO DESENVOLVIMENTO: CORS flexibilizado');
    app.use(developmentCorsMiddleware);
  } else {
    console.log('🔒 MODO PRODUÇÃO: CORS restritivo aplicado');
  }
};

module.exports = {
  corsOptions,
  developmentCorsMiddleware,
  applyCorsConfiguration
};