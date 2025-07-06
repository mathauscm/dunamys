const { prisma } = require('../config/database');

class ScheduleService {
  /**
   * Busca escalas usando filtros flexíveis.
   * Suporta filtros por startDate/endDate (preferencial), upcoming, ou month/year.
   * Outros filtros (como search/status) podem ser passados e tratados no controller/router.
   * Inclui funções dos membros na escala.
   */
  static async getSchedules(filters = {}) {
    const { month, year, upcoming, startDate, endDate } = filters;
    let dateFilter = {};

    if (startDate && endDate) {
      // Filtro por intervalo de datas explícito (preferencial, usado pelo frontend atual)
      dateFilter = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      };
    } else if (upcoming) {
      // Escalas futuras a partir de hoje
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dateFilter = { date: { gte: today } };
    } else if (month && year) {
      // Filtro tradicional por mês/ano
      const start = new Date(`${year}-${String(month).padStart(2, '0')}-01T00:00:00`);
      const endDay = new Date(year, month, 0).getDate();
      const end = new Date(`${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}T23:59:59`);
      dateFilter = {
        date: {
          gte: start,
          lte: end
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
            },
            // NOVA INCLUSÃO: Incluir funções do membro na escala
            functions: {
              include: {
                function: {
                  include: {
                    group: true
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
            },
            functions: {
              include: {
                function: {
                  include: {
                    group: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return schedule;
  }
}

module.exports = ScheduleService;