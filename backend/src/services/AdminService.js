// backend/src/services/AdminService.js - VERSÃO CORRIGIDA E ATUALIZADA
const { prisma } = require('../config/database');
const NotificationService = require('./NotificationService');
const logger = require('../utils/logger');

class AdminService {
  static async getDashboardStats() {
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      upcomingSchedules,
      totalSchedules
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'PENDING' } }),
      prisma.schedule.count({ where: { date: { gte: new Date() } } }),
      prisma.schedule.count()
    ]);

    // Escalas por mês (últimos 6 meses)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const schedulesByMonth = await prisma.schedule.groupBy({
      by: ['date'],
      where: {
        date: { gte: sixMonthsAgo }
      },
      _count: true
    });

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      upcomingSchedules,
      totalSchedules,
      schedulesByMonth
    };
  }

  // FUNÇÃO ATUALIZADA: getMembers agora inclui ministério
  static async getMembers(filters = {}) {
    const { status, search, page = 1, limit = 20 } = filters;

    let whereClause = { role: 'MEMBER' };

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          campus: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          ministry: { // NOVO: Incluir ministério
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          _count: {
            select: {
              schedules: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return {
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async approveMember(memberId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      if (member.status === 'ACTIVE') {
        throw new Error('Membro já está ativo');
      }

      // PRIMEIRO: Atualizar status do membro no banco
      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { status: 'ACTIVE' }
      });

      // SEGUNDO: Criar log de auditoria
      await this.createAuditLog({
        action: 'MEMBER_APPROVED',
        targetId: memberId,
        description: `Membro ${member.name} foi aprovado`
      });

      // TERCEIRO: Tentar enviar notificação (não bloquear se falhar)
      try {
        await NotificationService.sendMemberApproval(member);
        logger.info(`Notificação de aprovação enviada para ${member.email}`);
      } catch (notificationError) {
        // Log do erro, mas não falhar a aprovação
        logger.error(`Erro ao enviar notificação de aprovação para ${member.email}:`, notificationError);
        logger.warn('Aprovação do membro continuou apesar do erro na notificação');
      }

      return updatedMember;

    } catch (error) {
      logger.error(`Erro ao aprovar membro ${memberId}:`, error);
      throw error;
    }
  }

  static async rejectMember(memberId, reason) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      // PRIMEIRO: Atualizar status do membro no banco
      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { status: 'REJECTED' }
      });

      // SEGUNDO: Criar log de auditoria
      await this.createAuditLog({
        action: 'MEMBER_REJECTED',
        targetId: memberId,
        description: `Membro ${member.name} foi rejeitado. Motivo: ${reason || 'Não informado'}`
      });

      // TERCEIRO: Tentar enviar notificação (não bloquear se falhar)
      try {
        await NotificationService.sendMemberRejection(member, reason);
        logger.info(`Notificação de rejeição enviada para ${member.email}`);
      } catch (notificationError) {
        // Log do erro, mas não falhar a rejeição
        logger.error(`Erro ao enviar notificação de rejeição para ${member.email}:`, notificationError);
        logger.warn('Rejeição do membro continuou apesar do erro na notificação');
      }

      return updatedMember;

    } catch (error) {
      logger.error(`Erro ao rejeitar membro ${memberId}:`, error);
      throw error;
    }
  }

  // NOVA FUNÇÃO: Atualizar ministério de um membro
  static async updateMemberMinistry(memberId, ministryId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      // Se ministryId for null, remove o ministério
      if (ministryId === null) {
        const updatedMember = await prisma.user.update({
          where: { id: memberId },
          data: { ministryId: null },
          include: {
            campus: {
              select: {
                id: true,
                name: true,
                city: true
              }
            }
          }
        });

        await this.createAuditLog({
          action: 'MEMBER_MINISTRY_REMOVED',
          targetId: memberId,
          description: `Ministério removido do membro ${member.name}`
        });

        return updatedMember;
      }

      // Verificar se o ministério existe e está ativo
      const ministry = await prisma.ministry.findUnique({
        where: { id: ministryId, active: true }
      });

      if (!ministry) {
        throw new Error('Ministério não encontrado ou inativo');
      }

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { ministryId },
        include: {
          campus: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          ministry: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      await this.createAuditLog({
        action: 'MEMBER_MINISTRY_UPDATED',
        targetId: memberId,
        description: `Membro ${member.name} adicionado ao ministério ${ministry.name}`
      });

      return updatedMember;

    } catch (error) {
      logger.error(`Erro ao atualizar ministério do membro ${memberId}:`, error);
      throw error;
    }
  }

  static async createSchedule(data) {
    const { title, description, date, time, location, memberIds, createdBy } = data;

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
    // Se date é "YYYY-MM-DD", converte para "YYYY-MM-DDT00:00:00"
    const dateISO = date.length === 10 ? date + 'T00:00:00' : date;
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

    // Criar log de auditoria
    await this.createAuditLog({
      action: 'SCHEDULE_CREATED',
      targetId: schedule.id,
      userId: createdBy,
      description: `Escala "${title}" criada para ${date}`
    });

    // Tentar enviar notificações (não bloquear se falhar)
    try {
      await NotificationService.sendScheduleAssignment(schedule);
      logger.info(`Notificações de escala enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de escala:', notificationError);
      logger.warn('Criação da escala continuou apesar do erro nas notificações');
    }

    return schedule;
  }

  static async updateSchedule(scheduleId, data) {
    const { title, description, date, time, location, memberIds } = data;

    const existingSchedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        members: { include: { user: true } }
      }
    });

    if (!existingSchedule) {
      throw new Error('Escala não encontrada');
    }

    // Verificar se os novos membros existem e estão ativos
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
    }

    // Ajuste aqui: Prisma espera DateTime ou ISO completo
    let dateObj;
    if (date && typeof date === 'string' && date.length === 10) {
      dateObj = new Date(date + 'T00:00:00');
    } else if (date) {
      dateObj = new Date(date);
    }

    // Atualizar escala
    const schedule = await prisma.schedule.update({
      where: { id: scheduleId },
      data: {
        title,
        description,
        date: date ? dateObj : undefined,
        time,
        location,
        ...(memberIds && {
          members: {
            deleteMany: {},
            create: memberIds.map(memberId => ({
              userId: memberId
            }))
          }
        })
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, phone: true, email: true } }
          }
        }
      }
    });

    // Criar log de auditoria
    await this.createAuditLog({
      action: 'SCHEDULE_UPDATED',
      targetId: scheduleId,
      description: `Escala "${title}" foi atualizada`
    });

    // Tentar enviar notificações sobre alterações (não bloquear se falhar)
    try {
      await NotificationService.sendScheduleUpdate(schedule);
      logger.info(`Notificações de atualização enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de atualização:', notificationError);
      logger.warn('Atualização da escala continuou apesar do erro nas notificações');
    }

    return schedule;
  }

  static async deleteSchedule(scheduleId) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        members: { include: { user: true } }
      }
    });

    if (!schedule) {
      throw new Error('Escala não encontrada');
    }

    // Tentar notificar membros sobre cancelamento (não bloquear se falhar)
    try {
      await NotificationService.sendScheduleCancellation(schedule);
      logger.info(`Notificações de cancelamento enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de cancelamento:', notificationError);
      logger.warn('Remoção da escala continuará apesar do erro nas notificações');
    }

    // Deletar escala
    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

    // Criar log de auditoria
    await this.createAuditLog({
      action: 'SCHEDULE_DELETED',
      targetId: scheduleId,
      description: `Escala "${schedule.title}" foi removida`
    });
  }

  static async sendScheduleNotification(scheduleId, type, message) {
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
      throw new Error('Escala não encontrada');
    }

    try {
      await NotificationService.sendCustomNotification(schedule, type, message);
      logger.info(`Notificação customizada enviada para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificação customizada:', notificationError);
      throw new Error('Erro ao enviar notificação: ' + notificationError.message);
    }
  }

  static async getAuditLogs(filters = {}) {
    const { page = 1, limit = 50, action, userId } = filters;

    let whereClause = {};

    if (action) {
      whereClause.action = action;
    }

    if (userId) {
      whereClause.userId = userId;
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true }
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

  static async createAuditLog(data) {
    try {
      const { action, targetId, userId, description } = data;

      await prisma.auditLog.create({
        data: {
          action,
          targetId,
          userId,
          description,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Erro ao criar log de auditoria:', error);
      // Não falhar a operação principal por causa do log
    }
  }

  /**
   * ============================================================================
   * MÉTODOS AUXILIARES PARA TESTES E DEPURAÇÃO
   * ============================================================================
   */

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