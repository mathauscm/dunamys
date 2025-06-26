const MemberService = require('../services/MemberService');
const logger = require('../utils/logger');

class MemberController {
  static async getProfile(req, res, next) {
    try {
      const profile = await MemberService.getProfile(req.user.id);
      
      res.json(profile);
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { name, phone } = req.body;
      
      const updatedProfile = await MemberService.updateProfile(req.user.id, {
        name,
        phone
      });
      
      logger.info(`Perfil atualizado para usuário ID: ${req.user.id}`);
      
      res.json({
        message: 'Perfil atualizado com sucesso',
        user: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSchedules(req, res, next) {
    try {
      const { month, year } = req.query;
      
      const schedules = await MemberService.getUserSchedules(req.user.id, {
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined
      });
      
      res.json(schedules);
    } catch (error) {
      next(error);
    }
  }

  static async setUnavailability(req, res, next) {
    try {
      const { startDate, endDate, reason } = req.body;
      
      const unavailability = await MemberService.setUnavailability(req.user.id, {
        startDate,
        endDate,
        reason
      });
      
      logger.info(`Indisponibilidade definida para usuário ID: ${req.user.id}`);
      
      res.status(201).json({
        message: 'Indisponibilidade registrada com sucesso',
        unavailability
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUnavailabilities(req, res, next) {
    try {
      const unavailabilities = await MemberService.getUserUnavailabilities(req.user.id);
      
      res.json(unavailabilities);
    } catch (error) {
      next(error);
    }
  }

  static async removeUnavailability(req, res, next) {
    try {
      const { id } = req.params;
      
      await MemberService.removeUnavailability(req.user.id, parseInt(id));
      
      logger.info(`Indisponibilidade removida ID: ${id} para usuário ID: ${req.user.id}`);
      
      res.json({
        message: 'Indisponibilidade removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MemberController;