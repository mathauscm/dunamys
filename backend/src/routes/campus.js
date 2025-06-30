const express = require('express');
const CampusController = require('../controllers/CampusController');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/admin');
const { validate } = require('../middlewares/validation');
const Joi = require('joi');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Campus
 *   description: Gerenciamento de campus
 */

// Validadores
const campusValidation = Joi.object({
    name: Joi.string().min(2).max(100).required(),
    city: Joi.string().max(100).optional().allow('', null)
});

const updateCampusValidation = Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    city: Joi.string().max(100).optional().allow('', null),
    active: Joi.boolean().optional()
});

const transferUserValidation = Joi.object({
    userId: Joi.number().integer().positive().required(),
    newCampusId: Joi.number().integer().positive().required()
});

/**
 * @swagger
 * /api/campus/public:
 *   get:
 *     summary: Listar campus públicos (para registro)
 *     tags: [Campus]
 *     responses:
 *       200:
 *         description: Lista de campus ativos
 */
router.get('/public', CampusController.getPublicCampuses);

// NOVO: Endpoint de debug para verificar estatísticas
router.get('/debug/stats', authenticateToken, requireAdmin, CampusController.refreshStats);

// Rotas que requerem autenticação de admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * /api/campus:
 *   get:
 *     summary: Listar campus (admin)
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', CampusController.getCampuses);

/**
 * @swagger
 * /api/campus:
 *   post:
 *     summary: Criar novo campus
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', validate(campusValidation), CampusController.createCampus);

/**
 * @swagger
 * /api/campus/{id}:
 *   get:
 *     summary: Obter campus por ID
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', CampusController.getCampusById);

/**
 * @swagger
 * /api/campus/{id}:
 *   put:
 *     summary: Atualizar campus
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', validate(updateCampusValidation), CampusController.updateCampus);

/**
 * @swagger
 * /api/campus/{id}:
 *   delete:
 *     summary: Excluir campus
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', CampusController.deleteCampus);

/**
 * @swagger
 * /api/campus/{id}/stats:
 *   get:
 *     summary: Obter estatísticas do campus
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id/stats', CampusController.getCampusStats);

/**
 * @swagger
 * /api/campus/transfer-user:
 *   post:
 *     summary: Transferir usuário para outro campus
 *     tags: [Campus]
 *     security:
 *       - bearerAuth: []
 */
router.post('/transfer-user', validate(transferUserValidation), CampusController.transferUser);

module.exports = router;