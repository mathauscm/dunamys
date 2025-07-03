const AdminService = require('../services/AdminService');
const logger = require('../utils/logger');

class AdminController {
  static async getDashboard(req, res, next) {
    try {
      const dashboard = await AdminService.getDashboardStats();
      
      res.json(dashboard);
    } catch (error) {
      next(error);
    }
  }

  static async getMembers(req, res, next) {
    try {
      const { status, search, page = 1, limit = 20 } = req.query;
      
      // Se for admin de grupo, só pode ver membros ativos
      const finalStatus = req.user.userType === 'groupAdmin' ? 'ACTIVE' : status;
      
      const result = await AdminService.getMembers({
        status: finalStatus,
        search,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async approveMember(req, res, next) {
    try {
      const { id } = req.params;
      
      await AdminService.approveMember(parseInt(id));
      
      logger.info(`Membro aprovado ID: ${id} por admin ID: ${req.user.id}`);
      
      res.json({
        message: 'Membro aprovado com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectMember(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      await AdminService.rejectMember(parseInt(id), reason);
      
      logger.info(`Membro rejeitado ID: ${id} por admin ID: ${req.user.id}`);
      
      res.json({
        message: 'Membro rejeitado'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * NOVO MÉTODO: Excluir membro
   */
  static async deleteMember(req, res, next) {
    try {
      const { id } = req.params;
      
      const result = await AdminService.deleteMember(parseInt(id));
      
      logger.info(`Membro excluído ID: ${id} por admin ID: ${req.user.id}`);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * NOVO MÉTODO: Atualizar ministério de um membro
   */
  static async updateMemberMinistry(req, res, next) {
    try {
      const { id } = req.params;
      const { ministryId } = req.body;
      
      const updatedMember = await AdminService.updateMemberMinistry(
        parseInt(id), 
        ministryId ? parseInt(ministryId) : null
      );
      
      logger.info(`Ministério do membro atualizado ID: ${id} por admin ID: ${req.user.id}`);
      
      res.json({
        message: 'Ministério do membro atualizado com sucesso',
        member: updatedMember
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * NOVO MÉTODO: Buscar membros disponíveis para uma data
   */
  static async getAvailableMembers(req, res, next) {
    try {
      const { date, campusId, ministryId, search } = req.query;
      
      if (!date) {
        return res.status(400).json({
          error: 'Data é obrigatória (formato: YYYY-MM-DD)'
        });
      }

      const filters = {};
      if (campusId) filters.campusId = campusId;
      if (ministryId) filters.ministryId = ministryId;
      if (search) filters.search = search;

      const result = await AdminService.getAvailableMembers(date, filters);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * NOVO MÉTODO: Buscar indisponibilidades para uma data
   */
  static async getMemberUnavailabilities(req, res, next) {
    try {
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({
          error: 'Data é obrigatória (formato: YYYY-MM-DD)'
        });
      }

      const result = await AdminService.getMemberUnavailabilities(date);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async createSchedule(req, res, next) {
    try {
      const { title, description, date, time, location, memberIds, memberFunctions } = req.body;
      
      const schedule = await AdminService.createSchedule({
        title,
        description,
        date,
        time,
        location,
        memberIds,
        memberFunctions,
        createdBy: req.user.id
      });
      
      logger.info(`Escala criada ID: ${schedule.id} por admin ID: ${req.user.id}`);
      
      res.status(201).json({
        message: 'Escala criada com sucesso',
        schedule
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSchedule(req, res, next) {
    try {
      const { id } = req.params;
      const { title, description, date, time, location, memberIds, memberFunctions } = req.body;
      
      const schedule = await AdminService.updateSchedule(parseInt(id), {
        title,
        description,
        date,
        time,
        location,
        memberIds,
        memberFunctions
      });
      
      logger.info(`Escala atualizada ID: ${id} por admin ID: ${req.user.id}`);
      
      res.json({
        message: 'Escala atualizada com sucesso',
        schedule
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteSchedule(req, res, next) {
    try {
      const { id } = req.params;
      
      await AdminService.deleteSchedule(parseInt(id));
      
      logger.info(`Escala removida ID: ${id} por admin ID: ${req.user.id}`);
      
      res.json({
        message: 'Escala removida com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendNotification(req, res, next) {
    try {
      const { scheduleId, type, message } = req.body;
      
      await AdminService.sendScheduleNotification(parseInt(scheduleId), type, message);
      
      logger.info(`Notificação enviada para escala ID: ${scheduleId} por admin ID: ${req.user.id}`);
      
      res.json({
        message: 'Notificação enviada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getLogs(req, res, next) {
    try {
      const { page = 1, limit = 50, action, userId } = req.query;
      
      const logs = await AdminService.getAuditLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        action,
        userId: userId ? parseInt(userId) : undefined
      });
      
      res.json(logs);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AdminController;