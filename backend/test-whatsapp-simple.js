const WhatsAppService = require('./src/services/WhatsAppService');

async function testWhatsApp() {
    console.log('=== TESTE SIMPLES DO WHATSAPP ===\n');
    
    if (!WhatsAppService.isConnected()) {
        console.log('❌ WhatsApp não está conectado');
        return;
    }
    
    try {
        // Obter informações do usuário logado
        const info = await WhatsAppService.client.info;
        console.log('📱 Meu número:', info.wid._serialized);
        console.log('👤 Meu nome:', info.pushname);
        
        // Testar formatação com números diferentes
        const testNumbers = [
            '11987654321',
            '21987654321', 
            '85988776655'
        ];
        
        console.log('\n📋 Teste de formatação:');
        testNumbers.forEach(num => {
            const formatted = WhatsAppService.formatPhoneNumber(num);
            console.log(`${num} -> ${formatted}`);
            
            if (formatted === info.wid._serialized) {
                console.log(`⚠️  ATENÇÃO: ${num} é o mesmo número logado!`);
            }
        });
        
        // Listar contatos (primeiros 5)
        console.log('\n👥 Primeiros contatos:');
        try {
            const contacts = await WhatsAppService.client.getContacts();
            contacts.slice(0, 5).forEach(contact => {
                console.log(`   ${contact.name || contact.pushname}: ${contact.id._serialized}`);
            });
        } catch (error) {
            console.log('Erro ao obter contatos:', error.message);
        }
        
    } catch (error) {
        console.error('Erro:', error);
    }
}

testWhatsApp();