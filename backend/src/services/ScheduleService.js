const { prisma } = require('../config/database');

class ScheduleService {
  static async getSchedules(filters = {}) {
    const { month, year, upcoming } = filters;
    let dateFilter = {};

    if (upcoming) {
      // Hoje, início do dia local
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { date: { gte: today } };
    } else if (month && year) {
      // Data inicial: primeiro dia do mês, 00:00
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
      where: dateFilter,
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

  static async getScheduleById(scheduleId) {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, email: true }
            }
          }
        }
      }
    });

    return schedule;
  }
}

module.exports = ScheduleService;