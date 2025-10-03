const app = require('./src/app');
const logger = require('./src/utils/logger');

// Initialize services
const { connectDatabase } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const WhatsAppService = require('./src/services/WhatsAppServiceHTTP');

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

        // Iniciar WhatsApp Service se estiver habilitado (não bloquear servidor se falhar)
        if (process.env.WHATSAPP_ENABLED === 'true') {
            try {
                await WhatsAppService.initialize();
                logger.info('WhatsApp Service inicializado automaticamente.');
                console.log('✅ WhatsApp Service iniciado');
            } catch (error) {
                logger.error('⚠️ WhatsApp falhou ao inicializar - pode inicializar depois via endpoint /api/whatsapp/initialize');
                console.log('⚠️ WhatsApp não iniciou automaticamente (inicialize depois via API)');
                console.log('💡 Dica: POST /api/whatsapp/initialize');
            }
        } else {
            logger.info('WhatsApp Service desabilitado via variável de ambiente.');
            console.log('📴 WhatsApp desabilitado');
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
