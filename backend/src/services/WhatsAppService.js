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
        console.log('🚨📱 CHAMOU WhatsAppService.sendMessage!!!', phone);
        logger.info('🚨📱 DEBUG: WhatsAppService.sendMessage foi chamado', { phone });
        
        if (!this.isReady) {
            console.log('❌ WhatsApp não está conectado - this.isReady =', this.isReady);
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
            
            // Tentar obter ou criar o chat
            logger.info(`📱 Obtendo/criando chat para ${formattedPhone}...`);
            
            try {
                // Primeiro, tentar obter o chat existente
                const chat = await this.client.getChatById(formattedPhone);
                logger.info(`💬 Chat encontrado: ${chat.name || 'Sem nome'}`);
            } catch (chatError) {
                logger.info(`💬 Chat não encontrado, será criado automaticamente`);
            }
            
            // Verificação de segurança: não enviar para si mesmo (já obtido acima)
            if (formattedPhone === myNumber) {
                throw new Error(`Tentativa bloqueada: não é possível enviar mensagem para si mesmo (${formattedPhone})`);
            }
            
            // Método alternativo: usar o chat diretamente
            logger.info(`📤 Tentativa 1: Enviando via sendMessage para ${formattedPhone}...`);
            
            try {
                const result = await this.client.sendMessage(formattedPhone, message);
                
                logger.info(`✅ Mensagem WhatsApp enviada com SUCESSO via sendMessage!`, {
                    to: phone,
                    formatted: formattedPhone,
                    messageId: result.id?._serialized || result.id || 'unknown',
                    from: result.from || 'unknown',
                    to_result: result.to || 'unknown'
                });
                
                // Verificar se a mensagem foi realmente enviada na direção correta
                if (result.from && result.from !== myNumber) {
                    logger.warn(`⚠️  POSSÍVEL PROBLEMA: Mensagem mostra from=${result.from} mas deveria ser ${myNumber}`);
                }
                
                return true;
                
            } catch (sendError) {
                logger.error(`❌ Falha no sendMessage: ${sendError.message}`);
                
                // Método alternativo: via chat
                logger.info(`📤 Tentativa 2: Enviando via chat...`);
                
                const chat = await this.client.getChatById(formattedPhone);
                const chatResult = await chat.sendMessage(message);
                
                logger.info(`✅ Mensagem enviada com SUCESSO via chat!`, {
                    to: phone,
                    formatted: formattedPhone,
                    messageId: chatResult.id?._serialized || chatResult.id || 'unknown'
                });
                
                return true;
            }
            
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
        console.log(`📱 DEBUG: Formatando número ${phone} -> ${cleanPhone} (${cleanPhone.length} dígitos)`);
        
        // Remover código do país se já existir
        if (cleanPhone.startsWith('55') && cleanPhone.length >= 12) {
            cleanPhone = cleanPhone.substring(2);
            console.log(`🔧 Removendo código 55: ${cleanPhone}`);
        }
        
        // Validar e corrigir números brasileiros
        if (cleanPhone.length === 10) {
            // Pode ser telefone fixo ou celular sem 9º dígito
            // Verificar se o terceiro dígito é 9 ou menor (fixo) ou 6-9 (celular antigo)
            const thirdDigit = cleanPhone.substring(2, 3);
            
            if (thirdDigit >= '6' && thirdDigit <= '9') {
                // Provavelmente celular sem 9º dígito - adicionar
                const areaCode = cleanPhone.substring(0, 2);
                cleanPhone = `${areaCode}9${cleanPhone.substring(2)}`;
                console.log(`🔧 Celular sem 9º dígito - adicionando: ${cleanPhone}`);
            } else {
                // Provavelmente telefone fixo
                console.log(`📞 Telefone fixo detectado: ${cleanPhone}`);
            }
        } else if (cleanPhone.length === 11) {
            // Celular com 11 dígitos - validar se tem o 9º dígito correto
            const areaCode = cleanPhone.substring(0, 2);
            const ninthDigit = cleanPhone.substring(2, 3);
            
            if (ninthDigit !== '9') {
                // Reorganizar: DDD + 9 + restante
                const restOfNumber = cleanPhone.substring(2);
                cleanPhone = `${areaCode}9${restOfNumber}`;
                console.log(`🔧 Corrigindo 9º dígito: ${cleanPhone}`);
            } else {
                console.log(`✅ Celular com 9º dígito correto: ${cleanPhone}`);
            }
        } else {
            console.log(`⚠️ Número com tamanho inválido: ${cleanPhone.length} dígitos`);
        }
        
        // Números brasileiros - SEMPRE adicionar código 55
        const formatted = `55${cleanPhone}@c.us`;
        console.log(`✅ Número formatado final: ${formatted}`);
        
        return formatted;
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