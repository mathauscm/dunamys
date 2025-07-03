/**
 * Centralizador de rotas
 * Organiza todas as rotas da aplicação em um local único
 */

const authRoutes = require('./auth');
const memberRoutes = require('./members');
const scheduleRoutes = require('./schedules');
const adminRoutes = require('./admin');
const campusRoutes = require('./campus');
const ministryRoutes = require('./ministries');
const functionRoutes = require('./functions');

/**
 * Aplica todas as rotas da API
 * @param {Express} app - Instância do Express
 */
const applyRoutes = (app) => {
  // API Routes principais
  app.use('/api/auth', authRoutes);
  app.use('/api/members', memberRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/campus', campusRoutes);
  app.use('/api/ministries', ministryRoutes);
  app.use('/api/functions', functionRoutes);

  console.log('✅ Rotas da API aplicadas');
};

/**
 * Aplica rotas de healthcheck
 * @param {Express} app - Instância do Express
 */
const applyHealthRoutes = (app) => {
  const WhatsAppService = require('../services/WhatsAppService');

  // Health check endpoint simples
  app.get('/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  // Health check da API com verificação de serviços
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected', // Pode ser melhorado com verificação real
        redis: 'connected',
        whatsapp: WhatsAppService.isConnected() ? 'connected' : 'disconnected'
      }
    });
  });

  console.log('✅ Rotas de health check aplicadas');
};

/**
 * Aplica rotas de desenvolvimento
 * @param {Express} app - Instância do Express
 */
const applyDevelopmentRoutes = (app) => {
  if (process.env.NODE_ENV === 'development') {
    const WhatsAppService = require('../services/WhatsAppService');

    // Debug endpoint para desenvolvimento
    app.get('/api/debug', (req, res) => {
      res.json({
        status: 'OK',
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
        headers: req.headers,
        cors_enabled: true,
        rate_limiting: false,
        services: {
          database: 'connected',
          redis: 'connected',
          whatsapp: WhatsAppService.isConnected() ? 'connected' : 'disconnected'
        },
        memory: process.memoryUsage(),
        uptime: process.uptime()
      });
    });

    console.log('🚀 Rotas de desenvolvimento aplicadas');
  }
};

/**
 * Aplica rotas de documentação
 * @param {Express} app - Instância do Express
 */
const applyDocumentationRoutes = (app) => {
  const swaggerUi = require('swagger-ui-express');
  const swaggerSpec = require('../../docs/swagger');

  // Swagger documentation
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Igreja Membros API Documentation',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true
    }
  }));

  // Redirect /docs to /api-docs for convenience
  app.get('/docs', (req, res) => {
    res.redirect('/api-docs');
  });

  console.log('✅ Rotas de documentação aplicadas');
};

/**
 * Aplica rotas especiais (WhatsApp, etc.)
 * @param {Express} app - Instância do Express
 */
const applySpecialRoutes = (app) => {
  const { authenticateToken } = require('../middlewares/auth');
  const WhatsAppService = require('../services/WhatsAppService');

  // WhatsApp QR Code endpoint
  app.get('/api/admin/whatsapp/qr', authenticateToken, (req, res) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem acessar.'
      });
    }

    const qrCode = WhatsAppService.getQRCode();

    if (qrCode) {
      res.json({
        qrCode,
        message: 'Escaneie o QR Code com o WhatsApp para conectar'
      });
    } else {
      res.json({
        message: 'WhatsApp já está conectado ou QR Code não disponível',
        connected: WhatsAppService.isConnected()
      });
    }
  });

  // WhatsApp status endpoint
  app.get('/api/admin/whatsapp/status', authenticateToken, (req, res) => {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acesso negado. Apenas administradores podem acessar.'
      });
    }

    res.json({
      connected: WhatsAppService.isConnected(),
      timestamp: new Date().toISOString()
    });
  });

  console.log('✅ Rotas especiais aplicadas');
};

/**
 * Aplica todas as rotas da aplicação
 * @param {Express} app - Instância do Express
 */
const applyAllRoutes = (app) => {
  applyHealthRoutes(app);
  applyDevelopmentRoutes(app);
  applyRoutes(app);
  applyDocumentationRoutes(app);
  applySpecialRoutes(app);

  console.log('🎉 Todas as rotas aplicadas com sucesso');
};

module.exports = {
  applyRoutes,
  applyHealthRoutes,
  applyDevelopmentRoutes,
  applyDocumentationRoutes,
  applySpecialRoutes,
  applyAllRoutes
};