const EmailService = require('./EmailService');
const WhatsAppService = require('./WhatsAppService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
    static async sendScheduleAssignment(schedule) {
        const members = schedule.members.map(m => m.user);

        for (const member of members) {
            try {
                // Email
                await this.sendScheduleEmail(schedule, member, 'assignment');

                // WhatsApp
                if (WhatsAppService.isConnected()) {
                    await this.sendScheduleWhatsApp(schedule, member, 'assignment');
                }

                // Registrar notificação
                await this.logNotification({
                    userId: member.id,
                    scheduleId: schedule.id,
                    type: 'SCHEDULE_ASSIGNMENT',
                    channel: 'EMAIL_WHATSAPP',
                    status: 'SENT'
                });

            } catch (error) {
                logger.error(`Erro ao enviar notificação para ${member.name}:`, error);

                await this.logNotification({
                    userId: member.id,
                    scheduleId: schedule.id,
                    type: 'SCHEDULE_ASSIGNMENT',
                    channel: 'EMAIL_WHATSAPP',
                    status: 'FAILED',
                    error: error.message
                });
            }
        }
    }

    static async sendScheduleUpdate(schedule) {
        const members = schedule.members.map(m => m.user);

        for (const member of members) {
            try {
                await this.sendScheduleEmail(schedule, member, 'update');

                if (WhatsAppService.isConnected()) {
                    await this.sendScheduleWhatsApp(schedule, member, 'update');
                }

                await this.logNotification({
                    userId: member.id,
                    scheduleId: schedule.id,
                    type: 'SCHEDULE_UPDATE',
                    channel: 'EMAIL_WHATSAPP',
                    status: 'SENT'
                });

            } catch (error) {
                logger.error(`Erro ao enviar atualização para ${member.name}:`, error);
            }
        }
    }

    static async sendScheduleCancellation(schedule) {
        const members = schedule.members.map(m => m.user);

        for (const member of members) {
            try {
                await this.sendScheduleEmail(schedule, member, 'cancellation');

                if (WhatsAppService.isConnected()) {
                    await this.sendScheduleWhatsApp(schedule, member, 'cancellation');
                }

                await this.logNotification({
                    userId: member.id,
                    scheduleId: schedule.id,
                    type: 'SCHEDULE_CANCELLATION',
                    channel: 'EMAIL_WHATSAPP',
                    status: 'SENT'
                });

            } catch (error) {
                logger.error(`Erro ao enviar cancelamento para ${member.name}:`, error);
            }
        }
    }

    static async sendScheduleReminders() {
        // Buscar escalas para amanhã
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        const endOfTomorrow = new Date(tomorrow);
        endOfTomorrow.setHours(23, 59, 59, 999);

        const schedules = await prisma.schedule.findMany({
            where: {
                date: {
                    gte: tomorrow,
                    lte: endOfTomorrow
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, email: true, phone: true } }
                    }
                }
            }
        });

        for (const schedule of schedules) {
            for (const member of schedule.members) {
                try {
                    await EmailService.sendScheduleReminder(schedule, member.user);

                    if (WhatsAppService.isConnected()) {
                        const message = this.createReminderWhatsAppMessage(schedule, member.user);
                        await WhatsAppService.sendMessage(member.user.phone, message);
                    }

                    await this.logNotification({
                        userId: member.user.id,
                        scheduleId: schedule.id,
                        type: 'SCHEDULE_REMINDER',
                        channel: 'EMAIL_WHATSAPP',
                        status: 'SENT'
                    });

                } catch (error) {
                    logger.error(`Erro ao enviar lembrete para ${member.user.name}:`, error);
                }
            }
        }
    }

    static async sendCustomNotification(schedule, type, message) {
        const members = schedule.members.map(m => m.user);

        for (const member of members) {
            try {
                if (type === 'EMAIL' || type === 'BOTH') {
                    await EmailService.sendEmail(
                        member.email,
                        `Comunicado: ${schedule.title}`,
                        `<h2>Comunicado</h2><p>Olá, ${member.name}!</p><p>${message}</p>`,
                        message
                    );
                }

                if ((type === 'WHATSAPP' || type === 'BOTH') && WhatsAppService.isConnected()) {
                    const whatsappMessage = `*Comunicado - ${schedule.title}*\n\nOlá, ${member.name}!\n\n${message}`;
                    await WhatsAppService.sendMessage(member.phone, whatsappMessage);
                }

                await this.logNotification({
                    userId: member.id,
                    scheduleId: schedule.id,
                    type: 'CUSTOM_NOTIFICATION',
                    channel: type,
                    status: 'SENT',
                    message
                });

            } catch (error) {
                logger.error(`Erro ao enviar comunicado para ${member.name}:`, error);
            }
        }
    }

    static async sendScheduleEmail(schedule, user, type) {
        const scheduleDate = new Date(schedule.date).toLocaleDateString('pt-BR');

        let subject, html;

        switch (type) {
            case 'assignment':
                subject = `Nova Escala: ${schedule.title}`;
                html = `
          <h2>Você foi escalado!</h2>
          <p>Olá, ${user.name}!</p>
          <p>Você foi escalado para o seguinte serviço:</p>
          <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>${schedule.title}</h3>
            <p><strong>Data:</strong> ${scheduleDate}</p>
            <p><strong>Horário:</strong> ${schedule.time}</p>
            <p><strong>Local:</strong> ${schedule.location}</p>
            ${schedule.description ? `<p><strong>Descrição:</strong> ${schedule.description}</p>` : ''}
          </div>
          <p>Contamos com sua presença!</p>
          <p>Deus abençoe!</p>
        `;
                break;

            case 'update':
                subject = `Escala Atualizada: ${schedule.title}`;
                html = `
          <h2>Escala Atualizada</h2>
          <p>Olá, ${user.name}!</p>
          <p>A escala onde você está alocado foi atualizada:</p>
          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>${schedule.title}</h3>
            <p><strong>Data:</strong> ${scheduleDate}</p>
            <p><strong>Horário:</strong> ${schedule.time}</p>
            <p><strong>Local:</strong> ${schedule.location}</p>
            ${schedule.description ? `<p><strong>Descrição:</strong> ${schedule.description}</p>` : ''}
          </div>
          <p>Verifique as informações atualizadas.</p>
        `;
                break;

            case 'cancellation':
                subject = `Escala Cancelada: ${schedule.title}`;
                html = `
          <h2>Escala Cancelada</h2>
          <p>Olá, ${user.name}!</p>
          <p>A escala onde você estava alocado foi cancelada:</p>
          <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3>${schedule.title}</h3>
            <p><strong>Data:</strong> ${scheduleDate}</p>
            <p><strong>Horário:</strong> ${schedule.time}</p>
            <p><strong>Local:</strong> ${schedule.location}</p>
          </div>
          <p>Você não precisa mais comparecer a este serviço.</p>
        `;
                break;
        }

        await EmailService.sendEmail(user.email, subject, html);
    }

    static async sendScheduleWhatsApp(schedule, user, type) {
        const scheduleDate = new Date(schedule.date).toLocaleDateString('pt-BR');

        let message;

        switch (type) {
            case 'assignment':
                message = `*🎯 Nova Escala*\n\nOlá, ${user.name}!\n\nVocê foi escalado para:\n\n*${schedule.title}*\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n📍 Local: ${schedule.location}\n\nContamos com sua presença! 🙏`;
                break;

            case 'update':
                message = `*📝 Escala Atualizada*\n\nOlá, ${user.name}!\n\nSua escala foi atualizada:\n\n*${schedule.title}*\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n📍 Local: ${schedule.location}\n\nVerifique as informações! ✅`;
                break;

            case 'cancellation':
                message = `*❌ Escala Cancelada*\n\nOlá, ${user.name}!\n\nA seguinte escala foi cancelada:\n\n*${schedule.title}*\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n\nVocê não precisa mais comparecer.`;
                break;
        }

        await WhatsAppService.sendMessage(user.phone, message);
    }

    static createReminderWhatsAppMessage(schedule, user) {
        const scheduleDate = new Date(schedule.date).toLocaleDateString('pt-BR');

        return `*🔔 Lembrete de Serviço*\n\nOlá, ${user.name}!\n\nLembrete: você tem um serviço AMANHÃ:\n\n*${schedule.title}*\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n📍 Local: ${schedule.location}\n\nNão esqueça! Deus abençoe! 🙏`;
    }

    static async logNotification(data) {
        try {
            await prisma.notification.create({
                data: {
                    userId: data.userId,
                    scheduleId: data.scheduleId,
                    type: data.type,
                    channel: data.channel,
                    status: data.status,
                    message: data.message,
                    error: data.error,
                    sentAt: new Date()
                }
            });
        } catch (error) {
            logger.error('Erro ao registrar notificação:', error);
        }
    }
}

module.exports = NotificationService;
