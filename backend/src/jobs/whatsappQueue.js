const Queue = require('bull');
const WhatsAppService = require('../services/WhatsAppServiceHTTP');
const logger = require('../utils/logger');

// Criar fila do WhatsApp
const whatsappQueue = new Queue('whatsapp processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    }
});

// Processar jobs do WhatsApp
whatsappQueue.process('send-message', async (job) => {
    const { phone, message } = job.data;

    try {
        if (!WhatsAppService.isConnected()) {
            throw new Error('WhatsApp não está conectado');
        }

        await WhatsAppService.sendMessage(phone, message);
        logger.info(`Mensagem WhatsApp enviada para ${phone}`);
        return { success: true };
    } catch (error) {
        logger.error(`Erro ao enviar WhatsApp para ${phone}:`, error);
        throw error;
    }
});

// Event listeners
whatsappQueue.on('completed', (job) => {
    logger.info(`Job WhatsApp ${job.id} completado`);
});

whatsappQueue.on('failed', (job, err) => {
    logger.error(`Job WhatsApp ${job.id} falhou:`, err);
});

module.exports = whatsappQueue;