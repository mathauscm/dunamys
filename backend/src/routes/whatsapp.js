const express = require('express');
const { authenticateToken } = require('../middlewares/auth');
const { requireMasterAdmin } = require('../middlewares/admin');
const whatsappService = require('../services/WhatsAppService');
const logger = require('../utils/logger');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: WhatsApp
 *   description: Operações do WhatsApp Web (somente Admin Master)
 */

/**
 * @swagger
 * /api/whatsapp/initialize:
 *   post:
 *     summary: Inicializar WhatsApp Service
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp inicializado com sucesso
 *       403:
 *         description: Acesso negado
 */
router.post('/initialize', requireMasterAdmin, async (req, res) => {
    try {
        if (whatsappService.isConnected()) {
            return res.json({
                message: 'WhatsApp já está conectado',
                status: 'connected'
            });
        }

        // Inicializar WhatsApp Service
        await whatsappService.initialize();
        
        res.json({
            message: 'WhatsApp inicializado. Aguarde alguns segundos e verifique o QR Code.',
            status: 'initializing'
        });
        
        logger.info(`WhatsApp inicializado por admin master: ${req.user.email}`);
    } catch (error) {
        logger.error('Erro ao inicializar WhatsApp:', error);
        res.status(500).json({
            error: 'Erro ao inicializar WhatsApp: ' + error.message
        });
    }
});

/**
 * @swagger
 * /api/whatsapp/qr:
 *   get:
 *     summary: Obter QR Code para conexão do WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR Code retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *                   description: QR Code em formato base64
 *                 status:
 *                   type: string
 *                   description: Status da conexão
 *       403:
 *         description: Acesso negado
 *       404:
 *         description: QR Code não disponível
 */
router.get('/qr', requireMasterAdmin, async (req, res) => {
    try {
        const qrCode = whatsappService.getQRCode();
        const status = whatsappService.getConnectionStatus();
        
        if (!qrCode && status === 'connected') {
            return res.json({
                qrCode: null,
                status: 'connected',
                message: 'WhatsApp já está conectado'
            });
        }
        
        if (!qrCode && status === 'disconnected') {
            return res.status(404).json({
                error: 'WhatsApp não foi inicializado. Use POST /api/whatsapp/initialize primeiro.',
                status: status,
                action: 'initialize'
            });
        }
        
        if (!qrCode) {
            return res.status(404).json({
                error: 'QR Code não disponível. Tente reconectar o WhatsApp.',
                status: status
            });
        }
        
        res.json({
            qrCode: qrCode,
            status: status
        });
        
        logger.info(`QR Code WhatsApp solicitado por admin master: ${req.user.email}`);
    } catch (error) {
        logger.error('Erro ao obter QR Code WhatsApp:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @swagger
 * /api/whatsapp/status:
 *   get:
 *     summary: Verificar status da conexão do WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status retornado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: Status da conexão (connected, awaiting_qr, disconnected)
 *                 isConnected:
 *                   type: boolean
 *                   description: Se está conectado
 *       403:
 *         description: Acesso negado
 */
router.get('/status', requireMasterAdmin, async (req, res) => {
    try {
        const status = whatsappService.getConnectionStatus();
        const isConnected = whatsappService.isConnected();
        
        res.json({
            status: status,
            isConnected: isConnected
        });
        
        logger.info(`Status WhatsApp consultado por admin master: ${req.user.email}`);
    } catch (error) {
        logger.error('Erro ao verificar status WhatsApp:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @swagger
 * /api/whatsapp/disconnect:
 *   post:
 *     summary: Desconectar WhatsApp Web
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp desconectado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       403:
 *         description: Acesso negado
 */
router.post('/disconnect', requireMasterAdmin, async (req, res) => {
    try {
        await whatsappService.disconnect();
        
        res.json({
            message: 'WhatsApp desconectado com sucesso'
        });
        
        logger.info(`WhatsApp desconectado por admin master: ${req.user.email}`);
    } catch (error) {
        logger.error('Erro ao desconectar WhatsApp:', error);
        res.status(500).json({
            error: 'Erro interno do servidor'
        });
    }
});

/**
 * @swagger
 * /api/whatsapp/cleanup:
 *   post:
 *     summary: Limpeza forçada de processos Chrome e sessões WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Limpeza realizada com sucesso
 *       403:
 *         description: Acesso negado
 */
router.post('/cleanup', requireMasterAdmin, async (req, res) => {
    try {
        console.log('🧹 Endpoint cleanup chamado');
        logger.info('Endpoint cleanup chamado');

        // Forçar limpeza completa
        await whatsappService.cleanOldSession();

        res.json({
            message: 'Limpeza de sessões e processos realizada com sucesso'
        });

        logger.info(`Limpeza WhatsApp realizada por admin master: ${req.user.email}`);
    } catch (error) {
        console.error('❌ Erro na limpeza:', error);
        logger.error('Erro na limpeza:', error);

        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message
        });
    }
});

/**
 * @swagger
 * /api/whatsapp/reconnect:
 *   post:
 *     summary: Reconectar WhatsApp Web
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Processo de reconexão iniciado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Mensagem de sucesso
 *       403:
 *         description: Acesso negado
 */
router.post('/reconnect', requireMasterAdmin, async (req, res) => {
    try {
        console.log('🔄 Endpoint reconnect chamado');
        logger.info('Endpoint reconnect chamado');
        
        // Aguardar reconexão terminar antes de responder
        await whatsappService.reconnect();
        
        res.json({
            message: 'Processo de reconexão iniciado. Aguarde alguns segundos e verifique o QR Code.'
        });
        
        logger.info(`Reconexão WhatsApp iniciada por admin master: ${req.user.email}`);
    } catch (error) {
        console.error('❌ Erro completo no endpoint reconnect:', error);
        logger.error('Erro completo no endpoint reconnect:', error);
        
        // Resposta mais detalhada do erro
        res.status(500).json({
            error: 'Erro interno do servidor',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

module.exports = router;