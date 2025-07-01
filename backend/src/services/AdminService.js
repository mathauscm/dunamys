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
          campusId: true,
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

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AdminService.getMembers - Membros retornados:');
      members.forEach(member => {
        console.log(`  ${member.name}: campusId=${member.campusId}, campus=${member.campus?.name}`);
      });
    }

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

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { status: 'ACTIVE' }
      });

      await this.createAuditLog({
        action: 'MEMBER_APPROVED',
        targetId: memberId,
        description: `Membro ${member.name} foi aprovado`
      });

      try {
        await NotificationService.sendMemberApproval(member);
        logger.info(`Notificação de aprovação enviada para ${member.email}`);
      } catch (notificationError) {
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

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { status: 'REJECTED' }
      });

      await this.createAuditLog({
        action: 'MEMBER_REJECTED',
        targetId: memberId,
        description: `Membro ${member.name} foi rejeitado. Motivo: ${reason || 'Não informado'}`
      });

      try {
        await NotificationService.sendMemberRejection(member, reason);
        logger.info(`Notificação de rejeição enviada para ${member.email}`);
      } catch (notificationError) {
        logger.error(`Erro ao enviar notificação de rejeição para ${member.email}:`, notificationError);
        logger.warn('Rejeição do membro continuou apesar do erro na notificação');
      }

      return updatedMember;

    } catch (error) {
      logger.error(`Erro ao rejeitar membro ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * NOVO MÉTODO: Excluir membro
   * Remove completamente um membro do sistema
   * Corrigido para usar scheduleMember ao invés de scheduleUser
   */
  static async deleteMember(memberId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' },
        include: {
          campus: {
            select: {
              id: true,
              name: true
            }
          },
          ministry: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              schedules: true,
              unavailabilities: true
            }
          }
        }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      // Executar exclusão em transação usando o nome correto do modelo
      const result = await prisma.$transaction(async (tx) => {
        await tx.scheduleMember.deleteMany({
          where: { userId: memberId }
        });

        await tx.unavailability.deleteMany({
          where: { userId: memberId }
        });

        await tx.notification.deleteMany({
          where: { userId: memberId }
        });

        await tx.auditLog.deleteMany({
          where: {
            OR: [
              { userId: memberId },
              { targetId: memberId }
            ]
          }
        });

        const deletedUser = await tx.user.delete({
          where: { id: memberId }
        });

        return deletedUser;
      });

      await this.createAuditLog({
        action: 'MEMBER_DELETED',
        targetId: memberId,
        description: `Membro ${member.name} foi excluído do sistema. Campus: ${member.campus?.name || 'N/A'}, Ministério: ${member.ministry?.name || 'N/A'}`
      });

      logger.info(`Membro excluído: ${member.name} (ID: ${memberId})`);

      return {
        success: true,
        message: 'Membro excluído com sucesso',
        deletedMember: {
          id: member.id,
          name: member.name,
          email: member.email
        }
      };

    } catch (error) {
      logger.error(`Erro ao excluir membro ${memberId}:`, error);
      throw error;
    }
  }

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

  /**
   * Cria uma escala (SCHEDULE) com lógica de associação de funções aos membros
   * Atualizado para incluir memberFunctions e atribuição de funções a scheduleMember
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
      const FunctionService = require('./FunctionService');
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

    await this.createAuditLog({
      action: 'SCHEDULE_CREATED',
      targetId: schedule.id,
      userId: createdBy,
      description: `Escala "${title}" criada para ${date}`
    });

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
   * Atualizar escala (schedule) com lógica de funções por membro
   */
  static async updateSchedule(scheduleId, data) {
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

    // Validações existentes...
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

    let dateObj;
    if (date && typeof date === 'string' && date.length === 10) {
      dateObj = new Date(date + 'T00:00:00');
    } else if (date) {
      dateObj = new Date(date);
    }

    // Lógica para atualização de membros e funções
    const updateData = {
      title,
      description,
      date: date ? dateObj : undefined,
      time,
      location
    };

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

    // NOVA PARTE: Atualizar funções dos membros
    if (memberFunctions && Object.keys(memberFunctions).length > 0) {
      const FunctionService = require('./FunctionService');
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

    // Log de auditoria existente...
    await this.createAuditLog({
      action: 'SCHEDULE_UPDATED',
      targetId: scheduleId,
      description: `Escala "${title}" foi atualizada`
    });

    // Notificações existentes...
    try {
      await NotificationService.sendScheduleUpdate(schedule);
      logger.info(`Notificações de atualização enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de atualização:', notificationError);
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

    try {
      await NotificationService.sendScheduleCancellation(schedule);
      logger.info(`Notificações de cancelamento enviadas para ${schedule.members.length} membros`);
    } catch (notificationError) {
      logger.error('Erro ao enviar notificações de cancelamento:', notificationError);
      logger.warn('Remoção da escala continuará apesar do erro nas notificações');
    }

    await prisma.schedule.delete({
      where: { id: scheduleId }
    });

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
    }
  }

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