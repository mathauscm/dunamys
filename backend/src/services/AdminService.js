const { prisma } = require('../config/database');
const NotificationService = require('./NotificationService');

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
    const member = await prisma.user.findUnique({
      where: { id: memberId, role: 'MEMBER' }
    });

    if (!member) {
      throw new Error('Membro não encontrado');
    }

    if (member.status === 'ACTIVE') {
      throw new Error('Membro já está ativo');
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { status: 'ACTIVE' }
    });

    // Criar log de auditoria
    await this.createAuditLog({
      action: 'MEMBER_APPROVED',
      targetId: memberId,
      description: `Membro ${member.name} foi aprovado`
    });

    // Enviar notificação de aprovação
    await NotificationService.sendMemberApproval(member);
  }

  static async rejectMember(memberId, reason) {
    const member = await prisma.user.findUnique({
      where: { id: memberId, role: 'MEMBER' }
    });

    if (!member) {
      throw new Error('Membro não encontrado');
    }

    await prisma.user.update({
      where: { id: memberId },
      data: { status: 'REJECTED' }
    });

    // Criar log de auditoria
    await this.createAuditLog({
      action: 'MEMBER_REJECTED',
      targetId: memberId,
      description: `Membro ${member.name} foi rejeitado. Motivo: ${reason || 'Não informado'}`
    });

    // Enviar notificação de rejeição
    await NotificationService.sendMemberRejection(member, reason);
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

    // Enviar notificações para os membros escalados
    await NotificationService.sendScheduleAssignment(schedule);

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

    // Enviar notificações sobre alterações
    await NotificationService.sendScheduleUpdate(schedule);

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

    // Notificar membros sobre cancelamento
    await NotificationService.sendScheduleCancellation(schedule);

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

    await NotificationService.sendCustomNotification(schedule, type, message);
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
  }
}

module.exports = AdminService;