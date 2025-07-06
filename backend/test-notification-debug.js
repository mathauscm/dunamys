const WhatsAppService = require('./src/services/WhatsAppService');
const EmailService = require('./src/services/EmailService');
const NotificationService = require('./src/services/NotificationService');

async function debugNotificationServices() {
    console.log('=== DEBUG DOS SERVIÇOS DE NOTIFICAÇÃO ===\n');
    
    // 1. Status do WhatsApp
    console.log('📱 WHATSAPP SERVICE:');
    console.log(`   Conectado: ${WhatsAppService.isConnected()}`);
    console.log(`   Status: ${WhatsAppService.getConnectionStatus()}`);
    
    if (WhatsAppService.isConnected()) {
        try {
            const myInfo = await WhatsAppService.client.info;
            console.log(`   Meu número: ${myInfo.wid._serialized}`);
        } catch (error) {
            console.log(`   Erro ao obter info: ${error.message}`);
        }
    }
    
    // 2. Status do Email
    console.log('\n📧 EMAIL SERVICE:');
    try {
        const emailConfigured = EmailService.isEmailConfigured ? EmailService.isEmailConfigured() : false;
        console.log(`   Configurado: ${emailConfigured}`);
    } catch (error) {
        console.log(`   Erro ao verificar: ${error.message}`);
    }
    
    // 3. Teste dos serviços
    console.log('\n🧪 TESTE DOS SERVIÇOS:');
    try {
        const testResults = await NotificationService.testNotificationServices();
        console.log('   Resultados:', testResults);
    } catch (error) {
        console.log(`   Erro no teste: ${error.message}`);
    }
    
    console.log('\n=== FIM DO DEBUG ===');
}

// Executar debug
debugNotificationServices().catch(console.error);