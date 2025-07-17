const { prisma } = require('../config/database');
const NotificationService = require('./NotificationService');

class MemberService {
  static async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        lastLogin: true,
        functionGroupAdmins: {
          include: {
            functionGroup: {
              select: {
                id: true,
                name: true,
                description: true,
                active: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Determinar o tipo de usuário
    const adminGroups = user.functionGroupAdmins
      .filter(admin => admin.functionGroup.active)
      .map(admin => admin.functionGroup.id);
    
    const userType = user.role === 'ADMIN' ? 'admin' : (adminGroups.length > 0 ? 'groupAdmin' : 'member');

    return {
      ...user,
      userType,
      adminGroups,
      functionGroupAdmins: undefined // Remove o campo interno
    };
  }

  static async updateProfile(userId, data) {
    const { name, phone } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: { name, phone },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true
      }
    });

    return user;
  }

  static async getUserSchedules(userId, filters = {}) {
    const { month, year } = filters;

    console.log('MemberService.getUserSchedules chamado com:', { userId, month, year });

    let dateFilter = {};
    
    if (month && year) {
      // CORREÇÃO: Criar filtro de data mais preciso
      const startDate = new Date(year, month - 1, 1); // month - 1 porque Date usa 0-11
      const endDate = new Date(year, month, 0); // Último dia do mês
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      
      console.log('Filtro de data:', { startDate, endDate });
      
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    const schedules = await prisma.schedule.findMany({
      where: {
        ...dateFilter,
        members: {
          some: {
            userId: userId
          }
        }
      },
      include: {
        members: {
          where: {
            userId: userId // Filtrar apenas o membro atual
          },
          include: {
            user: {
              select: { 
                id: true, 
                name: true, 
                phone: true,
                ministry: {
                  select: {
                    id: true,
                    name: true,
                    description: true
                  }
                }
              }
            },
            functions: {
              include: {
                function: {
                  include: {
                    group: {
                      select: {
                        id: true,
                        name: true,
                        description: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    console.log(`Encontradas ${schedules.length} escalas para o usuário ${userId} no mês ${month}/${year}`);
    
    // Processar e formatar dados para incluir informações organizadas
    const formattedSchedules = schedules.map(schedule => {
      const userMember = schedule.members[0]; // Apenas o membro atual
      
      if (!userMember) {
        return schedule;
      }

      // Extrair informações do ministério
      const ministry = userMember.user.ministry;
      
      // Extrair funções e equipes (grupos de função)
      const functions = userMember.functions.map(func => ({
        id: func.function.id,
        name: func.function.name,
        description: func.function.description,
        icon: func.function.icon,
        group: func.function.group
      }));
      
      // Combinar nomes das funções
      const functionNames = functions.map(f => f.name).join(', ');

      return {
        ...schedule,
        // Informações formatadas para o membro
        memberInfo: {
          ministry: ministry ? {
            id: ministry.id,
            name: ministry.name,
            description: ministry.description
          } : null,
          functions: functions,
          functionNames: functionNames || 'Sem função específica',
          hasMultipleFunctions: functions.length > 1,
          confirmationStatus: userMember.confirmationStatus,
          confirmedAt: userMember.confirmedAt,
          scheduleMemberId: userMember.id
        }
      };
    });
    
    // Log detalhado para debug
    formattedSchedules.forEach(schedule => {
      console.log(`Escala: ${schedule.title} - Data: ${schedule.date} - Ministério: ${schedule.memberInfo?.ministry?.name || 'N/A'} - Funções: ${schedule.memberInfo?.functionNames || 'N/A'}`);
    });

    return formattedSchedules;
  }

  static async setUnavailability(userId, data) {
    const { startDate, endDate, reason } = data;

    // CORREÇÃO: Melhor tratamento de datas
    let startDateObj, endDateObj;

    try {
      // Se a data vier como string YYYY-MM-DD, converter para DateTime
      if (typeof startDate === 'string' && startDate.length === 10) {
        startDateObj = new Date(startDate + 'T00:00:00.000Z');
      } else {
        startDateObj = new Date(startDate);
      }

      if (typeof endDate === 'string' && endDate.length === 10) {
        endDateObj = new Date(endDate + 'T23:59:59.999Z');
      } else {
        endDateObj = new Date(endDate);
      }

      // Validar se as datas são válidas
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        throw new Error('Datas inválidas fornecidas');
      }

      // Verificar se a data de início não é posterior à data de fim
      if (startDateObj > endDateObj) {
        throw new Error('Data de início não pode ser posterior à data de fim');
      }

    } catch (error) {
      console.error('Erro ao processar datas:', error);
      throw new Error('Formato de data inválido');
    }

    // Verificar se já existe indisponibilidade no período
    const existing = await prisma.unavailability.findFirst({
      where: {
        userId,
        OR: [
          {
            startDate: { lte: endDateObj },
            endDate: { gte: startDateObj }
          }
        ]
      }
    });

    if (existing) {
      throw new Error('Já existe indisponibilidade registrada neste período');
    }

    const unavailability = await prisma.unavailability.create({
      data: {
        userId,
        startDate: startDateObj,
        endDate: endDateObj,
        reason: reason || null
      }
    });

    return unavailability;
  }

  static async getUserUnavailabilities(userId) {
    const unavailabilities = await prisma.unavailability.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' }
    });

    return unavailabilities;
  }

  static async removeUnavailability(userId, unavailabilityId) {
    const unavailability = await prisma.unavailability.findFirst({
      where: {
        id: unavailabilityId,
        userId
      }
    });

    if (!unavailability) {
      throw new Error('Indisponibilidade não encontrada');
    }

    await prisma.unavailability.delete({
      where: { id: unavailabilityId }
    });
  }

  static async confirmSchedule(userId, scheduleId) {
    // Verificar se o usuário está realmente escalado
    const scheduleMember = await prisma.scheduleMember.findFirst({
      where: {
        userId,
        scheduleId
      }
    });

    if (!scheduleMember) {
      throw new Error('Usuário não está escalado para esta escala');
    }

    // Verificar se a escala não passou ainda
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { date: true, time: true }
    });

    if (!schedule) {
      throw new Error('Escala não encontrada');
    }

    const now = new Date();
    const scheduleDate = new Date(schedule.date);
    
    if (scheduleDate < now) {
      throw new Error('Não é possível confirmar uma escala que já passou');
    }

    // Atualizar o status de confirmação
    const updated = await prisma.scheduleMember.update({
      where: {
        id: scheduleMember.id
      },
      data: {
        confirmationStatus: 'CONFIRMED',
        confirmedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            location: true
          }
        }
      }
    });

    // Enviar notificação de confirmação para administradores de forma assíncrona (não bloqueante)
    setImmediate(async () => {
      try {
        await NotificationService.sendScheduleConfirmation(userId, scheduleId, 'CONFIRMED');
      } catch (error) {
        console.error('Erro ao enviar notificação de confirmação:', error);
      }
    });

    return updated;
  }

  static async markUnavailableForSchedule(userId, scheduleId) {
    // Verificar se o usuário está realmente escalado
    const scheduleMember = await prisma.scheduleMember.findFirst({
      where: {
        userId,
        scheduleId
      }
    });

    if (!scheduleMember) {
      throw new Error('Usuário não está escalado para esta escala');
    }

    // Verificar se a escala não passou ainda
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      select: { date: true, time: true }
    });

    if (!schedule) {
      throw new Error('Escala não encontrada');
    }

    const now = new Date();
    const scheduleDate = new Date(schedule.date);
    
    if (scheduleDate < now) {
      throw new Error('Não é possível marcar indisponibilidade para uma escala que já passou');
    }

    // Atualizar o status de confirmação
    const updated = await prisma.scheduleMember.update({
      where: {
        id: scheduleMember.id
      },
      data: {
        confirmationStatus: 'UNAVAILABLE',
        confirmedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        schedule: {
          select: {
            id: true,
            title: true,
            date: true,
            time: true,
            location: true
          }
        }
      }
    });

    // Enviar notificação de indisponibilidade para administradores de forma assíncrona (não bloqueante)
    setImmediate(async () => {
      try {
        await NotificationService.sendScheduleConfirmation(userId, scheduleId, 'UNAVAILABLE');
      } catch (error) {
        console.error('Erro ao enviar notificação de indisponibilidade:', error);
      }
    });

    return updated;
  }
}

module.exports = MemberService;