const Queue = require('bull');
const { client } = require('../config/redis');
const EmailService = require('../services/EmailService');
const logger = require('../utils/logger');

// Criar fila de email
const emailQueue = new Queue('email processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    }
});

// Processar jobs de email
emailQueue.process('send-email', async (job) => {
    const { to, subject, html, text } = job.data;

    try {
        await EmailService.sendEmail(to, subject, html, text);
        logger.info(`Email enviado com sucesso para ${to}`);
        return { success: true };
    } catch (error) {
        logger.error(`Erro ao enviar email para ${to}:`, error);
        throw error;
    }
});

// Event listeners
emailQueue.on('completed', (job) => {
    logger.info(`Job ${job.id} completado`);
});

emailQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} falhou:`, err);
});

module.exports = emailQueue;