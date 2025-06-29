// backend/src/routes/campus.js
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
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   city:
 *                     type: string
 */
router.get('/public', CampusController.getPublicCampuses);

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
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nome ou cidade
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Itens por página
 *     responses:
 *       200:
 *         description: Lista de campus com paginação
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sobral"
 *               city:
 *                 type: string
 *                 example: "Sobral"
 *     responses:
 *       201:
 *         description: Campus criado com sucesso
 *       400:
 *         description: Dados inválidos
 *       409:
 *         description: Campus já existe
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Dados do campus
 *       404:
 *         description: Campus não encontrado
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               city:
 *                 type: string
 *               active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Campus atualizado com sucesso
 *       404:
 *         description: Campus não encontrado
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Campus excluído com sucesso
 *       400:
 *         description: Campus possui usuários
 *       404:
 *         description: Campus não encontrado
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
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Estatísticas do campus
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - newCampusId
 *             properties:
 *               userId:
 *                 type: integer
 *               newCampusId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuário transferido com sucesso
 */
router.post('/transfer-user', validate(transferUserValidation), CampusController.transferUser);

module.exports = router;