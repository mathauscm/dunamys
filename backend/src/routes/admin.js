const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticateToken } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/admin');
const { validate } = require('../middlewares/validation');
const validators = require('../utils/validators');

const router = express.Router();

// Todas as rotas requerem autenticação e papel de admin
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Operações administrativas
 */

router.get('/dashboard', AdminController.getDashboard);
router.get('/members', AdminController.getMembers);
router.post('/members/:id/approve', AdminController.approveMember);
router.post('/members/:id/reject', AdminController.rejectMember);
router.post('/schedules', validate(validators.schedule), AdminController.createSchedule);
router.put('/schedules/:id', validate(validators.schedule), AdminController.updateSchedule);
router.delete('/schedules/:id', AdminController.deleteSchedule);
router.post('/schedules/:id/notify', AdminController.sendNotification);
router.get('/logs', AdminController.getLogs);

module.exports = router;