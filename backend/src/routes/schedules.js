const express = require('express');
const ScheduleController = require('../controllers/ScheduleController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

router.use(authenticateToken);

/**
 * @swagger
 * tags:
 *   name: Schedules
 *   description: Operações com escalas
 */

router.get('/', ScheduleController.getSchedules);
router.get('/:id', ScheduleController.getScheduleById);

module.exports = router;