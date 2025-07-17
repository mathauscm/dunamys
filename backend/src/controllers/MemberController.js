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
      
      // Log para debug
      console.log('MemberController.getSchedules - Query params:', { month, year });
      console.log('User ID:', req.user.id);
      
      // Validar parâmetros
      let monthInt, yearInt;
      
      if (month) {
        monthInt = parseInt(month, 10);
        if (isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
          return res.status(400).json({
            error: 'Mês deve ser um número entre 1 e 12'
          });
        }
      }
      
      if (year) {
        yearInt = parseInt(year, 10);
        if (isNaN(yearInt) || yearInt < 1900 || yearInt > 2100) {
          return res.status(400).json({
            error: 'Ano deve ser um número válido'
          });
        }
      }
      
      const schedules = await MemberService.getUserSchedules(req.user.id, {
        month: monthInt,
        year: yearInt
      });
      
      console.log(`Retornando ${schedules.length} escalas para o usuário ${req.user.id}`);
      
      res.json(schedules);
    } catch (error) {
      console.error('Erro em MemberController.getSchedules:', error);
      next(error);
    }
  }

  static async setUnavailability(req, res, next) {
    try {
      const { startDate, endDate, reason } = req.body;
      
      console.log('MemberController.setUnavailability - Dados recebidos:', {
        userId: req.user.id,
        startDate,
        endDate,
        reason
      });
      
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
      console.error('Erro em MemberController.setUnavailability:', error);
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

  static async confirmSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;
      
      const result = await MemberService.confirmSchedule(req.user.id, parseInt(scheduleId));
      
      logger.info(`Escala confirmada - usuário ID: ${req.user.id}, escala ID: ${scheduleId}`);
      
      res.json({
        message: 'Presença confirmada com sucesso',
        scheduleMember: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async markUnavailableForSchedule(req, res, next) {
    try {
      const { scheduleId } = req.params;
      
      const result = await MemberService.markUnavailableForSchedule(req.user.id, parseInt(scheduleId));
      
      logger.info(`Indisponibilidade marcada para escala - usuário ID: ${req.user.id}, escala ID: ${scheduleId}`);
      
      res.json({
        message: 'Indisponibilidade marcada com sucesso',
        scheduleMember: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MemberController;