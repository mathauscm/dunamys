// Cole este código no final do seu server.js temporariamente para debug

app.get('/debug/notification-services', async (req, res) => {
    try {
        const WhatsAppService = require('./src/services/WhatsAppService');
        const NotificationService = require('./src/services/NotificationService');
        
        const debug = {
            whatsapp: {
                connected: WhatsAppService.isConnected(),
                status: WhatsAppService.getConnectionStatus(),
                hasClient: !!WhatsAppService.client
            },
            timestamp: new Date().toISOString()
        };
        
        // Teste dos serviços
        try {
            debug.serviceTests = await NotificationService.testNotificationServices();
        } catch (error) {
            debug.serviceTestError = error.message;
        }
        
        res.json(debug);
    } catch (error) {
        res.status(500).json({ 
            error: 'Erro no debug', 
            message: error.message 
        });
    }
});

app.post('/debug/test-notification/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const AdminService = require('./src/services/AdminService');
        
        console.log(`🧪 Testando notificação para escala ${scheduleId}...`);
        
        // Buscar a escala
        const { prisma } = require('./src/config/database');
        const schedule = await prisma.schedule.findUnique({
            where: { id: parseInt(scheduleId) },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, name: true, phone: true, email: true } }
                    }
                }
            }
        });
        
        if (!schedule) {
            return res.status(404).json({ error: 'Escala não encontrada' });
        }
        
        console.log(`📋 Escala encontrada: ${schedule.title}`);
        console.log(`👥 Membros: ${schedule.members.length}`);
        
        // Tentar enviar notificação
        const NotificationService = require('./src/services/NotificationService');
        await NotificationService.sendScheduleAssignment(schedule);
        
        res.json({ 
            success: true, 
            message: 'Teste concluído - verifique os logs',
            schedule: {
                id: schedule.id,
                title: schedule.title,
                membersCount: schedule.members.length
            }
        });
        
    } catch (error) {
        console.error('Erro no teste:', error);
        res.status(500).json({ 
            error: 'Erro no teste', 
            message: error.message 
        });
    }
});