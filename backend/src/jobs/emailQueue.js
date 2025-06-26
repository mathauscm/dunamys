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

// Processar lembretes de escala
emailQueue.process('schedule-reminders', async (job) => {
    const NotificationService = require('../services/NotificationService');

    try {
        await NotificationService.sendScheduleReminders();
        logger.info('Lembretes de escala enviados com sucesso');
        return { success: true };
    } catch (error) {
        logger.error('Erro ao enviar lembretes:', error);
        throw error;
    }
});

// Agendar lembretes diários às 20h
emailQueue.add('schedule-reminders', {}, {
    repeat: { cron: '0 20 * * *' }, // Todo dia às 20h
    removeOnComplete: 10,
    removeOnFail: 5
});

// Event listeners
emailQueue.on('completed', (job) => {
    logger.info(`Job ${job.id} completado`);
});

emailQueue.on('failed', (job, err) => {
    logger.error(`Job ${job.id} falhou:`, err);
});

emailQueue.on('stalled', (job) => {
    logger.warn(`Job ${job.id} travado`);
});

module.exports = emailQueue;
