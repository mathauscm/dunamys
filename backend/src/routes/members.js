const express = require('express');
const MemberController = require('../controllers/MemberController');
const { authenticateToken } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const validators = require('../utils/validators');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Members
 *   description: Operações dos membros
 */

router.get('/profile', MemberController.getProfile);
router.put('/profile', MemberController.updateProfile);
router.get('/schedules', MemberController.getSchedules);
router.post('/unavailability', validate(validators.unavailability), MemberController.setUnavailability);
router.get('/unavailability', MemberController.getUnavailabilities);
router.delete('/unavailability/:id', MemberController.removeUnavailability);

// Rotas para confirmação de escalas
router.post('/schedules/:scheduleId/confirm', MemberController.confirmSchedule);
router.post('/schedules/:scheduleId/unavailable', MemberController.markUnavailableForSchedule);

module.exports = router;