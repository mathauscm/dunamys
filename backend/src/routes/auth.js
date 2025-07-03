const express = require('express');
const AuthController = require('../controllers/AuthController');
const { validate } = require('../middlewares/validation');
const { authenticateToken } = require('../middlewares/auth');
const validators = require('../utils/validators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticação e autorização
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar novo usuário
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuário registrado com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/register', validate(validators.user), AuthController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Fazer login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login realizado com sucesso
 *       400:
 *         description: Credenciais inválidas
 */
router.post('/login', validate(validators.login), AuthController.login);

router.post('/refresh-token', authenticateToken, AuthController.refreshToken);
router.post('/change-password', authenticateToken, AuthController.changePassword);
router.post('/forgot-password', validate(validators.forgotPassword), AuthController.forgotPassword);

module.exports = router;