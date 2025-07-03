const express = require('express');
const FunctionController = require('../controllers/FunctionController');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/admin');
const { requireAdminOrGroupAdmin, requireFullAdmin } = require('../middlewares/groupAdmin');
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
// Listar grupos - qualquer usuário autenticado pode ver
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
// Criar/Editar/Deletar grupos - apenas admin geral
router.post('/groups', requireFullAdmin, FunctionController.createFunctionGroup);

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
router.put('/groups/:id', requireFullAdmin, FunctionController.updateFunctionGroup);

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
router.delete('/groups/:id', requireFullAdmin, FunctionController.deleteFunctionGroup);

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
// Listar funções - qualquer usuário autenticado pode ver
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
// Criar/Editar/Deletar funções - apenas admin geral
router.post('/', requireFullAdmin, FunctionController.createFunction);

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
router.put('/:id', requireFullAdmin, FunctionController.updateFunction);

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
router.delete('/:id', requireFullAdmin, FunctionController.deleteFunction);

module.exports = router;