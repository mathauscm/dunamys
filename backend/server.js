const app = require('./src/app');
const logger = require('./src/utils/logger');

// Initialize services
const { connectDatabase } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const WhatsAppService = require('./src/services/WhatsAppService');

const PORT = process.env.PORT || 5000;

const initializeServices = async () => {
    try {
        console.log('🔄 Inicializando serviços...');

        // Connect to database
        await connectDatabase();
        logger.info('Database connection established');
        console.log('✅ Database conectado');

        // Connect to Redis
        await connectRedis();
        logger.info('Redis connection established');
        console.log('✅ Redis conectado');

        // Email desabilitado - apenas WhatsApp
        console.log('📧 Email desabilitado (apenas WhatsApp)');

        // Initialize WhatsApp service (não falhar se não configurado)
        if (process.env.WHATSAPP_ENABLED === 'true') {
            try {
                await WhatsAppService.initialize();
                logger.info('WhatsApp service initialized successfully');
                console.log('✅ WhatsApp iniciado com sucesso');
            } catch (whatsappError) {
                logger.warn('WhatsApp initialization failed:', whatsappError.message);
                console.log('⚠️ WhatsApp não pôde ser iniciado:', whatsappError.message);
            }
        } else {
            console.log('⚠️ WhatsApp desabilitado via variável de ambiente');
        }

        console.log('🎉 Todos os serviços principais iniciados com sucesso!');
        logger.info('All services initialized successfully');
        
        // Start server after services are initialized
        app.listen(PORT, () => {
            logger.info(`Servidor rodando na porta ${PORT}`);
            console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
            console.log(`📖 Documentação em http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('❌ Erro crítico na inicialização:', error);
        logger.error('Error initializing services:', error);
        process.exit(1);
    }
};

initializeServices();