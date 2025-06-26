const { prisma } = require('../config/database');

class ScheduleService {
  static async getSchedules(filters = {}) {
    const { month, year, upcoming } = filters;
    
    let dateFilter = {};
    
    if (upcoming) {
      dateFilter = {
        date: { gte: new Date() }
      };
    } else if (month && year) {
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

