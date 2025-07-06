// Adicione estas rotas temporariamente ao final do seu app.js ou server.js para debug

// ROTA DE TESTE 1: Status dos serviços
app.get('/debug/services', async (req, res) => {
    try {
        const WhatsAppService = require('./src/services/WhatsAppService');
        const EmailService = require('./src/services/EmailService');
        
        const debug = {
            whatsapp: {
                connected: WhatsAppService.isConnected(),
                status: WhatsAppService.getConnectionStatus()
            },
            email: {
                configured: EmailService.isEmailConfigured()
            },
            timestamp: new Date().toISOString()
        };
        
        res.json(debug);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ROTA DE TESTE 2: Testar notificação diretamente
app.post('/debug/test-notification/:scheduleId', async (req, res) => {
    try {
        const { scheduleId } = req.params;
        const AdminScheduleService = require('./src/services/admin/AdminScheduleService');
        
        console.log(`🧪 TESTE DIRETO - Testando notificação para escala ${scheduleId}`);
        
        const result = await AdminScheduleService.sendScheduleNotification(
            parseInt(scheduleId),
            'BOTH',
            'Teste direto de notificação - ignorar',
            1 // ID do admin
        );
        
        res.json({ 
            success: true, 
            message: 'Teste concluído',
            result 
        });
        
    } catch (error) {
        console.error('🔥 Erro no teste direto:', error);
        res.status(500).json({ 
            error: 'Erro no teste', 
            message: error.message,
            stack: error.stack
        });
    }
});