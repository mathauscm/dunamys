const WhatsAppService = require('./src/services/WhatsAppService');
const EmailService = require('./src/services/EmailService');

async function testNotificationDirect() {
    console.log('=== TESTE DIRETO DE NOTIFICAÇÃO ===\n');
    
    // 1. Status dos serviços
    console.log('📱 WhatsApp conectado:', WhatsAppService.isConnected());
    console.log('📧 Email configurado:', EmailService.isEmailConfigured());
    
    if (!WhatsAppService.isConnected()) {
        console.log('❌ WhatsApp não conectado - não é possível testar');
        return;
    }
    
    try {
        // 2. Obter informações do WhatsApp
        const info = await WhatsAppService.client.info;
        console.log('👤 Número logado:', info.wid._serialized);
        console.log('👤 Nome:', info.pushname);
        
        // 3. Teste com número diferente
        const testNumber = '11999999999'; // Número fictício para teste
        const testMessage = '🧪 Esta é uma mensagem de teste do sistema de escalas. Pode ignorar.';
        
        console.log(`\n📤 Testando envio para: ${testNumber}`);
        
        const formatted = WhatsAppService.formatPhoneNumber(testNumber);
        console.log(`🔧 Número formatado: ${formatted}`);
        
        if (formatted === info.wid._serialized) {
            console.log('⚠️ PROBLEMA: O número de teste é igual ao número logado!');
        } else {
            console.log('✅ Números são diferentes, teste válido');
        }
        
        // 4. Verificar se número existe
        console.log(`🔍 Verificando se ${formatted} está registrado...`);
        const isRegistered = await WhatsAppService.client.isRegisteredUser(formatted);
        console.log(`📱 Número registrado: ${isRegistered}`);
        
        if (isRegistered) {
            console.log('🚀 Tentando enviar mensagem...');
            await WhatsAppService.sendMessage(testNumber, testMessage);
            console.log('✅ Mensagem enviada com sucesso!');
        } else {
            console.log('❌ Número não registrado - não é possível enviar');
        }
        
    } catch (error) {
        console.error('💥 Erro no teste:', error.message);
    }
}

testNotificationDirect();