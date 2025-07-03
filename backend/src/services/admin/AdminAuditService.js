const { prisma } = require('../../config/database');
const logger = require('../../utils/logger');

/**
 * Serviço de auditoria administrativa
 * Responsável por logs de auditoria e monitoramento do sistema
 */
class AdminAuditService {
  /**
   * Obtém logs de auditoria com filtros e paginação
   * @param {Object} filters - Filtros de busca
   * @returns {Object} - Lista de logs e paginação
   */
  static async getAuditLogs(filters = {}) {
    const { 
      page = 1, 
      limit = 50, 
      action, 
      userId, 
      targetId,
      startDate,
      endDate,
      search
    } = filters;

    let whereClause = {};

    if (action) {
      whereClause.action = action;
    }

    if (userId) {
      whereClause.userId = parseInt(userId);
    }

    if (targetId) {
      whereClause.targetId = parseInt(targetId);
    }

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    if (search) {
      whereClause.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Cria um log de auditoria
   * @param {Object} data - Dados do log
   * @returns {Promise} - Log criado
   */
  static async createAuditLog(data) {
    try {
      const { action, targetId, userId, description, metadata = {} } = data;

      const auditLog = await prisma.auditLog.create({
        data: {
          action,
          targetId,
          userId,
          description,
          metadata: JSON.stringify(metadata),
          createdAt: new Date()
        }
      });

      logger.info(`Audit log created: ${action}`, {
        auditLogId: auditLog.id,
        userId,
        targetId,
        action
      });

      return auditLog;
    } catch (error) {
      logger.error('Erro ao criar log de auditoria:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de auditoria
   * @param {Object} filters - Filtros para estatísticas
   * @returns {Object} - Estatísticas de auditoria
   */
  static async getAuditStats(filters = {}) {
    const { startDate, endDate } = filters;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const [
      totalLogs,
      logsByAction,
      logsByUser,
      recentActions
    ] = await Promise.all([
      // Total de logs
      prisma.auditLog.count({ where: dateFilter }),

      // Logs agrupados por ação
      prisma.auditLog.groupBy({
        by: ['action'],
        where: dateFilter,
        _count: true,
        orderBy: { _count: { action: 'desc' } }
      }),

      // Logs agrupados por usuário
      prisma.auditLog.groupBy({
        by: ['userId'],
        where: { ...dateFilter, userId: { not: null } },
        _count: true,
        orderBy: { _count: { userId: 'desc' } }
      }),

      // Ações mais recentes
      prisma.auditLog.findMany({
        where: dateFilter,
        include: {
          user: {
            select: { id: true, name: true, role: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ]);

    // Enriquecer dados de usuários
    const userIds = logsByUser.map(log => log.userId).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, role: true }
    });

    const logsByUserEnriched = logsByUser.map(log => ({
      ...log,
      user: users.find(u => u.id === log.userId)
    }));

    return {
      totalLogs,
      logsByAction,
      logsByUser: logsByUserEnriched,
      recentActions
    };
  }

  /**
   * Obtém atividade de um usuário específico
   * @param {number} userId - ID do usuário
   * @param {Object} filters - Filtros adicionais
   * @returns {Object} - Atividade do usuário
   */
  static async getUserActivity(userId, filters = {}) {
    const { page = 1, limit = 20, startDate, endDate } = filters;

    let whereClause = { userId: parseInt(userId) };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const [logs, total, actionCounts] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where: whereClause }),
      prisma.auditLog.groupBy({
        by: ['action'],
        where: whereClause,
        _count: true,
        orderBy: { _count: { action: 'desc' } }
      })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      actionCounts
    };
  }

  /**
   * Obtém logs relacionados a um recurso específico
   * @param {string} targetId - ID do recurso
   * @param {Object} filters - Filtros adicionais
   * @returns {Object} - Logs do recurso
   */
  static async getResourceActivity(targetId, filters = {}) {
    const { page = 1, limit = 20 } = filters;

    const whereClause = { targetId: parseInt(targetId) };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Limpa logs antigos
   * @param {number} daysToKeep - Número de dias para manter
   * @returns {Object} - Resultado da limpeza
   */
  static async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const deletedCount = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate
          }
        }
      });

      logger.info(`Audit log cleanup completed: ${deletedCount.count} logs removed`);

      return {
        success: true,
        deletedCount: deletedCount.count,
        cutoffDate
      };
    } catch (error) {
      logger.error('Erro na limpeza de logs de auditoria:', error);
      throw error;
    }
  }

  /**
   * Exporta logs de auditoria
   * @param {Object} filters - Filtros para exportação
   * @param {string} format - Formato de exportação (json, csv)
   * @returns {Object} - Dados para exportação
   */
  static async exportAuditLogs(filters = {}, format = 'json') {
    const { startDate, endDate, action, userId } = filters;

    let whereClause = {};

    if (action) whereClause.action = action;
    if (userId) whereClause.userId = parseInt(userId);
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (format === 'csv') {
      // Converter para formato CSV
      const csvHeaders = ['ID', 'Action', 'User', 'Target ID', 'Description', 'Created At'];
      const csvRows = logs.map(log => [
        log.id,
        log.action,
        log.user?.name || 'Sistema',
        log.targetId || '',
        log.description,
        log.createdAt.toISOString()
      ]);

      return {
        headers: csvHeaders,
        rows: csvRows,
        filename: `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      };
    }

    return {
      logs,
      exportedAt: new Date(),
      filters,
      total: logs.length
    };
  }

  /**
   * Obtém métricas de segurança
   * @param {Object} filters - Filtros para métricas
   * @returns {Object} - Métricas de segurança
   */
  static async getSecurityMetrics(filters = {}) {
    const { startDate, endDate } = filters;

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
    }

    const [
      failedLogins,
      memberApprovals,
      memberRejections,
      scheduleModifications,
      adminActions
    ] = await Promise.all([
      prisma.auditLog.count({
        where: { ...dateFilter, action: 'LOGIN_FAILED' }
      }),
      prisma.auditLog.count({
        where: { ...dateFilter, action: 'MEMBER_APPROVED' }
      }),
      prisma.auditLog.count({
        where: { ...dateFilter, action: 'MEMBER_REJECTED' }
      }),
      prisma.auditLog.count({
        where: {
          ...dateFilter,
          action: { in: ['SCHEDULE_CREATED', 'SCHEDULE_UPDATED', 'SCHEDULE_DELETED'] }
        }
      }),
      prisma.auditLog.count({
        where: {
          ...dateFilter,
          user: { role: 'ADMIN' }
        }
      })
    ]);

    return {
      failedLogins,
      memberApprovals,
      memberRejections,
      scheduleModifications,
      adminActions
    };
  }
}

module.exports = AdminAuditService;