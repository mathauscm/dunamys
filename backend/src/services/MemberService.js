const { prisma } = require('../config/database');

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
        lastLogin: true
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
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

    let dateFilter = {};
    if (month && year) {
      // Início do mês, 00:00:00
      const startDate = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00`);
      // Último dia do mês, 23:59:59
      const endDay = new Date(year, month, 0).getDate();
      const endDate = new Date(`${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}T23:59:59`);
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
          include: {
            user: {
              select: { id: true, name: true, phone: true }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });

    return schedules;
  }

  static async setUnavailability(userId, data) {
    const { startDate, endDate, reason } = data;

    // Garante que datas sejam ISO completas para DateTime
    const startDateISO = startDate.length === 10 ? startDate + 'T00:00:00' : startDate;
    const endDateISO = endDate.length === 10 ? endDate + 'T23:59:59' : endDate;

    // Verificar se já existe indisponibilidade no período
    const existing = await prisma.unavailability.findFirst({
      where: {
        userId,
        OR: [
          {
            startDate: { lte: new Date(endDateISO) },
            endDate: { gte: new Date(startDateISO) }
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
        startDate: new Date(startDateISO),
        endDate: new Date(endDateISO),
        reason
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
}

module.exports = MemberService;