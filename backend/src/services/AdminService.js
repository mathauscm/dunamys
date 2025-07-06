const { prisma } = require('../config/database');
const NotificationService = require('./NotificationService');
const logger = require('../utils/logger');

// Importar serviços modulares
const AdminMemberService = require('./admin/AdminMemberService');
const AdminScheduleService = require('./admin/AdminScheduleService');
const AdminAuditService = require('./admin/AdminAuditService');

/**
 * Serviço principal de administração
 * Coordena os serviços modulares e fornece funcionalidades de dashboard
 */
class AdminService {
  /**
   * Obtém estatísticas do dashboard
   * @returns {Object} - Estatísticas consolidadas
   */
  static async getDashboardStats() {
    try {
      // Obter estatísticas dos serviços modulares
      const [
        memberStats,
        scheduleStats,
        auditStats
      ] = await Promise.all([
        AdminMemberService.getMemberStats(),
        AdminScheduleService.getScheduleStats(),
        AdminAuditService.getAuditStats({
          startDate: new Date(new Date().setDate(new Date().getDate() - 30))
        })
      ]);

      // Estatísticas adicionais específicas do dashboard
      const recentActivity = await AdminAuditService.getAuditLogs({
        limit: 5,
        page: 1
      });

      return {
        // Estatísticas de membros
        ...memberStats,
        
        // Estatísticas de escalas
        ...scheduleStats,
        
        // Atividade recente
        recentActivity: recentActivity.logs,
        
        // Métricas consolidadas
        systemHealth: {
          totalUsers: memberStats.totalMembers,
          activeUsers: memberStats.activeMembers,
          pendingApprovals: memberStats.pendingMembers,
          upcomingEvents: scheduleStats.upcomingSchedules,
          recentActions: auditStats.totalLogs
        }
      };
    } catch (error) {
      logger.error('Erro ao obter estatísticas do dashboard:', error);
      throw error;
    }
  }

  // Delegação para AdminMemberService
  static async getMembers(filters = {}) {
    return AdminMemberService.getMembers(filters);
  }

  static async approveMember(memberId, adminId) {
    return AdminMemberService.approveMember(memberId, adminId);
  }

  static async rejectMember(memberId, reason, adminId) {
    return AdminMemberService.rejectMember(memberId, reason, adminId);
  }

  static async deleteMember(memberId, adminId) {
    return AdminMemberService.deleteMember(memberId, adminId);
  }

  static async updateMemberMinistry(memberId, ministryId, adminId) {
    return AdminMemberService.updateMemberMinistry(memberId, ministryId, adminId);
  }

  static async getMemberUnavailabilities(date) {
    return AdminMemberService.getMemberUnavailabilities(date);
  }

  static async getAvailableMembers(date, filters = {}) {
    return AdminMemberService.getAvailableMembers(date, filters);
  }

  // Delegação para AdminScheduleService
  static async createSchedule(data) {
    return AdminScheduleService.createSchedule(data);
  }

  static async updateSchedule(scheduleId, data, updatedBy) {
    return AdminScheduleService.updateSchedule(scheduleId, data, updatedBy);
  }

  static async deleteSchedule(scheduleId, deletedBy) {
    return AdminScheduleService.deleteSchedule(scheduleId, deletedBy);
  }

  static async sendScheduleNotification(scheduleId, type, message, sentBy) {
    logger.info(`📋 AdminService.sendScheduleNotification chamado:`, {
      scheduleId, type, message: message?.substring(0, 30) + '...', sentBy
    });
    
    const result = await AdminScheduleService.sendScheduleNotification(scheduleId, type, message, sentBy);
    
    logger.info(`📋 AdminService.sendScheduleNotification concluído:`, result);
    return result;
  }

  // Delegação para AdminAuditService
  static async getAuditLogs(filters = {}) {
    return AdminAuditService.getAuditLogs(filters);
  }

  static async createAuditLog(data) {
    return AdminAuditService.createAuditLog(data);
  }

  // Métodos de teste e utilitários
  static async testNotificationServices() {
    try {
      const testResults = await NotificationService.testNotificationServices();
      logger.info('Resultado dos testes de notificação:', testResults);
      return testResults;
    } catch (error) {
      logger.error('Erro ao testar serviços de notificação:', error);
      return { email: false, whatsapp: false, database: false };
    }
  }

  static async sendTestNotification(userId, type = 'EMAIL') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (type === 'APPROVAL') {
        await NotificationService.sendMemberApproval(user);
      } else if (type === 'REJECTION') {
        await NotificationService.sendMemberRejection(user, 'Teste de notificação');
      }

      return { success: true, message: 'Notificação de teste enviada' };
    } catch (error) {
      logger.error('Erro ao enviar notificação de teste:', error);
      throw error;
    }
  }
}

module.exports = AdminService;