const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../utils/logger');

// Detectar se estamos em ambiente de desenvolvimento sem dependências do sistema
const isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.WHATSAPP_DEV_MODE === 'true';

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
    }

    async initialize() {
        try {
            console.log('🔄 Inicializando WhatsApp Service...');
            
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './whatsapp-session'
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

            this.client.on('qr', (qr) => {
                console.log('📱 QR Code recebido, escaneie para conectar');
                logger.info('QR Code recebido, escaneie para conectar');
                qrcode.toDataURL(qr, (err, url) => {
                    if (!err) {
                        this.qrCode = url;
                        console.log('✅ QR Code convertido para base64 com sucesso');
                        logger.info('QR Code convertido para base64 com sucesso');
                    } else {
                        console.error('❌ Erro ao converter QR Code:', err);
                        logger.error('Erro ao converter QR Code:', err);
                    }
                });
            });

            this.client.on('loading_screen', (percent, message) => {
                console.log(`⏳ WhatsApp loading: ${percent}% - ${message}`);
                logger.info(`WhatsApp loading: ${percent}% - ${message}`);
            });

            this.client.on('authenticated', () => {
                console.log('🔐 WhatsApp Web autenticado com sucesso');
                logger.info('WhatsApp Web autenticado com sucesso');
            });

            this.client.on('ready', () => {
                console.log('🎉 WhatsApp Web conectado e pronto para uso');
                logger.info('WhatsApp Web conectado e pronto para uso');
                this.isReady = true;
                this.qrCode = null;
            });

            this.client.on('auth_failure', (msg) => {
                console.error('❌ Falha na autenticação WhatsApp:', msg);
                logger.error('Falha na autenticação WhatsApp:', msg);
            });

            this.client.on('disconnected', (reason) => {
                console.warn('⚠️ WhatsApp Web desconectado:', reason);
                logger.warn('WhatsApp Web desconectado:', reason);
                this.isReady = false;
            });

            console.log('🚀 Inicializando cliente WhatsApp...');
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Erro ao inicializar WhatsApp:', error);
            logger.error('Erro ao inicializar WhatsApp:', error);
            throw error;
        }
    }

    async sendMessage(phone, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phone);
            
            // MÉTODO 1: Verificar se o número está registrado
            console.log(`🔍 Verificando registro do número: ${formattedPhone}`);
            const isRegistered = await this.client.isRegisteredUser(formattedPhone);
            
            if (!isRegistered) {
                throw new Error(`Número ${phone} não está registrado no WhatsApp`);
            }
            
            // MÉTODO 2: Tentar obter o chat pelo número
            let chatId;
            try {
                const chat = await this.client.getChatById(formattedPhone);
                chatId = chat.id._serialized;
                console.log(`💬 Chat encontrado: ${chatId}`);
            } catch (error) {
                // Se não encontrar o chat, usar o número formatado mesmo
                chatId = formattedPhone;
                console.log(`💬 Chat não encontrado, usando número formatado: ${chatId}`);
            }
            
            // MÉTODO 3: Enviar mensagem
            console.log(`📤 Enviando mensagem para: ${chatId}`);
            const result = await this.client.sendMessage(chatId, message);
            
            console.log(`✅ Mensagem enviada com sucesso!`, {
                to: phone,
                chatId: chatId,
                messageId: result.id._serialized
            });
            
            return result;
            
        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        if (!phone) {
            throw new Error('Número de telefone é obrigatório');
        }
        
        // Limpar o número - remover tudo que não é dígito
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Remover código do país 55 se já existir
        if (cleanPhone.startsWith('55')) {
            cleanPhone = cleanPhone.substring(2);
        }
        
        // Validar se é um número brasileiro válido
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            throw new Error(`Número inválido: ${cleanPhone} (deve ter 10 ou 11 dígitos)`);
        }
        
        // Se tem 11 dígitos, já está no formato correto (DDD + 9 + número)
        // Se tem 10 dígitos, adicionar o 9º dígito
        if (cleanPhone.length === 10) {
            const areaCode = cleanPhone.substring(0, 2);
            const number = cleanPhone.substring(2);
            cleanPhone = `${areaCode}9${number}`;
        }
        
        // Formato final para whatsapp-web.js: 55 + DDD + 9 + número + @c.us
        const finalNumber = `55${cleanPhone}@c.us`;
        
        console.log(`📱 Formatação: ${phone} -> ${finalNumber}`);
        return finalNumber;
    }

    async sendMessageAlternative(phone, message) {
        try {
            // Limpar número
            let cleanPhone = phone.replace(/\D/g, '');
            
            if (cleanPhone.startsWith('55')) {
                cleanPhone = cleanPhone.substring(2);
            }
            
            // Adicionar 9 se necessário
            if (cleanPhone.length === 10) {
                const areaCode = cleanPhone.substring(0, 2);
                const number = cleanPhone.substring(2);
                cleanPhone = `${areaCode}9${number}`;
            }
            
            // Usar getNumberId para obter o ID correto
            const numberId = await this.client.getNumberId(`55${cleanPhone}`);
            
            if (!numberId) {
                throw new Error(`Número ${phone} não foi encontrado no WhatsApp`);
            }
            
            console.log(`📱 NumberId encontrado: ${numberId._serialized}`);
            
            // Enviar usando o ID correto
            const result = await this.client.sendMessage(numberId._serialized, message);
            
            console.log(`✅ Mensagem enviada via NumberId!`);
            return result;
            
        } catch (error) {
            console.error(`❌ Erro no método alternativo:`, error);
            throw error;
        }
    }

    async debugPhoneNumber(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        
        console.log(`🔍 DEBUG do número: ${phone}`);
        console.log(`   Limpo: ${cleanPhone}`);
        
        // Testar diferentes formatos
        const formats = [
            `55${cleanPhone}@c.us`,
            `${cleanPhone}@c.us`,
            `55${cleanPhone.substring(2)}@c.us` // Remove 55 se já tiver
        ];
        
        for (const format of formats) {
            try {
                const isRegistered = await this.client.isRegisteredUser(format);
                console.log(`   ${format} -> Registrado: ${isRegistered}`);
                
                if (isRegistered) {
                    try {
                        const chat = await this.client.getChatById(format);
                        console.log(`   ${format} -> Chat existe: ${chat.name || 'Sem nome'}`);
                    } catch (chatError) {
                        console.log(`   ${format} -> Chat não encontrado`);
                    }
                }
            } catch (error) {
                console.log(`   ${format} -> Erro: ${error.message}`);
            }
        }
        
        // Testar getNumberId
        try {
            const numberId = await this.client.getNumberId(`55${cleanPhone}`);
            console.log(`   getNumberId: ${numberId ? numberId._serialized : 'null'}`);
        } catch (error) {
            console.log(`   getNumberId erro: ${error.message}`);
        }
    }

    getQRCode() {
        return this.qrCode;
    }

    isConnected() {
        return this.isReady;
    }

    getConnectionStatus() {
        if (this.isReady) {
            return 'connected';
        } else if (this.qrCode) {
            return 'awaiting_qr';
        } else {
            return 'disconnected';
        }
    }

    async disconnect() {
        try {
            if (this.client) {
                await this.client.destroy();
                this.client = null;
                logger.info('WhatsApp Web desconectado');
            }
        } catch (error) {
            console.error('❌ Erro ao desconectar WhatsApp:', error);
            logger.error('Erro ao desconectar WhatsApp:', error);
            // Forçar reset do client mesmo com erro
            this.client = null;
        } finally {
            // Sempre resetar o estado
            this.isReady = false;
            this.qrCode = null;
        }
    }

    async reconnect() {
        try {
            console.log('🔄 Iniciando processo de reconexão...');
            logger.info('Iniciando processo de reconexão WhatsApp');
            
            await this.disconnect();
            console.log('✅ Desconexão concluída');
            
            await this.initialize();
            console.log('✅ Reconexão concluída');
            logger.info('Reconexão WhatsApp concluída com sucesso');
        } catch (error) {
            console.error('❌ Erro durante reconexão:', error);
            logger.error('Erro durante reconexão WhatsApp:', error);
            throw error;
        }
    }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;