const axios = require('axios');
const logger = require('../utils/logger');

// URL do microserviço WhatsApp (dentro da rede Docker)
const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_SERVICE_URL || 'http://whatsapp:3000';

class WhatsAppService {
    constructor() {
        this.serviceUrl = WHATSAPP_SERVICE_URL;
        // Cache de estado para métodos síncronos
        this.cachedStatus = {
            connected: false,
            qrCode: null,
            lastUpdate: null
        };

        // Iniciar polling de status
        this.startStatusPolling();
    }

    /**
     * Inicia polling periódico para atualizar o cache de status
     */
    startStatusPolling() {
        // Atualizar a cada 5 segundos
        setInterval(async () => {
            try {
                const response = await axios.get(`${this.serviceUrl}/status`, { timeout: 3000 });
                this.cachedStatus.connected = response.data.connected || false;
                this.cachedStatus.lastUpdate = Date.now();

                // Se não estiver conectado, tentar pegar o QR Code
                if (!this.cachedStatus.connected && response.data.hasQR) {
                    try {
                        const qrResponse = await axios.get(`${this.serviceUrl}/qr`, { timeout: 3000 });
                        this.cachedStatus.qrCode = qrResponse.data.qrCode || null;
                    } catch (err) {
                        // Ignorar erro ao buscar QR Code
                    }
                } else if (this.cachedStatus.connected) {
                    this.cachedStatus.qrCode = null;
                }
            } catch (error) {
                // Se falhar, marcar como desconectado
                this.cachedStatus.connected = false;
                this.cachedStatus.qrCode = null;
            }
        }, 5000);
    }

    async initialize() {
        try {
            logger.info('🔄 Conectando ao microserviço WhatsApp...');
            console.log('🔄 Conectando ao microserviço WhatsApp...');

            // Aguardar o serviço ficar disponível
            const maxRetries = 90;
            let retries = 0;

            while (retries < maxRetries) {
                try {
                    const response = await axios.get(`${this.serviceUrl}/health`, { timeout: 5000 });
                    logger.info('✅ Microserviço WhatsApp está disponível');
                    console.log('✅ Microserviço WhatsApp está disponível');

                    // Atualizar cache imediatamente após inicialização
                    await this.refreshStatus();
                    logger.info(`📱 Status inicial do WhatsApp: ${this.cachedStatus.connected ? 'conectado' : 'desconectado'}`);
                    console.log(`📱 Status inicial do WhatsApp: ${this.cachedStatus.connected ? 'conectado' : 'desconectado'}`);

                    return;
                } catch (error) {
                    retries++;
                    if (retries >= maxRetries) {
                        throw new Error('Microserviço WhatsApp não está disponível');
                    }
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        } catch (error) {
            logger.error('❌ Erro ao conectar ao microserviço WhatsApp:', error);
            throw error;
        }
    }

    async sendMessage(phone, message) {
        try {
            console.log(`🚀 Enviando mensagem para: ${phone} via microserviço`);
            logger.info(`🚀 Enviando mensagem para: ${phone}`);

            const response = await axios.post(`${this.serviceUrl}/send`, {
                phone,
                message
            }, { timeout: 30000 });

            console.log(`✅ Mensagem enviada com sucesso para ${phone}`);
            logger.info(`✅ Mensagem enviada com sucesso para ${phone}`);

            return response.data;
        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error.message);
            logger.error(`❌ Erro ao enviar mensagem para ${phone}:`, error.message);

            if (error.response) {
                throw new Error(error.response.data.error || error.response.data.message || 'Erro ao enviar mensagem');
            }

            throw error;
        }
    }

    /**
     * Retorna o QR Code do cache (método síncrono)
     * @returns {string|null} QR Code em base64 ou null
     */
    getQRCode() {
        return this.cachedStatus.qrCode;
    }

    /**
     * Verifica se está conectado usando o cache (método síncrono)
     * @returns {boolean} true se conectado, false caso contrário
     */
    isConnected() {
        return this.cachedStatus.connected;
    }

    /**
     * Retorna o status da conexão do cache (método síncrono)
     * @returns {string} 'connected', 'awaiting_qr' ou 'disconnected'
     */
    getConnectionStatus() {
        if (this.cachedStatus.connected) {
            return 'connected';
        } else if (this.cachedStatus.qrCode) {
            return 'awaiting_qr';
        } else {
            return 'disconnected';
        }
    }

    /**
     * Força atualização imediata do status (método assíncrono para uso quando necessário)
     * @returns {Promise<boolean>} Status atualizado
     */
    async refreshStatus() {
        try {
            const response = await axios.get(`${this.serviceUrl}/status`, { timeout: 5000 });
            this.cachedStatus.connected = response.data.connected || false;
            this.cachedStatus.lastUpdate = Date.now();

            // Atualizar QR Code se necessário
            if (!this.cachedStatus.connected && response.data.hasQR) {
                try {
                    const qrResponse = await axios.get(`${this.serviceUrl}/qr`, { timeout: 3000 });
                    this.cachedStatus.qrCode = qrResponse.data.qrCode || null;
                } catch (err) {
                    this.cachedStatus.qrCode = null;
                }
            } else if (this.cachedStatus.connected) {
                this.cachedStatus.qrCode = null;
            }

            return this.cachedStatus.connected;
        } catch (error) {
            logger.error('Erro ao atualizar status:', error);
            this.cachedStatus.connected = false;
            this.cachedStatus.qrCode = null;
            return false;
        }
    }

    async disconnect() {
        try {
            await axios.post(`${this.serviceUrl}/disconnect`);
            logger.info('WhatsApp desconectado');
        } catch (error) {
            logger.error('Erro ao desconectar WhatsApp:', error);
            throw error;
        }
    }

    async reconnect() {
        try {
            logger.info('🔄 Iniciando reconexão do WhatsApp...');
            await axios.post(`${this.serviceUrl}/reconnect`);
            logger.info('✅ Reconexão do WhatsApp iniciada');
        } catch (error) {
            logger.error('❌ Erro ao reconectar WhatsApp:', error);
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        // Mantido para compatibilidade, mas a formatação real é feita no microserviço
        return phone;
    }

    async cleanOldSession() {
        try {
            logger.info('🧹 Solicitando limpeza de sessão...');
            await this.disconnect();
            logger.info('✅ Sessão limpa (reconecte para criar nova sessão)');
        } catch (error) {
            logger.error('❌ Erro ao limpar sessão:', error);
            throw error;
        }
    }
}

const whatsappService = new WhatsAppService();
module.exports = whatsappService;
