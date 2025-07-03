const express = require('express');
const FunctionGroupAdminController = require('../controllers/FunctionGroupAdminController');
const { authenticateToken } = require('../middlewares/auth');
const { requireFullAdmin, requireAdminOrGroupAdmin } = require('../middlewares/groupAdmin');

const router = express.Router();

// Aplicar autenticação em todas as rotas
router.use(authenticateToken);

// Rotas para administradores gerais (só ADMIN pode designar/remover admins de grupo)
router.post('/', requireFullAdmin, FunctionGroupAdminController.assignUser);
router.delete('/:userId/:functionGroupId', requireFullAdmin, FunctionGroupAdminController.removeUser);

// Rotas para consultar grupos (admin geral e admin de grupo podem acessar)
router.get('/user/:userId/groups', requireAdminOrGroupAdmin, FunctionGroupAdminController.getUserGroups);
router.get('/my-groups', requireAdminOrGroupAdmin, FunctionGroupAdminController.getMyGroups);
router.get('/group/:functionGroupId/admins', requireAdminOrGroupAdmin, FunctionGroupAdminController.getGroupAdmins);
router.get('/', requireFullAdmin, FunctionGroupAdminController.getAllGroupAdmins);

// Rota para admin de grupo obter suas funções disponíveis
router.get('/my-functions', requireAdminOrGroupAdmin, FunctionGroupAdminController.getMyFunctions);

module.exports = router;