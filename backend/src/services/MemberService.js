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
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
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

    // Verificar se já existe indisponibilidade no período
    const existing = await prisma.unavailability.findFirst({
      where: {
        userId,
        OR: [
          {
            startDate: { lte: new Date(endDate) },
            endDate: { gte: new Date(startDate) }
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
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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