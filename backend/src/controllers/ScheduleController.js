const ScheduleService = require('../services/ScheduleService');

class ScheduleController {
  static async getSchedules(req, res, next) {
    try {
      // Agora repassa todos os filtros da query, incluindo startDate e endDate!
      const schedules = await ScheduleService.getSchedules(req.query);
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  }

  static async getScheduleById(req, res, next) {
    try {
      const { id } = req.params;

      const schedule = await ScheduleService.getScheduleById(parseInt(id));

      if (!schedule) {
        return res.status(404).json({ error: 'Escala não encontrada' });
      }

      res.json(schedule);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ScheduleController;