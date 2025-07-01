const express = require('express');
const FunctionController = require('../controllers/FunctionController');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/admin');
const { validate } = require('../middlewares/validation');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Functions
 *   description: Gerenciamento de funções e grupos de funções
 */

// ==================== GRUPOS DE FUNÇÕES ====================

/**
 * @swagger
 * /api/functions/groups:
 *   get:
 *     summary: Listar grupos de funções
 *     tags: [Functions]
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Incluir grupos inativos
 *     responses:
 *       200:
 *         description: Lista de grupos de funções
 */
router.get('/groups', FunctionController.getFunctionGroups);

/**
 * @swagger
 * /api/functions/groups:
 *   post:
 *     summary: Criar grupo de funções (Admin)
 *     tags: [Functions]
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
 *               description:
 *                 type: string
 */
router.post('/groups', requireAdmin, FunctionController.createFunctionGroup);

/**
 * @swagger
 * /api/functions/groups/{id}:
 *   put:
 *     summary: Atualizar grupo de funções (Admin)
 *     tags: [Functions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put('/groups/:id', requireAdmin, FunctionController.updateFunctionGroup);

/**
 * @swagger
 * /api/functions/groups/{id}:
 *   delete:
 *     summary: Excluir grupo de funções (Admin)
 *     tags: [Functions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/groups/:id', requireAdmin, FunctionController.deleteFunctionGroup);

// ==================== FUNÇÕES ====================

/**
 * @swagger
 * /api/functions:
 *   get:
 *     summary: Listar funções
 *     tags: [Functions]
 *     parameters:
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: integer
 *         description: Filtrar por grupo
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: boolean
 *         description: Incluir funções inativas
 *     responses:
 *       200:
 *         description: Lista de funções
 */
router.get('/', FunctionController.getFunctions);

/**
 * @swagger
 * /api/functions:
 *   post:
 *     summary: Criar função (Admin)
 *     tags: [Functions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - groupId
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               groupId:
 *                 type: integer
 */
router.post('/', requireAdmin, FunctionController.createFunction);

/**
 * @swagger
 * /api/functions/{id}:
 *   put:
 *     summary: Atualizar função (Admin)
 *     tags: [Functions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.put('/:id', requireAdmin, FunctionController.updateFunction);

/**
 * @swagger
 * /api/functions/{id}:
 *   delete:
 *     summary: Excluir função (Admin)
 *     tags: [Functions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 */
router.delete('/:id', requireAdmin, FunctionController.deleteFunction);

module.exports = router;