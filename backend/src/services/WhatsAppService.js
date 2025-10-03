const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../utils/logger');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCode = null;
    }

    async initialize() {
        try {
            logger.info('🔄 Inicializando WhatsApp Service...');

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './whatsapp-session'
                }),
                webVersionCache: {
                    type: 'remote',
                    remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
                },
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
                logger.info('📱 QR Code recebido, escaneie para conectar');
                qrcode.toDataURL(qr, (err, url) => {
                    if (!err) {
                        this.qrCode = url;
                        logger.info('✅ QR Code convertido para base64 com sucesso');
                    } else {
                        logger.error('❌ Erro ao converter QR Code:', err);
                    }
                });
            });

            this.client.on('loading_screen', (percent, message) => {
                logger.info(`⏳ WhatsApp loading: ${percent}% - ${message}`);
            });

            this.client.on('authenticated', () => {
                console.log('🔐 WhatsApp Web autenticado com sucesso');
                logger.info('🔐 WhatsApp Web autenticado com sucesso');
                // Fallback: algumas versões não disparam 'ready', marcar como pronto após um tempo
                // Aguardamos 40 segundos para garantir que o chat store carregue completamente
                setTimeout(() => {
                    if (!this.isReady) {
                        console.log('⚠️ Evento ready não disparou após 40s, marcando como pronto manualmente');
                        logger.warn('Evento ready não disparou após 40s, marcando como pronto manualmente');
                        this.isReady = true;
                        this.qrCode = null;
                    }
                }, 40000); // Aumentado para 40 segundos
            });

            this.client.on('ready', () => {
                console.log('🎉🎉🎉 EVENTO READY DISPARADO!');
                logger.info('🎉 WhatsApp Web conectado e pronto para uso');
                this.isReady = true;
                this.qrCode = null;
                console.log('✅ isReady agora é:', this.isReady);
            });

            this.client.on('auth_failure', (msg) => {
                logger.error('❌ Falha na autenticação WhatsApp:', msg);
            });

            this.client.on('disconnected', (reason) => {
                logger.warn('⚠️ WhatsApp Web desconectado:', reason);
                this.isReady = false;
            });

            logger.info('🚀 Inicializando cliente WhatsApp...');
            await this.client.initialize();
        } catch (error) {
            logger.error('❌ Erro ao inicializar WhatsApp:', error);
            throw error;
        }
    }

    async sendMessage(phone, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            console.log(`🚀 INICIANDO envio para: ${phone}`);
            logger.info(`🚀 Enviando mensagem para: ${phone}`);

            // PRIMEIRO: Limpar o número
            const cleanPhone = phone.replace(/\D/g, '');
            let phoneToUse = cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone;

            // Adicionar 9 se necessário (números com 10 dígitos)
            if (phoneToUse.length === 10) {
                const areaCode = phoneToUse.substring(0, 2);
                const number = phoneToUse.substring(2);
                phoneToUse = `${areaCode}9${number}`;
            }

            console.log(`📱 Número processado: ${phoneToUse}`);

            // SEGUNDO: Usar getNumberId para obter o ID correto do WhatsApp
            const numberId = await this.client.getNumberId(`55${phoneToUse}`);

            if (!numberId) {
                logger.error(`Número ${phone} não foi encontrado no WhatsApp`);
                throw new Error(`Número ${phone} não está registrado no WhatsApp.`);
            }

            console.log(`✅ NumberId encontrado: ${numberId._serialized}`);
            logger.info(`NumberId encontrado para ${phone}: ${numberId._serialized}`);

            // TERCEIRO: Tentar enviar com retry (caso chat store não esteja pronto)
            let result;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    attempts++;
                    console.log(`📤 Tentativa ${attempts} de enviar mensagem...`);

                    // Aguardar um pouco antes de cada tentativa
                    if (attempts > 1) {
                        await new Promise(resolve => setTimeout(resolve, 5000));
                    }

                    result = await this.client.sendMessage(numberId._serialized, message);

                    console.log(`✅ Mensagem enviada com sucesso na tentativa ${attempts}!`);
                    logger.info(`✅ Mensagem enviada com sucesso para ${phone} na tentativa ${attempts}`);
                    return result;

                } catch (sendError) {
                    console.error(`❌ Tentativa ${attempts} falhou:`, sendError.message);

                    if (attempts >= maxAttempts) {
                        throw sendError;
                    }

                    console.log(`🔄 Aguardando para próxima tentativa...`);
                }
            }

            return result;

        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
            logger.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        if (!phone) {
            throw new Error('Número de telefone é obrigatório');
        }
        let cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.startsWith('55')) {
            cleanPhone = cleanPhone.substring(2);
        }
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            throw new Error(`Número inválido: ${cleanPhone} (deve ter 10 ou 11 dígitos)`);
        }
        if (cleanPhone.length === 10) {
            const areaCode = cleanPhone.substring(0, 2);
            const number = cleanPhone.substring(2);
            cleanPhone = `${areaCode}9${number}`;
        }
        const finalNumber = `55${cleanPhone}@c.us`;
        logger.info(`📱 Formatação: ${phone} -> ${finalNumber}`);
        return finalNumber;
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
            logger.error('❌ Erro ao desconectar WhatsApp:', error);
            this.client = null;
        } finally {
            this.isReady = false;
            this.qrCode = null;
        }
    }

    async reconnect() {
        try {
            logger.info('🔄 Iniciando reconexão do WhatsApp...');

            // Desconectar primeiro
            await this.disconnect();

            // Aguardar um pouco antes de reconectar
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Inicializar novamente
            await this.initialize();

            logger.info('✅ Reconexão do WhatsApp iniciada com sucesso');
        } catch (error) {
            logger.error('❌ Erro ao reconectar WhatsApp:', error);
            throw error;
        }
    }

    async cleanOldSession() {
        try {
            logger.info('🧹 Limpando sessão antiga do WhatsApp...');

            // Desconectar se estiver conectado
            if (this.client) {
                await this.disconnect();
            }

            // Limpar a sessão (deletar arquivos de sessão)
            const fs = require('fs').promises;
            const path = require('path');
            const sessionPath = path.join(__dirname, '../../whatsapp-session');

            try {
                const files = await fs.readdir(sessionPath);
                for (const file of files) {
                    const filePath = path.join(sessionPath, file);
                    const stat = await fs.stat(filePath);

                    if (stat.isDirectory()) {
                        await fs.rm(filePath, { recursive: true, force: true });
                    } else {
                        await fs.unlink(filePath);
                    }
                }
                logger.info('✅ Sessão antiga do WhatsApp limpa com sucesso');
            } catch (err) {
                if (err.code === 'ENOENT') {
                    logger.info('📁 Diretório de sessão não existe ou já está vazio');
                } else {
                    throw err;
                }
            }

            // Matar processos Chrome/Chromium que possam estar rodando
            const { exec } = require('child_process');
            const util = require('util');
            const execPromise = util.promisify(exec);

            try {
                await execPromise('pkill -f "chrome|chromium" || true');
                logger.info('✅ Processos Chrome/Chromium finalizados');
            } catch (err) {
                logger.warn('⚠️ Não foi possível finalizar processos Chrome:', err.message);
            }

        } catch (error) {
            logger.error('❌ Erro ao limpar sessão antiga:', error);
            throw error;
        }
    }
}

const whatsappService = new WhatsAppService();
module.exports = whatsappService;

