// backend/src/services/CampusService.js
const { prisma } = require('../config/database');

class CampusService {
    // Listar todos os campus (público para registro)
    static async getAllCampuses() {
        const campuses = await prisma.campus.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                city: true,
                active: true,
                _count: {
                    select: {
                        users: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                }
            }
        });

        return campuses;
    }

    // Listar campus para admin (com controle total)
    static async getCampusesForAdmin(filters = {}) {
        const { search, active, page = 1, limit = 20 } = filters;
        
        let whereClause = {};

        if (typeof active === 'boolean') {
            whereClause.active = active;
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [campuses, total] = await Promise.all([
            prisma.campus.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            users: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.campus.count({ where: whereClause })
        ]);

        return {
            campuses,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Criar novo campus
    static async createCampus(data) {
        const { name, city } = data;

        // Verificar se já existe campus com mesmo nome
        const existingCampus = await prisma.campus.findUnique({
            where: { name }
        });

        if (existingCampus) {
            throw new Error('Já existe um campus com este nome');
        }

        const campus = await prisma.campus.create({
            data: {
                name: name.trim(),
                city: city?.trim() || null,
                active: true
            }
        });

        return campus;
    }

    // Atualizar campus
    static async updateCampus(campusId, data) {
        const { name, city, active } = data;

        const existingCampus = await prisma.campus.findUnique({
            where: { id: campusId }
        });

        if (!existingCampus) {
            throw new Error('Campus não encontrado');
        }

        // Verificar nome duplicado (exceto o próprio campus)
        if (name && name !== existingCampus.name) {
            const duplicateCampus = await prisma.campus.findUnique({
                where: { name }
            });

            if (duplicateCampus) {
                throw new Error('Já existe um campus com este nome');
            }
        }

        const campus = await prisma.campus.update({
            where: { id: campusId },
            data: {
                ...(name && { name: name.trim() }),
                ...(city !== undefined && { city: city?.trim() || null }),
                ...(typeof active === 'boolean' && { active })
            },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        return campus;
    }

    // Deletar campus (apenas se não tiver usuários)
    static async deleteCampus(campusId) {
        const campus = await prisma.campus.findUnique({
            where: { id: campusId },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        if (!campus) {
            throw new Error('Campus não encontrado');
        }

        if (campus._count.users > 0) {
            throw new Error('Não é possível excluir um campus que possui usuários. Transfira os usuários primeiro.');
        }

        await prisma.campus.delete({
            where: { id: campusId }
        });

        return { message: 'Campus excluído com sucesso' };
    }

    // Obter campus por ID
    static async getCampusById(campusId) {
        const campus = await prisma.campus.findUnique({
            where: { id: campusId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                        role: true
                    },
                    orderBy: { name: 'asc' }
                },
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        if (!campus) {
            throw new Error('Campus não encontrado');
        }

        return campus;
    }

    // Transferir usuário para outro campus
    static async transferUserToCampus(userId, newCampusId) {
        const [user, newCampus] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            prisma.campus.findUnique({ where: { id: newCampusId, active: true } })
        ]);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        if (!newCampus) {
            throw new Error('Campus de destino não encontrado ou inativo');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { campusId: newCampusId },
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

        return updatedUser;
    }

    // Estatísticas do campus
    static async getCampusStats(campusId) {
        const [campus, stats] = await Promise.all([
            prisma.campus.findUnique({
                where: { id: campusId }
            }),
            prisma.user.groupBy({
                by: ['status'],
                where: { campusId },
                _count: true
            })
        ]);

        if (!campus) {
            throw new Error('Campus não encontrado');
        }

        const statsMap = stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
        }, {});

        return {
            campus,
            stats: {
                totalUsers: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
                activeUsers: statsMap.ACTIVE || 0,
                pendingUsers: statsMap.PENDING || 0,
                inactiveUsers: statsMap.INACTIVE || 0,
                rejectedUsers: statsMap.REJECTED || 0
            }
        };
    }
}

module.exports = CampusService;