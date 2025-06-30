const { prisma } = require('../config/database');

class CampusService {
    // Listar todos os campus (público para registro) - CORRIGIDO
    static async getAllCampuses() {
        const campuses = await prisma.campus.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                city: true,
                active: true
                // REMOVIDO: _count que estava causando o problema
            }
        });

        return campuses;
    }

    // Listar campus para admin (com controle total) - CORRIGIDO
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

        // CORREÇÃO: A consulta estava retornando dados incorretos
        // Vamos fazer duas consultas separadas para garantir que a contagem funcione
        const [campuses, total] = await Promise.all([
            prisma.campus.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            users: true
                        }
                    },
                    // ADICIONADO: Incluir alguns usuários para debug
                    users: {
                        take: 3,
                        select: {
                            id: true,
                            name: true,
                            status: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.campus.count({ where: whereClause })
        ]);

        // ADICIONADO: Log para debug
        console.log('📊 Campus encontrados:', campuses.length);
        campuses.forEach(campus => {
            console.log(`Campus: ${campus.name} - Contagem: ${campus._count.users} - Usuários: ${campus.users.length}`);
        });

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
            },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        console.log('✅ Campus criado:', campus.name);
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

        console.log('✅ Campus atualizado:', campus.name, 'Contagem:', campus._count.users);
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

        console.log('✅ Campus excluído:', campus.name);
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

        console.log('📋 Detalhes do campus:', campus.name, 'Total users:', campus.users.length);
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

        console.log('🔄 Usuário transferido:', user.name, 'para campus:', newCampus.name);
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

        const result = {
            campus,
            stats: {
                totalUsers: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
                activeUsers: statsMap.ACTIVE || 0,
                pendingUsers: statsMap.PENDING || 0,
                inactiveUsers: statsMap.INACTIVE || 0,
                rejectedUsers: statsMap.REJECTED || 0
            }
        };

        console.log('📊 Stats do campus:', campus.name, result.stats);
        return result;
    }

    // NOVO: Método para forçar recalcular contagem de usuários
    static async refreshCampusStats() {
        console.log('🔄 Atualizando estatísticas de campus...');
        
        const campuses = await prisma.campus.findMany({
            include: {
                _count: {
                    select: {
                        users: true
                    }
                },
                users: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
            }
        });

        console.log('📊 Estatísticas atualizadas:');
        campuses.forEach(campus => {
            console.log(`${campus.name}: ${campus._count.users} usuários (${campus.users.length} encontrados)`);
        });

        return campuses;
    }
}

module.exports = CampusService;