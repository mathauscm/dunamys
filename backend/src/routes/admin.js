const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/admin');
const { requireAdminOrGroupAdmin, requireFullAdmin } = require('../middlewares/groupAdmin');
const { validate } = require('../middlewares/validation');
const validators = require('../utils/validators');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Operações administrativas
 */

// Dashboard e estatísticas - admin geral e admin de grupo podem acessar
router.get('/dashboard', requireAdminOrGroupAdmin, AdminController.getDashboard);

// Gerenciamento de membros - admin geral e admin de grupo podem ver a lista
router.get('/members', requireAdminOrGroupAdmin, AdminController.getMembers);
router.post('/members/:id/approve', requireFullAdmin, AdminController.approveMember);
router.post('/members/:id/reject', requireFullAdmin, AdminController.rejectMember);
router.delete('/members/:id', requireFullAdmin, AdminController.deleteMember);

// Gerenciamento de escalas - admin geral e admin de grupo podem acessar
router.post('/schedules', requireAdminOrGroupAdmin, validate(validators.schedule), AdminController.createSchedule);
router.put('/schedules/:id', requireAdminOrGroupAdmin, validate(validators.schedule), AdminController.updateSchedule);
router.delete('/schedules/:id', requireAdminOrGroupAdmin, AdminController.deleteSchedule);
router.post('/schedules/:id/notify', requireAdminOrGroupAdmin, AdminController.sendNotification);

// Logs de auditoria - apenas admin geral
router.get('/logs', requireFullAdmin, AdminController.getLogs);

module.exports = router;