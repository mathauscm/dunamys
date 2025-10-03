const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// WhatsApp Client
let client = null;
let isReady = false;
let qrCode = null;

// Inicializar WhatsApp
async function initializeWhatsApp() {
    try {
        console.log('🔄 Inicializando WhatsApp Service...');

        client = new Client({
            authStrategy: new LocalAuth({
                dataPath: '/app/whatsapp-session'
            }),
            puppeteer: {
                headless: true,
                executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-gpu',
                    '--disable-extensions',
                    '--disable-dev-shm-usage',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor',
                    '--disable-background-timer-throttling',
                    '--disable-backgrounding-occluded-windows',
                    '--disable-renderer-backgrounding'
                ]
            }
        });

        client.on('qr', (qr) => {
            console.log('\n📱 QR Code recebido - Escaneie para conectar\n');

            // Exibir QR Code no terminal (igual ao zolpia)
            qrcode.toString(qr, {
                type: 'terminal',
                small: true,
                width: 40
            }, (err, qrString) => {
                if (!err) {
                    console.log(qrString);
                    console.log('👆 Escaneie o QR Code acima com seu WhatsApp\n');
                } else {
                    console.error('❌ Erro ao gerar QR Code no terminal:', err);
                }
            });

            // Salvar em base64 para uso web (se precisar depois)
            qrcode.toDataURL(qr, (err, url) => {
                if (!err) {
                    qrCode = url;
                    console.log('✅ QR Code também salvo em base64');
                }
            });
        });

        client.on('loading_screen', (percent, message) => {
            console.log(`⏳ WhatsApp loading: ${percent}% - ${message}`);
        });

        client.on('authenticated', () => {
            console.log('🔐 WhatsApp Web autenticado com sucesso');
        });

        client.on('ready', () => {
            console.log('🎉 WhatsApp Web conectado e pronto para uso');
            console.log('📱 Aguardando 10 segundos para garantir que o chat store carregue...');

            // Aguardar 10 segundos antes de marcar como pronto
            setTimeout(() => {
                isReady = true;
                qrCode = null;
                console.log('✅ WhatsApp totalmente pronto para enviar mensagens!');
            }, 10000);
        });

        client.on('auth_failure', (msg) => {
            console.error('❌ Falha na autenticação WhatsApp:', msg);
        });

        client.on('disconnected', (reason) => {
            console.warn('⚠️ WhatsApp Web desconectado:', reason);
            isReady = false;
        });

        await client.initialize();
    } catch (error) {
        console.error('❌ Erro ao inicializar WhatsApp:', error);
        throw error;
    }
}

// Formatar número de telefone
function formatPhoneNumber(phone) {
    if (!phone) {
        throw new Error('Número de telefone é obrigatório');
    }

    let cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.startsWith('55')) {
        cleanPhone = cleanPhone.substring(2);
    }

    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        throw new Error(`Número inválido: ${cleanPhone}`);
    }

    if (cleanPhone.length === 10) {
        const areaCode = cleanPhone.substring(0, 2);
        const number = cleanPhone.substring(2);
        cleanPhone = `${areaCode}9${number}`;
    }

    return cleanPhone;
}

// Obter formato alternativo (com/sem 9º dígito)
function getAlternativeFormat(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    let alternative = cleanPhone;

    if (cleanPhone.startsWith('55')) {
        alternative = cleanPhone.substring(2);
    }

    if (alternative.length === 11) {
        // Remover 9º dígito
        const areaCode = alternative.substring(0, 2);
        const number = alternative.substring(3);
        alternative = `${areaCode}${number}`;
    } else if (alternative.length === 10) {
        // Adicionar 9º dígito
        const areaCode = alternative.substring(0, 2);
        const number = alternative.substring(2);
        alternative = `${areaCode}9${number}`;
    }

    return `55${alternative}@c.us`;
}

// ==================== ROTAS ====================

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        whatsapp: isReady ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// Obter status
app.get('/status', (req, res) => {
    res.json({
        connected: isReady,
        hasQR: qrCode !== null,
        timestamp: new Date().toISOString()
    });
});

// Obter QR Code
app.get('/qr', (req, res) => {
    if (qrCode) {
        res.json({ qrCode });
    } else if (isReady) {
        res.json({ message: 'WhatsApp já está conectado', connected: true });
    } else {
        res.status(404).json({ error: 'QR Code não disponível' });
    }
});

