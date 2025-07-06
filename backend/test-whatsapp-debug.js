const WhatsAppService = require('./src/services/WhatsAppService');
const logger = require('./src/utils/logger');

// Função para testar formatação de números
function testPhoneFormatting() {
    console.log('=== TESTE DE FORMATAÇÃO DE NÚMEROS ===');
    
    const testNumbers = [
        '11987654321',
        '(11) 98765-4321',
        '11 98765-4321',
        '+55 11 98765-4321',
        '5511987654321',
        '987654321',
        '(11) 9876-5432'
    ];
    
    testNumbers.forEach(number => {
        const formatted = WhatsAppService.formatPhoneNumber(number);
        console.log(`Original: ${number} -> Formatado: ${formatted}`);
    });
}

// Função para testar envio de mensagem com logs detalhados
async function testMessageSending() {
    console.log('\n=== TESTE DE ENVIO DE MENSAGEM ===');
    
    if (!WhatsAppService.isConnected()) {
        console.log('❌ WhatsApp não conectado');
        return;
    }
    
    const testPhone = '11987654321'; // Substitua por um número real para teste
    const testMessage = 'Teste de mensagem - ignorar';
    
    try {
        console.log(`📱 Enviando mensagem para: ${testPhone}`);
        console.log(`📝 Mensagem: ${testMessage}`);
        
        const formatted = WhatsAppService.formatPhoneNumber(testPhone);
        console.log(`🔧 Número formatado: ${formatted}`);
        
        await WhatsAppService.sendMessage(testPhone, testMessage);
        console.log('✅ Mensagem enviada com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error);
    }
}

// Executar testes
testPhoneFormatting();

// Se quiser testar o envio real (descomente a linha abaixo)
// testMessageSending();