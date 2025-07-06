const { prisma } = require('../../config/database');
const NotificationService = require('../NotificationService');
const logger = require('../../utils/logger');

/**
 * Serviço de administração de escalas
 * Responsável por todas as operações de gestão de escalas pelos administradores
 */
class AdminScheduleService {
  /**
   * Cria uma nova escala com membros e funções
   * @param {Object} data - Dados da escala
   * @returns {Object} - Escala criada
   */
  static async createSchedule(data) {
    const { title, description, date, time, location, memberIds, createdBy, memberFunctions = {} } = data;

    // Verificar se os membros existem e estão ativos
    const members = await prisma.user.findMany({
      where: {
        id: { in: memberIds },
        role: 'MEMBER',
        status: 'ACTIVE'
      }
    });

    if (members.length !== memberIds.length) {
      throw new Error('Alguns membros selecionados não foram encontrados ou não estão ativos');
    }

    // Verificar indisponibilidades
    const dateISO = typeof date === 'string' && date.length === 10 ? 
      date + 'T00:00:00' : date;
    const dateObj = new Date(dateISO);

    const unavailabilities = await prisma.unavailability.findMany({
      where: {
        userId: { in: memberIds },
        startDate: { lte: dateObj },
        endDate: { gte: dateObj }
      },
      include: {
        user: { select: { name: true } }
      }
    });

    if (unavailabilities.length > 0) {
      const unavailableMembers = unavailabilities.map(u => u.user.name).join(', ');
      throw new Error(`Os seguintes membros estão indisponíveis na data selecionada: ${unavailableMembers}`);
    }

    // Criar escala e membros
    const schedule = await prisma.schedule.create({
      data: {
        title,
        description,
        date: dateObj,
        time,
        location,
        members: {
          create: memberIds.map(memberId => ({
            userId: memberId
          }))
        }
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } }
          }
        }
      }
    });

    // Associar funções aos membros se fornecido
    if (memberFunctions && Object.keys(memberFunctions).length > 0) {
      const FunctionService = require('../FunctionService');
      for (const [memberId, functionIds] of Object.entries(memberFunctions)) {
        if (functionIds && functionIds.length > 0) {
          // Encontrar o scheduleMember
          const scheduleMember = schedule.members.find(m => m.userId === parseInt(memberId));
          if (scheduleMember) {
            await FunctionService.assignFunctionToScheduleMember(
              scheduleMember.id, 
              functionIds
            );
          }
        }
      }
    }

    // Log de auditoria
    await this.createScheduleAuditLog({
      action: 'SCHEDULE_CREATED',
      targetId: schedule.id,
      userId: createdBy,
      description: `Escala "${title}" criada para ${date}`
    });

    // Enviar notificações
    try {
      await NotificationService.sendScheduleAssignment(schedule);
      logger.info(`Notificações de escala enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de escala:', notificationError);
      logger.warn('Criação da escala continuou apesar do erro nas notificações');
    }

    return schedule;
  }

  /**
   * Atualiza uma escala existente
   * @param {number} scheduleId - ID da escala
   * @param {Object} data - Dados atualizados
   * @param {number} updatedBy - ID do administrador
   * @returns {Object} - Escala atualizada
   */
  static async updateSchedule(scheduleId, data, updatedBy) {
    const { title, description, date, time, location, memberIds, memberFunctions = {} } = data;

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        members: { include: { user: true } }
      }
    });

    if (!existingSchedule) {
      throw new Error('Escala não encontrada');
    }

    // Validações de membros se fornecidos
    if (memberIds) {
      const members = await prisma.user.findMany({
        where: {
          id: { in: memberIds },
          role: 'MEMBER',
          status: 'ACTIVE'
        }
      });

      if (members.length !== memberIds.length) {
        throw new Error('Alguns membros selecionados não foram encontrados ou não estão ativos');
      }

      // Verificar indisponibilidades se a data foi alterada
      if (date) {
        const dateObj = typeof date === 'string' && date.length === 10 ? 
          new Date(date + 'T00:00:00') : new Date(date);

        const unavailabilities = await prisma.unavailability.findMany({
          where: {
            userId: { in: memberIds },
            startDate: { lte: dateObj },
            endDate: { gte: dateObj }
          },
          include: {
            user: { select: { name: true } }
          }
        });

        if (unavailabilities.length > 0) {
          const unavailableMembers = unavailabilities.map(u => u.user.name).join(', ');
          throw new Error(`Os seguintes membros estão indisponíveis na nova data: ${unavailableMembers}`);
        }
      }
    }

    let dateObj;
    if (date && typeof date === 'string' && date.length === 10) {
      dateObj = new Date(date + 'T00:00:00');
    } else if (date) {
      dateObj = new Date(date);
    }

    // Preparar dados de atualização
    const updateData = {
      title,
      description,
      date: date ? dateObj : undefined,
      time,
      location
    };

    // Atualizar membros se fornecidos
    if (memberIds) {
      updateData.members = {
        deleteMany: {}, // Remove todos os membros existentes
        create: memberIds.map(memberId => ({
          userId: memberId
        }))
      };
    }

    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } }
          }
        }
      }
    });

    // Atualizar funções dos membros se fornecido
    if (memberFunctions && Object.keys(memberFunctions).length > 0) {
      const FunctionService = require('../FunctionService');
      for (const [memberId, functionIds] of Object.entries(memberFunctions)) {
        // Encontrar o scheduleMember
        const scheduleMember = schedule.members.find(m => m.userId === parseInt(memberId));
        if (scheduleMember) {
          await FunctionService.assignFunctionToScheduleMember(
            scheduleMember.id,
            functionIds || []
          );
        }
      }
    }

    // Log de auditoria
    await this.createScheduleAuditLog({
      action: 'SCHEDULE_UPDATED',
      targetId: scheduleId,
      userId: updatedBy,
      description: `Escala "${title || existingSchedule.title}" foi atualizada`
    });

    // Enviar notificações de atualização
    try {
      await NotificationService.sendScheduleUpdate(schedule);
      logger.info(`Notificações de atualização enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de atualização:', notificationError);
    }

    return schedule;
  }

  /**
   * Exclui uma escala
   * @param {number} scheduleId - ID da escala
   * @param {number} deletedBy - ID do administrador
   * @returns {Object} - Resultado da exclusão
   */
  static async deleteSchedule(scheduleId, deletedBy) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        members: { include: { user: true } }
      }
    });

    if (!schedule) {
      throw new Error('Escala não encontrada');
    }

    // Enviar notificações de cancelamento antes de deletar
    try {
      await NotificationService.sendScheduleCancellation(schedule);
      logger.info(`Notificações de cancelamento enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de cancelamento:', notificationError);
      logger.warn('Remoção da escala continuará apesar do erro nas notificações');
    }

    // Deletar escala (cascade vai remover os scheduleMember automaticamente)
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    // Log de auditoria
    await this.createScheduleAuditLog({
      action: 'SCHEDULE_DELETED',
      targetId: scheduleId,
      userId: deletedBy,
      description: `Escala "${schedule.title}" foi removida`
    });

    return {
      success: true,
      message: 'Escala removida com sucesso',
      deletedSchedule: {
        id: schedule.id,
        title: schedule.title,
        date: schedule.date
      }
    };
  }

  /**
   * Envia notificação personalizada para uma escala
   * @param {number} scheduleId - ID da escala
   * @param {string} type - Tipo da notificação
   * @param {string} message - Mensagem personalizada
   * @param {number} sentBy - ID do administrador
   * @returns {Object} - Resultado do envio
   */
  static async sendScheduleNotification(scheduleId, type, message, sentBy) {
    logger.info(`🚀 INICIANDO sendScheduleNotification:`, {
      scheduleId,
      type,
      message: message?.substring(0, 50) + '...',
      sentBy
    });
    
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } }
          }
        }
      }
    });

    if (!schedule) {
      logger.error(`❌ Escala ${scheduleId} não encontrada`);
      throw new Error('Escala não encontrada');
    }

    logger.info(`📋 Escala encontrada: "${schedule.title}" com ${schedule.members.length} membros`);
    
    try {
      logger.info(`📤 Enviando notificação padrão de escala (Email + WhatsApp)...`);
      await NotificationService.sendScheduleAssignment(schedule);
      logger.info(`✅ Notificação de escala enviada com sucesso`);
      logger.info(`🎉 ${schedule.members.length} membros notificados via Email + WhatsApp`);
      
      // Log de auditoria
      await this.createScheduleAuditLog({
        action: 'SCHEDULE_NOTIFICATION_SENT',
        targetId: scheduleId,
        userId: sentBy,
        description: `Notificação (Email + WhatsApp) enviada para escala "${schedule.title}"`
      });

      return {
        success: true,
        message: 'Notificação enviada com sucesso',
        recipientCount: schedule.members.length
      };
    } catch (notificationError) {
      logger.error('Erro ao enviar notificação customizada:', notificationError);
      throw new Error('Erro ao enviar notificação: ' + notificationError.message);
    }
  }

  /**
   * Obtém estatísticas de escalas
   * @returns {Object} - Estatísticas de escalas
   */
  static async getScheduleStats() {
    const [
      totalSchedules,
      upcomingSchedules,
      pastSchedules,
      schedulesByMonth
    ] = await Promise.all([
      prisma.schedule.count(),
      prisma.schedule.count({ where: { date: { gte: new Date() } } }),
      prisma.schedule.count({ where: { date: { lt: new Date() } } }),
      
      // Escalas por mês (últimos 6 meses)
      prisma.schedule.groupBy({
        by: ['date'],
        where: {
          date: { 
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6))
          }
        },
        _count: true
      })
    ]);

    return {
      totalSchedules,
      upcomingSchedules,
      pastSchedules,
      schedulesByMonth
    };
  }

  /**
   * Lista escalas com filtros e paginação
   * @param {Object} filters - Filtros de busca
   * @returns {Object} - Lista de escalas e paginação
   */
  static async getSchedules(filters = {}) {
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      location, 
      search 
    } = filters;

    let whereClause = {};

    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date.gte = new Date(startDate);
      if (endDate) whereClause.date.lte = new Date(endDate);
    }

    if (location) {
      whereClause.location = { contains: location, mode: 'insensitive' };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [schedules, total] = await Promise.all([
      prisma.schedule.findMany({
        where: whereClause,
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true } }
            }
          },
          _count: {
            select: { members: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' }
      }),
      prisma.schedule.count({ where: whereClause })
    ]);

    return {
      schedules,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Cria um log de auditoria específico para escalas
   * @param {Object} data - Dados do log
   * @returns {Promise} - Log criado
   */
  static async createScheduleAuditLog(data) {
    try {
      const { action, targetId, userId, description } = data;

      return await prisma.auditLog.create({
        data: {
          action,
          targetId,
          userId,
          description,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Erro ao criar log de auditoria para escala:', error);
    }
  }
}

module.exports = AdminScheduleService;