// Enviar mensagem (LÓGICA MELHORADA DA VERSÃO LEGADA)
app.post('/send', async (req, res) => {
    const { phone, message } = req.body;

    console.log('\n🔵 ============ NOVA REQUISIÇÃO DE ENVIO ============');
    console.log('📋 Dados recebidos:', { phone, messageLength: message?.length });

    try {
        if (!phone || !message) {
            console.error('❌ Erro: Phone ou message faltando');
            return res.status(400).json({ error: 'Phone e message são obrigatórios' });
        }

        if (!isReady) {
            console.error('❌ Erro: WhatsApp não está pronto (isReady = false)');
            return res.status(503).json({ error: 'WhatsApp não está conectado ou ainda carregando' });
        }

        console.log('✅ WhatsApp está pronto!');
        console.log(`🚀 Iniciando envio para: ${phone}`);

        // ESTRATÉGIA 1: Tentar com formato original
        const originalFormatted = `55${formatPhoneNumber(phone)}@c.us`;
        console.log(`📱 Formato original: ${originalFormatted}`);

        const isRegistered = await client.isRegisteredUser(originalFormatted);
        console.log(`✅ Formato original registrado: ${isRegistered}`);

        if (!isRegistered) {
            // ESTRATÉGIA 2: Tentar formato alternativo (com/sem 9º dígito)
            const alternativeNumber = getAlternativeFormat(phone);
            console.log(`🔄 Testando formato alternativo: ${alternativeNumber}`);

            const altRegistered = await client.isRegisteredUser(alternativeNumber);
            console.log(`✅ Formato alternativo registrado: ${altRegistered}`);

            if (altRegistered) {
                console.log(`📤 Usando formato alternativo para enviar...`);
                const result = await client.sendMessage(alternativeNumber, message);

                console.log(`✅✅✅ Mensagem ENVIADA COM SUCESSO (formato alternativo)`);
                console.log('📬 ID da mensagem:', result.id._serialized);
                console.log('🔵 ============ FIM DA REQUISIÇÃO ============\n');

                return res.json({
                    success: true,
                    messageId: result.id._serialized,
                    phone: phone,
                    formattedPhone: alternativeNumber
                });
            } else {
                console.warn(`❌ Número ${phone} não encontrado (testados: ${originalFormatted}, ${alternativeNumber})`);
                return res.status(404).json({
                    error: `Número ${phone} não está registrado no WhatsApp`,
                    testedFormats: [originalFormatted, alternativeNumber]
                });
            }
        }

        // ESTRATÉGIA 3: Usar getNumberId para garantir ID correto (evita erro de chat não encontrado)
        const cleanPhone = phone.replace(/\D/g, '');
        const phoneForNumberId = `55${cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone}`;

        console.log(`🔍 Usando getNumberId para: ${phoneForNumberId}`);
        const numberId = await client.getNumberId(phoneForNumberId);

        if (numberId) {
            console.log(`✅ NumberId encontrado: ${numberId._serialized}`);
            console.log(`📤 Enviando usando NumberId (método mais confiável)...`);

            const result = await client.sendMessage(numberId._serialized, message);

            console.log(`✅✅✅ Mensagem ENVIADA COM SUCESSO via NumberId`);
            console.log('📬 ID da mensagem:', result.id._serialized);
            console.log('🔵 ============ FIM DA REQUISIÇÃO ============\n');

            return res.json({
                success: true,
                messageId: result.id._serialized,
                phone: phone,
                formattedPhone: numberId._serialized
            });
        }

        // ESTRATÉGIA 4: Tentar com formato original mesmo assim (último recurso)
        console.log(`📤 Tentando enviar com formato original (último recurso)...`);
        const result = await client.sendMessage(originalFormatted, message);

        console.log(`✅✅✅ Mensagem ENVIADA COM SUCESSO`);
        console.log('📬 ID da mensagem:', result.id._serialized);
        console.log('🔵 ============ FIM DA REQUISIÇÃO ============\n');

        res.json({
            success: true,
            messageId: result.id._serialized,
            phone: phone,
            formattedPhone: originalFormatted
        });

    } catch (error) {
        console.error(`\n❌❌❌ ERRO CRÍTICO ao enviar mensagem para ${phone}:`);
        console.error('Tipo do erro:', error.name);
        console.error('Mensagem:', error.message);
        console.error('Stack:', error.stack);
        console.error('🔵 ============ FIM DA REQUISIÇÃO COM ERRO ============\n');

        res.status(500).json({
            error: 'Erro ao enviar mensagem',
            message: error.message,
            type: error.name
        });
    }
});

// Desconectar
app.post('/disconnect', async (req, res) => {
    try {
        if (client) {
            await client.destroy();
            client = null;
            isReady = false;
            qrCode = null;
            console.log('✅ WhatsApp desconectado');
        }
        res.json({ message: 'WhatsApp desconectado com sucesso' });
    } catch (error) {
        console.error('❌ Erro ao desconectar:', error);
        res.status(500).json({ error: 'Erro ao desconectar WhatsApp' });
    }
});

// Reconectar
app.post('/reconnect', async (req, res) => {
    try {
        console.log('🔄 Reconectando WhatsApp...');

        if (client) {
            await client.destroy();
        }

        await initializeWhatsApp();

        res.json({ message: 'Reconexão iniciada' });
    } catch (error) {
        console.error('❌ Erro ao reconectar:', error);
        res.status(500).json({ error: 'Erro ao reconectar WhatsApp' });
    }
});

// ==================== INICIALIZAÇÃO ====================

async function startServer() {
    try {
        // Inicializar WhatsApp
        await initializeWhatsApp();

        // Iniciar servidor
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 WhatsApp Microservice rodando na porta ${PORT}`);
            console.log(`📖 Health check: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();
