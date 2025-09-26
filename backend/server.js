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

        // WhatsApp será inicializado apenas via endpoint /api/whatsapp/initialize
        console.log('📱 WhatsApp não inicializado automaticamente');
        console.log('   Use POST /api/whatsapp/initialize para conectar');

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