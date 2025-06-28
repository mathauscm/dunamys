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
            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: './whatsapp-session'
                })
            });

            this.client.on('qr', (qr) => {
                logger.info('QR Code recebido, escaneie para conectar');
                qrcode.toDataURL(qr, (err, url) => {
                    if (!err) {
                        this.qrCode = url;
                    }
                });
            });

            this.client.on('ready', () => {
                logger.info('WhatsApp Web conectado com sucesso');
                this.isReady = true;
                this.qrCode = null;
            });

            this.client.on('authenticated', () => {
                logger.info('WhatsApp Web autenticado');
            });

            this.client.on('auth_failure', (msg) => {
                logger.error('Falha na autenticação WhatsApp:', msg);
            });

            this.client.on('disconnected', (reason) => {
                logger.warn('WhatsApp Web desconectado:', reason);
                this.isReady = false;
            });

            await this.client.initialize();
        } catch (error) {
            logger.error('Erro ao inicializar WhatsApp:', error);
        }
    }

    async sendMessage(phone, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            const formattedPhone = this.formatPhoneNumber(phone);
            await this.client.sendMessage(formattedPhone, message);
            logger.info(`Mensagem WhatsApp enviada para ${phone}`);
            return true;
        } catch (error) {
            logger.error(`Erro ao enviar mensagem WhatsApp para ${phone}:`, error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        if (cleanPhone.length === 10 || cleanPhone.length === 11) {
            return `55${cleanPhone}@c.us`;
        }
        return `${cleanPhone}@c.us`;
    }

    getQRCode() {
        return this.qrCode;
    }

    isConnected() {
        return this.isReady;
    }

    async disconnect() {
        if (this.client) {
            await this.client.destroy();
            this.isReady = false;
            logger.info('WhatsApp Web desconectado');
        }
    }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;