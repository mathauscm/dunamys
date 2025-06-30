// backend/src/routes/ministries.js
const express = require('express');
const MinistryController = require('../controllers/MinistryController');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/admin');
const { validate } = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Ministries
 *   description: Gerenciamento de ministérios
 */

// Validadores
const ministryValidation = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    description: Joi.string().max(500).optional().allow('', null)
});

const updateMinistryValidation = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    description: Joi.string().max(500).optional().allow('', null),
    active: Joi.boolean().optional()
});

const transferUserValidation = Joi.object({
    userId: Joi.number().integer().positive().required(),
    newMinistryId: Joi.number().integer().positive().optional().allow(null)
});

const updateUserMinistryValidation = Joi.object({
    ministryId: Joi.number().integer().positive().optional().allow(null)
});

/**
 * @swagger
 * /api/ministries/public:
 *   get:
 *     summary: Listar ministérios públicos (para formulários)
 *     tags: [Ministries]
 *     responses:
 *       200:
 *         description: Lista de ministérios ativos
 */
router.get('/public', MinistryController.getPublicMinistries);

// Rotas que requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/ministries:
 *   get:
 *     summary: Listar ministérios (admin)
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', MinistryController.getMinistries);

/**
 * @swagger
 * /api/ministries:
 *   post:
 *     summary: Criar novo ministério
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(ministryValidation), MinistryController.createMinistry);

/**
 * @swagger
 * /api/ministries/{id}:
 *   get:
 *     summary: Obter ministério por ID
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', MinistryController.getMinistryById);

/**
 * @swagger
 * /api/ministries/{id}:
 *   put:
 *     summary: Atualizar ministério
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', validate(updateMinistryValidation), MinistryController.updateMinistry);

/**
 * @swagger
 * /api/ministries/{id}:
 *   delete:
 *     summary: Excluir ministério
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', MinistryController.deleteMinistry);

/**
 * @swagger
 * /api/ministries/{id}/stats:
 *   get:
 *     summary: Obter estatísticas do ministério
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/stats', MinistryController.getMinistryStats);

/**
 * @swagger
 * /api/ministries/transfer-user:
 *   post:
 *     summary: Transferir usuário para outro ministério
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.post('/transfer-user', validate(transferUserValidation), MinistryController.transferUser);

/**
 * @swagger
 * /api/ministries/user/{userId}/ministry:
 *   put:
 *     summary: Atualizar ministério de um usuário específico
 *     tags: [Ministries]
 *     security:
 *       - bearerAuth: []
 */
router.put('/user/:userId/ministry', validate(updateUserMinistryValidation), MinistryController.updateUserMinistry);

module.exports = router;