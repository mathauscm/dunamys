const ScheduleService = require('../services/ScheduleService');

class ScheduleController {
  static async getSchedules(req, res, next) {
    try {
      const { month, year, upcoming } = req.query;
      
      const schedules = await ScheduleService.getSchedules({
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        upcoming: upcoming === 'true'
      });
      
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