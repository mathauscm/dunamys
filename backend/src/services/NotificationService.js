const EmailService = require('./EmailService');
const WhatsAppService = require('./WhatsAppService');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class NotificationService {
    /**
     * ============================================================================
     * MÉTODOS DE ENVIO DE NOTIFICAÇÕES PARA ESCALAS
     * ============================================================================
     */

    static async sendScheduleAssignment(schedule) {
        console.log('🚨 CHAMOU sendScheduleAssignment!!!');
        logger.info('🚨 DEBUG: sendScheduleAssignment foi chamado');
        
        // Buscar a escala com funções dos membros
        const scheduleWithFunctions = await prisma.schedule.findUnique({
            where: { id: schedule.id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, phone: true, email: true } },
                        functions: {
                            include: {
                                function: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });
        
        const members = scheduleWithFunctions ? scheduleWithFunctions.members.map(m => ({ 
            ...m.user, 
            functions: m.functions.map(f => f.function.name) 
        })) : schedule.members.map(m => ({ 
            ...m.user, 
            functions: [] 
        }));
        
        logger.info(`🔔 Iniciando envio de notificações de escala para ${members.length} membros`);
        logger.info(`📋 Escala: "${schedule.title}" - Data: ${schedule.date}`);
        logger.info(`👥 Membros:`, members.map(m => `${m.name} (${m.email}, ${m.phone}) - Funções: ${m.functions.join(', ')}`));
        
        // Verificar estado dos serviços
        const whatsappConnected = WhatsAppService.isConnected();
        logger.info(`📱 WhatsApp conectado: ${whatsappConnected}`);
        
        for (const member of members) {
            try {
                logger.info(`🚀 Processando membro: ${member.name} (ID: ${member.id})`);
                
                // Email
                try {
                    logger.info(`📧 Tentando enviar email para ${member.email}`);
                    await this.sendScheduleEmail(schedule, member, 'assignment');
                    logger.info(`✅ Email enviado com sucesso para ${member.email}`);
                } catch (emailError) {
                    logger.error(`❌ Erro ao enviar email para ${member.email}:`, emailError);
                }

                // WhatsApp
                if (whatsappConnected) {
                    try {
                        logger.info(`📱 DADOS DO MEMBRO PARA WHATSAPP:`, {
                            nome: member.name,
                            telefone: member.phone,
                            email: member.email,
                            id: member.id
                        });
                        
                        if (!member.phone) {
                            logger.warn(`❌ Membro ${member.name} não tem telefone cadastrado`);
                        } else {
                            logger.info(`📱 Enviando WhatsApp para ${member.name} no número: ${member.phone}`);
                            await this.sendScheduleWhatsApp(schedule, member, 'assignment');
                            logger.info(`✅ WhatsApp enviado com sucesso para ${member.name} (${member.phone})`);
                        }
                    } catch (whatsappError) {
                        logger.error(`❌ Erro ao enviar WhatsApp para ${member.name} (${member.phone}):`, whatsappError);
                    }
                } else {
                    logger.warn(`⚠️ WhatsApp não conectado - pulando envio para ${member.name}`);
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
                logger.error(`💥 Erro geral ao enviar notificação para ${member.name}:`, error);

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
        
        logger.info(`🏁 Processamento de notificações concluído`);
    }

    static async sendScheduleUpdate(schedule) {
        // Buscar a escala com funções dos membros
        const scheduleWithFunctions = await prisma.schedule.findUnique({
            where: { id: schedule.id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, phone: true, email: true } },
                        functions: {
                            include: {
                                function: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });
        
        const members = scheduleWithFunctions ? scheduleWithFunctions.members.map(m => ({ 
            ...m.user, 
            functions: m.functions.map(f => f.function.name) 
        })) : schedule.members.map(m => ({ 
            ...m.user, 
            functions: [] 
        }));

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
                logger.error(`Erro ao enviar atualização de escala para ${member.name}:`, error);
            }
        }
    }

    static async sendScheduleCancellation(schedule) {
        // Buscar a escala com funções dos membros
        const scheduleWithFunctions = await prisma.schedule.findUnique({
            where: { id: schedule.id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, phone: true, email: true } },
                        functions: {
                            include: {
                                function: { select: { name: true } }
                            }
                        }
                    }
                }
            }
        });
        
        const members = scheduleWithFunctions ? scheduleWithFunctions.members.map(m => ({ 
            ...m.user, 
            functions: m.functions.map(f => f.function.name) 
        })) : schedule.members.map(m => ({ 
            ...m.user, 
            functions: [] 
        }));

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
                logger.error(`Erro ao enviar cancelamento de escala para ${member.name}:`, error);
            }
        }
    }

    /**
     * ============================================================================
     * MÉTODOS DE APROVAÇÃO/REJEIÇÃO DE MEMBROS - NOVOS
     * ============================================================================
     */

    static async sendMemberApproval(user) {
        try {
            logger.info(`Enviando notificação de aprovação para ${user.name} (${user.email})`);

            // Enviar email de aprovação
            const emailResult = await EmailService.sendMemberApproval(user);
            
            // Se email foi configurado e enviado
            if (emailResult && !emailResult.skipped) {
                logger.info(`Email de aprovação enviado para ${user.email}`);
            } else {
                logger.info(`Email de aprovação pulado para ${user.email} (não configurado)`);
            }

            // Tentar enviar WhatsApp se estiver conectado
            if (WhatsAppService.isConnected() && user.phone) {
                try {
                    const whatsappMessage = this.createMemberApprovalWhatsAppMessage(user);
                    await WhatsAppService.sendMessage(user.phone, whatsappMessage);
                    logger.info(`WhatsApp de aprovação enviado para ${user.phone}`);
                } catch (whatsappError) {
                    logger.error(`Erro ao enviar WhatsApp de aprovação para ${user.phone}:`, whatsappError);
                }
            }

            // Registrar notificação no banco
            await this.logNotification({
                userId: user.id,
                scheduleId: null,
                type: 'MEMBER_APPROVED',
                channel: 'EMAIL_WHATSAPP',
                status: 'SENT',
                message: `Membro ${user.name} foi aprovado`
            });

            return { success: true };

        } catch (error) {
            logger.error(`Erro ao enviar notificação de aprovação para ${user.name}:`, error);
            
            // Registrar falha
            await this.logNotification({
                userId: user.id,
                scheduleId: null,
                type: 'MEMBER_APPROVED',
                channel: 'EMAIL_WHATSAPP',
                status: 'FAILED',
                error: error.message
            });

            // NÃO falhar a aprovação por causa de notificação
            return { success: false, error: error.message };
        }
    }

    static async sendMemberRejection(user, reason) {
        try {
            logger.info(`Enviando notificação de rejeição para ${user.name} (${user.email})`);

            // Enviar email de rejeição
            const emailResult = await EmailService.sendMemberRejection(user, reason);
            
            // Se email foi configurado e enviado
            if (emailResult && !emailResult.skipped) {
                logger.info(`Email de rejeição enviado para ${user.email}`);
            } else {
                logger.info(`Email de rejeição pulado para ${user.email} (não configurado)`);
            }

            // Tentar enviar WhatsApp se estiver conectado
            if (WhatsAppService.isConnected() && user.phone) {
                try {
                    const whatsappMessage = this.createMemberRejectionWhatsAppMessage(user, reason);
                    await WhatsAppService.sendMessage(user.phone, whatsappMessage);
                    logger.info(`WhatsApp de rejeição enviado para ${user.phone}`);
                } catch (whatsappError) {
                    logger.error(`Erro ao enviar WhatsApp de rejeição para ${user.phone}:`, whatsappError);
                }
            }

            // Registrar notificação no banco
            await this.logNotification({
                userId: user.id,
                scheduleId: null,
                type: 'MEMBER_REJECTED',
                channel: 'EMAIL_WHATSAPP',
                status: 'SENT',
                message: `Membro ${user.name} foi rejeitado. Motivo: ${reason || 'Não informado'}`
            });

            return { success: true };

        } catch (error) {
            logger.error(`Erro ao enviar notificação de rejeição para ${user.name}:`, error);
            
            // Registrar falha
            await this.logNotification({
                userId: user.id,
                scheduleId: null,
                type: 'MEMBER_REJECTED',
                channel: 'EMAIL_WHATSAPP',
                status: 'FAILED',
                error: error.message
            });

            // NÃO falhar a rejeição por causa de notificação
            return { success: false, error: error.message };
        }
    }

    /**
     * ============================================================================
     * MÉTODOS DE LEMBRETES
     * ============================================================================
     */

    static async sendScheduleReminders() {
        try {
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

            logger.info(`Enviando lembretes para ${schedules.length} escalas de amanhã`);

            for (const schedule of schedules) {
                for (const member of schedule.members) {
                    try {
                        // Email
                        await EmailService.sendScheduleReminder(schedule, member.user);

                        // WhatsApp
                        if (WhatsAppService.isConnected() && member.user.phone) {
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

        } catch (error) {
            logger.error('Erro ao enviar lembretes de escalas:', error);
        }
    }

    /**
     * ============================================================================
     * NOTIFICAÇÕES CUSTOMIZADAS
     * ============================================================================
     */

    static async sendCustomNotification(schedule, type, message) {
        const members = schedule.members.map(m => m.user);
        
        logger.info(`Enviando notificação customizada para ${members.length} membros`, {
            scheduleId: schedule.id,
            type: type,
            membersData: members.map(m => ({
                id: m.id,
                name: m.name,
                phone: m.phone,
                email: m.email
            }))
        });

        for (const member of members) {
            try {
                logger.info(`Processando membro: ${member.name} (ID: ${member.id})`);
                
                if (type === 'EMAIL' || type === 'BOTH') {
                    await EmailService.sendEmail(
                        member.email,
                        `Comunicado: ${schedule.title}`,
                        `<h2>Comunicado</h2><p>Olá, ${member.name}!</p><p>${message}</p>`,
                        message
                    );
                }

                if ((type === 'WHATSAPP' || type === 'BOTH') && WhatsAppService.isConnected()) {
                    if (!member.phone) {
                        logger.warn(`Membro ${member.name} não tem telefone cadastrado`);
                        continue;
                    }
                    
                    const whatsappMessage = `*Comunicado - ${schedule.title}*\n\nOlá, ${member.name}!\n\n${message}`;
                    logger.info(`Enviando WhatsApp para ${member.name} no número: ${member.phone}`);
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
                
                await this.logNotification({
                    userId: member.id,
                    scheduleId: schedule.id,
                    type: 'CUSTOM_NOTIFICATION',
                    channel: type,
                    status: 'FAILED',
                    message,
                    error: error.message
                });
            }
        }
    }

    /**
     * ============================================================================
     * MÉTODOS DE EMAIL PARA ESCALAS
     * ============================================================================
     */

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
                        ${schedule.description ? `<p><strong>Descrição:</strong> ${schedule.description}</p>` : ''}
                        <p><strong>Data:</strong> ${scheduleDate}</p>
                        <p><strong>Horário:</strong> ${schedule.time}</p>
                        <p><strong>Local:</strong> ${schedule.location}</p>
                        ${user.functions && user.functions.length > 0 ? `<p><strong>Função:</strong> ${user.functions.join(', ')}</p>` : ''}
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
                        ${schedule.description ? `<p><strong>Descrição:</strong> ${schedule.description}</p>` : ''}
                        <p><strong>Data:</strong> ${scheduleDate}</p>
                        <p><strong>Horário:</strong> ${schedule.time}</p>
                        <p><strong>Local:</strong> ${schedule.location}</p>
                        ${user.functions && user.functions.length > 0 ? `<p><strong>Função:</strong> ${user.functions.join(', ')}</p>` : ''}
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
                        ${user.functions && user.functions.length > 0 ? `<p><strong>Função:</strong> ${user.functions.join(', ')}</p>` : ''}
                    </div>
                    <p>Você não precisa mais comparecer a este serviço.</p>
                `;
                break;
        }

        await EmailService.sendEmail(user.email, subject, html);
    }

    /**
     * ============================================================================
     * MÉTODOS DE WHATSAPP
     * ============================================================================
     */

    static async sendScheduleWhatsApp(schedule, user, type) {
        logger.info(`🚀📱 INICIANDO sendScheduleWhatsApp:`, {
            schedule: schedule.title,
            user: user.name,
            phone: user.phone,
            type: type
        });
        
        const scheduleDate = new Date(schedule.date).toLocaleDateString('pt-BR');

        let message;

        switch (type) {
            case 'assignment':
                message = `*🎯 Nova Escala*\n\nOlá, ${user.name}!\n\nVocê foi escalado para:\n\n*${schedule.title}*`;
                
                // Adicionar descrição se existir
                if (schedule.description && schedule.description.trim()) {
                    message += `\n\n${schedule.description}`;
                }
                
                message += `\n\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n📍 Local: ${schedule.location}`;
                
                // Adicionar função se existir
                if (user.functions && user.functions.length > 0) {
                    message += `\n⚙️ Função: ${user.functions.join(', ')}`;
                }
                
                message += `\n\nContamos com sua presença! 🙏`;
                break;

            case 'update':
                message = `*📝 Escala Atualizada*\n\nOlá, ${user.name}!\n\nSua escala foi atualizada:\n\n*${schedule.title}*`;
                
                // Adicionar descrição se existir
                if (schedule.description && schedule.description.trim()) {
                    message += `\n\n${schedule.description}`;
                }
                
                message += `\n\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n📍 Local: ${schedule.location}`;
                
                // Adicionar função se existir
                if (user.functions && user.functions.length > 0) {
                    message += `\n⚙️ Função: ${user.functions.join(', ')}`;
                }
                
                message += `\n\nVerifique as informações! ✅`;
                break;

            case 'cancellation':
                message = `*❌ Escala Cancelada*\n\nOlá, ${user.name}!\n\nA seguinte escala foi cancelada:\n\n*${schedule.title}*\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}`;
                
                // Adicionar função se existir
                if (user.functions && user.functions.length > 0) {
                    message += `\n⚙️ Função: ${user.functions.join(', ')}`;
                }
                
                message += `\n\nVocê não precisa mais comparecer.`;
                break;
        }

        logger.info(`🚀 CHAMANDO WhatsAppService.sendMessage:`, {
            destinatario: user.name,
            telefone: user.phone,
            mensagem: message.substring(0, 50) + '...'
        });
        
        await WhatsAppService.sendMessage(user.phone, message);
    }

    static createReminderWhatsAppMessage(schedule, user) {
        const scheduleDate = new Date(schedule.date).toLocaleDateString('pt-BR');

        return `*🔔 Lembrete de Serviço*\n\nOlá, ${user.name}!\n\nLembrete: você tem um serviço AMANHÃ:\n\n*${schedule.title}*\n📅 Data: ${scheduleDate}\n⏰ Horário: ${schedule.time}\n📍 Local: ${schedule.location}\n\nNão esqueça! Deus abençoe! 🙏`;
    }

    // NOVOS MÉTODOS PARA APROVAÇÃO/REJEIÇÃO DE MEMBROS
    static createMemberApprovalWhatsAppMessage(user) {
        return `*🎉 Parabéns, ${user.name}!*\n\nSeu cadastro foi aprovado! ✅\n\nAgora você pode acessar o sistema de membros da igreja e:\n\n📅 Ver suas escalas\n⏰ Definir indisponibilidade\n📱 Receber notificações\n\nAcesse usando seu email e senha.\n\nQue Deus abençoe seu ministério! 🙏`;
    }

    static createMemberRejectionWhatsAppMessage(user, reason) {
        let message = `Olá, ${user.name}\n\nInfelizmente não foi possível aprovar seu cadastro no sistema de membros.`;
        
        if (reason && reason.trim()) {
            message += `\n\n*Motivo:* ${reason}`;
        }
        
        message += '\n\nPara mais informações, entre em contato com a administração da igreja.\n\nDeus abençoe! 🙏';
        
        return message;
    }

    /**
     * ============================================================================
     * REGISTRO DE NOTIFICAÇÕES
     * ============================================================================
     */

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
            logger.error('Erro ao registrar notificação no banco:', error);
        }
    }

    /**
     * ============================================================================
     * MÉTODOS UTILITÁRIOS
     * ============================================================================
     */

    static async getNotificationsByUser(userId, limit = 50) {
        try {
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { sentAt: 'desc' },
                take: limit,
                include: {
                    schedule: {
                        select: {
                            id: true,
                            title: true,
                            date: true,
                            time: true
                        }
                    }
                }
            });

            return notifications;
        } catch (error) {
            logger.error('Erro ao buscar notificações do usuário:', error);
            return [];
        }
    }

    static async markNotificationAsRead(notificationId, userId) {
        try {
            await prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId: userId
                },
                data: {
                    status: 'READ'
                }
            });
        } catch (error) {
            logger.error('Erro ao marcar notificação como lida:', error);
        }
    }

    /**
     * ============================================================================
     * TESTES E VERIFICAÇÕES
     * ============================================================================
     */

    static async testNotificationServices() {
        const testResults = {
            email: false,
            whatsapp: false,
            database: false
        };

        try {
            // Testar conexão com email
            if (EmailService.isEmailConfigured()) {
                testResults.email = true;
                logger.info('✅ Email Service: Configurado');
            } else {
                logger.warn('⚠️ Email Service: Não configurado');
            }

            // Testar conexão com WhatsApp
            if (WhatsAppService.isConnected()) {
                testResults.whatsapp = true;
                logger.info('✅ WhatsApp Service: Conectado');
            } else {
                logger.warn('⚠️ WhatsApp Service: Não conectado');
            }

            // Testar conexão com banco de dados
            const testQuery = await prisma.notification.count();
            testResults.database = true;
            logger.info('✅ Database: Conectado', { notificationCount: testQuery });

        } catch (error) {
            logger.error('❌ Erro ao testar serviços de notificação:', error);
        }

        return testResults;
    }
}

module.exports = NotificationService;