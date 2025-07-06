const { Client, LocalAuth } = require('whatsapp-web.js');

async function testWhatsApp() {
    console.log('🔄 Testando inicialização do WhatsApp...');
    
    try {
        const client = new Client({
            authStrategy: new LocalAuth({
                dataPath: './whatsapp-session-test'
            }),
            puppeteer: {
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            }
        });

        console.log('✅ Cliente WhatsApp criado com sucesso');
        
        // Testar inicialização
        await client.initialize();
        console.log('✅ WhatsApp inicializado com sucesso');
        
        // Destruir cliente
        await client.destroy();
        console.log('✅ Cliente destruído com sucesso');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
        console.error('Stack:', error.stack);
    }
}

testWhatsApp();