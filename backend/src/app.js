const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Debug environment variables
console.log('🌍 NODE_ENV:', process.env.NODE_ENV || 'undefined');
console.log('🔧 FRONTEND_URL:', process.env.FRONTEND_URL || 'undefined');

// Database connection
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const { verifyEmailConfig } = require('./config/email');

// Middlewares
const errorHandler = require('./middlewares/errorHandler');
const { authenticateToken } = require('./middlewares/auth');
const logger = require('./utils/logger');

// Routes - CORRIGIDO COM TODAS AS ROTAS
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const scheduleRoutes = require('./routes/schedules');
const adminRoutes = require('./routes/admin');
const campusRoutes = require('./routes/campus');
const ministryRoutes = require('./routes/ministries');
const functionRoutes = require('./routes/functions');
const functionGroupAdminRoutes = require('./routes/functionGroupAdmins');
const whatsappRoutes = require('./routes/whatsapp');

// Swagger documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../docs/swagger');

// WhatsApp service initialization
const WhatsAppService = require('./services/WhatsAppService');

// Jobs initialization
const emailQueue = require('./jobs/emailQueue');
const whatsappQueue = require('./jobs/whatsappQueue');

// Create Express app
const app = express();

/**
 * ============================================================================
 * TRUST PROXY CONFIGURATION
 * ============================================================================
 */
// Trust proxy for deployment behind reverse proxy (Nginx, Load Balancer, etc.)
app.set('trust proxy', 1);

/**
 * ============================================================================
 * SECURITY MIDDLEWARES
 * ============================================================================
 */

// Helmet for security headers
app.use(helmet({
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
}));

// ===== CORS CONFIGURATION - CORRIGIDA =====
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

app.use(cors(corsOptions));

// Middleware adicional para desenvolvimento - MELHORADO
if (process.env.NODE_ENV === 'development') {
    console.log('🚀 MODO DESENVOLVIMENTO: CORS e Rate Limiting flexibilizados');
    
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
        res.header('Access-Control-Allow-Credentials', 'true');
        
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.sendStatus(200);
        }
        
        next();
    });
}

/**
 * ============================================================================
 * RATE LIMITING - CONFIGURAÇÃO CORRIGIDA PARA DESENVOLVIMENTO
 * ============================================================================
 */

// General rate limiting - MUITO mais permissivo em desenvolvimento
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
        // Skip rate limiting for health checks E DESENVOLVIMENTO
        if (process.env.NODE_ENV === 'development') {
            return true; // Pular completamente em desenvolvimento
        }
        return req.path === '/health' || req.path === '/api/health';
    }
});

// Rate limiting para auth - DESABILITADO EM DESENVOLVIMENTO
const authLimiter = rateLimit({
    windowMs: process.env.NODE_ENV === 'development' ? 1 * 60 * 1000 : 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'development' ? 10000 : 5, // 10.000 em dev
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
    }
});

// Apply rate limiting - CONDICIONAL PARA DESENVOLVIMENTO
if (process.env.NODE_ENV === 'production') {
    console.log('🔒 MODO PRODUÇÃO: Rate limiting ativo');
    app.use('/api/', generalLimiter);
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
} else {
    console.log('🚀 MODO DESENVOLVIMENTO: Rate limiting DESABILITADO');
    // Em desenvolvimento, não aplicar nenhum rate limiting
}

/**
 * ============================================================================
 * BODY PARSING MIDDLEWARES
 * ============================================================================
 */

// Body parsing middleware
app.use(express.json({
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
}));

app.use(express.urlencoded({
    extended: true,
    limit: '10mb'
}));

/**
 * ============================================================================
 * REQUEST LOGGING - MELHORADO
 * ============================================================================
 */

// Request logging middleware - MELHORADO
app.use((req, res, next) => {
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
});

/**
 * ============================================================================
 * STATIC FILES
 * ============================================================================
 */

// Serve static files (uploads, documents, etc.)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/public', express.static(path.join(__dirname, '../public')));

/**
 * ============================================================================
 * API ROUTES
 * ============================================================================
 */

// Health check endpoint (should be before auth middleware)
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
            database: 'connected', // You can add actual health checks here
            redis: 'connected',
            whatsapp: WhatsAppService.isConnected() ? 'connected' : 'disconnected'
        }
    });
});

// Debug endpoint for development - NOVO
if (process.env.NODE_ENV === 'development') {
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
}

