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
            
            // Obter informações do usuário logado para debug
            let myNumber = 'unknown';
            try {
                const info = await this.client.info;
                myNumber = info.wid._serialized;
            } catch (infoError) {
                logger.warn('Não foi possível obter número do usuário logado:', infoError.message);
            }
            
            // Log detalhado para debug
            logger.info(`WhatsApp Debug - Enviando mensagem:`, {
                originalPhone: phone,
                formattedPhone: formattedPhone,
                myNumber: myNumber,
                messagePreview: message.substring(0, 100) + '...'
            });
            
            // Verificar se é o mesmo número
            if (formattedPhone === myNumber) {
                logger.error(`❌ ERRO: Tentativa de enviar mensagem para si mesmo!`);
                logger.error(`   Número formatado: ${formattedPhone}`);
                logger.error(`   Meu número: ${myNumber}`);
                throw new Error(`Não é possível enviar mensagem para si mesmo. Verifique o número do destinatário.`);
            }
            
            // Verificar se o número está registrado no WhatsApp
            logger.info(`🔍 Verificando se ${formattedPhone} está registrado no WhatsApp...`);
            const isRegistered = await this.client.isRegisteredUser(formattedPhone);
            
            if (!isRegistered) {
                logger.error(`❌ Número ${formattedPhone} NÃO está registrado no WhatsApp`);
                throw new Error(`Número ${phone} não está registrado no WhatsApp`);
            }
            
            logger.info(`✅ Número ${formattedPhone} está registrado no WhatsApp`);
            
            // Tentar obter o chat
            logger.info(`📱 Obtendo chat para ${formattedPhone}...`);
            const chatId = formattedPhone;
            
            // Enviar mensagem
            logger.info(`📤 Enviando mensagem para ${chatId}...`);
            const result = await this.client.sendMessage(chatId, message);
            
            logger.info(`✅ Mensagem WhatsApp enviada com SUCESSO!`, {
                to: phone,
                formatted: formattedPhone,
                messageId: result.id || 'unknown'
            });
            
            return true;
        } catch (error) {
            logger.error(`💥 Erro ao enviar mensagem WhatsApp para ${phone}:`, error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        if (!phone) {
            throw new Error('Número de telefone é obrigatório');
        }
        
        let cleanPhone = phone.replace(/\D/g, '');
        logger.info(`Formatando número: ${phone} -> ${cleanPhone} (tamanho: ${cleanPhone.length})`);
        
        // Remover código do país se já existir
        if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
            cleanPhone = cleanPhone.substring(2);
            logger.info(`Removendo código 55 existente: ${cleanPhone}`);
        }
        
        // Validar número brasileiro
        if (cleanPhone.length === 10) {
            // Número fixo: XX + 8 dígitos
            const formatted = `55${cleanPhone}@c.us`;
            logger.info(`Número fixo formatado: ${formatted}`);
            return formatted;
        } else if (cleanPhone.length === 11) {
            // Número celular: XX + 9 + 8 dígitos
            const formatted = `55${cleanPhone}@c.us`;
            logger.info(`Número celular formatado: ${formatted}`);
            return formatted;
        } else {
            // Tentar mesmo assim
            const formatted = `55${cleanPhone}@c.us`;
            logger.warn(`Número com tamanho inválido (${cleanPhone.length}): ${formatted}`);
            return formatted;
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