// API Routes - TODAS AS ROTAS INCLUÍDAS
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/ministries', ministryRoutes);
app.use('/api/functions', functionRoutes);
app.use('/api/function-group-admins', functionGroupAdminRoutes);
app.use('/api/whatsapp', whatsappRoutes);

/**
 * ============================================================================
 * API DOCUMENTATION
 * ============================================================================
 */

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

/**
 * ============================================================================
 * WHATSAPP QR CODE ENDPOINT
 * ============================================================================
 */

// WhatsApp QR Code endpoint for admin setup
app.get('/api/admin/whatsapp/qr', authenticateToken, (req, res) => {
    // Check if user is admin
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

/**
 * ============================================================================
 * DEVELOPMENT ROUTES
 * ============================================================================
 */

// Development-only routes
if (process.env.NODE_ENV === 'development') {
    // Test email endpoint
    app.post('/api/dev/test-email', authenticateToken, async (req, res) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        try {
            const { to, subject, message } = req.body;
            const EmailService = require('./services/EmailService');

            await EmailService.sendEmail(
                to || req.user.email,
                subject || 'Teste de Email',
                `<h2>Teste de Email</h2><p>${message || 'Este é um email de teste do sistema.'}</p>`,
                message || 'Este é um email de teste do sistema.'
            );

            res.json({ message: 'Email de teste enviado com sucesso' });
        } catch (error) {
            logger.error('Erro no teste de email:', error);
            res.status(500).json({ error: 'Erro ao enviar email de teste' });
        }
    });

    // Test WhatsApp endpoint
    app.post('/api/dev/test-whatsapp', authenticateToken, async (req, res) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        try {
            const { phone, message } = req.body;

            if (!WhatsAppService.isConnected()) {
                return res.status(400).json({ error: 'WhatsApp não está conectado' });
            }

            await WhatsAppService.sendMessage(
                phone || req.user.phone,
                message || 'Teste de mensagem do sistema da igreja! 🙏'
            );

            res.json({ message: 'Mensagem de teste enviada com sucesso' });
        } catch (error) {
            logger.error('Erro no teste de WhatsApp:', error);
            res.status(500).json({ error: 'Erro ao enviar mensagem de teste' });
        }
    });

    // WhatsApp restart endpoint
    app.post('/api/dev/whatsapp/restart', authenticateToken, async (req, res) => {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        try {
            await WhatsAppService.reconnect();
            res.json({ message: 'WhatsApp service reiniciado com sucesso' });
        } catch (error) {
            logger.error('Erro ao reiniciar WhatsApp:', error);
            res.status(500).json({ error: 'Erro ao reiniciar WhatsApp service' });
        }
    });
}

/**
 * ============================================================================
 * 404 HANDLER
 * ============================================================================
 */

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    logger.warn(`404 - API route not found: ${req.method} ${req.originalUrl}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    res.status(404).json({
        error: 'Rota da API não encontrada',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// 404 handler for non-API routes
app.use('*', (req, res) => {
    // For non-API routes, you might want to serve your frontend app
    // or redirect to a specific page
    res.status(404).json({
        error: 'Rota não encontrada',
        message: 'Esta é uma API. Acesse /api-docs para documentação.',
        timestamp: new Date().toISOString()
    });
});

/**
 * ============================================================================
 * ERROR HANDLING MIDDLEWARE
 * ============================================================================
 */

// Global error handling middleware (must be last)
app.use(errorHandler);

/**
 * ============================================================================
 * GRACEFUL SHUTDOWN
 * ============================================================================
 */

// Graceful shutdown handling
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    try {
        // Close WhatsApp connection
        if (WhatsAppService.isConnected()) {
            await WhatsAppService.disconnect();
            logger.info('WhatsApp service disconnected');
        }

        // Close database connections
        const { disconnectDatabase } = require('./config/database');
        await disconnectDatabase();
        logger.info('Database disconnected');

        // Close Redis connection
        const { client } = require('./config/redis');
        if (client.isOpen) {
            await client.quit();
            logger.info('Redis disconnected');
        }

        logger.info('Graceful shutdown completed');
        process.exit(0);
    } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
    }
}

/**
 * ============================================================================
 * INITIALIZATION - COM MELHOR ERROR HANDLING
 * ============================================================================
 */

// Services initialization is now handled in server.js

/**
 * ============================================================================
 * EXPORT APP
 * ============================================================================
 */

module.exports = app;