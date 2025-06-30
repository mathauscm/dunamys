const { prisma } = require('../config/database');

class MinistryService {
    // Listar todos os ministérios (público para formulários)
    static async getAllMinistries() {
        const ministries = await prisma.ministry.findMany({
            where: { active: true },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                active: true
            }
        });

        return ministries;
    }

    // Listar ministérios para admin (com controle total)
    static async getMinistriesForAdmin(filters = {}) {
        const { search, active, page = 1, limit = 20 } = filters;
        
        let whereClause = {};

        if (typeof active === 'boolean') {
            whereClause.active = active;
        }

        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [ministries, total] = await Promise.all([
            prisma.ministry.findMany({
                where: whereClause,
                include: {
                    _count: {
                        select: {
                            users: true
                        }
                    },
                    users: {
                        take: 3,
                        select: {
                            id: true,
                            name: true,
                            status: true,
                            role: true
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { name: 'asc' }
            }),
            prisma.ministry.count({ where: whereClause })
        ]);

        return {
            ministries,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    // Criar novo ministério
    static async createMinistry(data) {
        const { name, description } = data;

        // Verificar se já existe ministério com mesmo nome
        const existingMinistry = await prisma.ministry.findUnique({
            where: { name }
        });

        if (existingMinistry) {
            throw new Error('Já existe um ministério com este nome');
        }

        const ministry = await prisma.ministry.create({
            data: {
                name: name.trim(),
                description: description?.trim() || null,
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

        return ministry;
    }

    // Atualizar ministério
    static async updateMinistry(ministryId, data) {
        const { name, description, active } = data;

        const existingMinistry = await prisma.ministry.findUnique({
            where: { id: ministryId }
        });

        if (!existingMinistry) {
            throw new Error('Ministério não encontrado');
        }

        // Verificar nome duplicado (exceto o próprio ministério)
        if (name && name !== existingMinistry.name) {
            const duplicateMinistry = await prisma.ministry.findUnique({
                where: { name }
            });

            if (duplicateMinistry) {
                throw new Error('Já existe um ministério com este nome');
            }
        }

        const ministry = await prisma.ministry.update({
            where: { id: ministryId },
            data: {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description: description?.trim() || null }),
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

        return ministry;
    }

    // Deletar ministério (apenas se não tiver usuários)
    static async deleteMinistry(ministryId) {
        const ministry = await prisma.ministry.findUnique({
            where: { id: ministryId },
            include: {
                _count: {
                    select: {
                        users: true
                    }
                }
            }
        });

        if (!ministry) {
            throw new Error('Ministério não encontrado');
        }

        if (ministry._count.users > 0) {
            throw new Error('Não é possível excluir um ministério que possui usuários. Transfira os usuários primeiro.');
        }

        await prisma.ministry.delete({
            where: { id: ministryId }
        });

        return { message: 'Ministério excluído com sucesso' };
    }

    // Obter ministério por ID
    static async getMinistryById(ministryId) {
        const ministry = await prisma.ministry.findUnique({
            where: { id: ministryId },
            include: {
                users: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        status: true,
                        role: true,
                        campus: {
                            select: {
                                id: true,
                                name: true,
                                city: true
                            }
                        }
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

        if (!ministry) {
            throw new Error('Ministério não encontrado');
        }

        return ministry;
    }

    // Transferir usuário para outro ministério
    static async transferUserToMinistry(userId, newMinistryId) {
        const [user, newMinistry] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId } }),
            newMinistryId ? prisma.ministry.findUnique({ where: { id: newMinistryId, active: true } }) : Promise.resolve(null)
        ]);

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        if (newMinistryId && !newMinistry) {
            throw new Error('Ministério de destino não encontrado ou inativo');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { ministryId: newMinistryId },
            include: {
                ministry: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
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

    // Estatísticas do ministério
    static async getMinistryStats(ministryId) {
        const [ministry, stats] = await Promise.all([
            prisma.ministry.findUnique({
                where: { id: ministryId }
            }),
            prisma.user.groupBy({
                by: ['status'],
                where: { ministryId },
                _count: true
            })
        ]);

        if (!ministry) {
            throw new Error('Ministério não encontrado');
        }

        const statsMap = stats.reduce((acc, stat) => {
            acc[stat.status] = stat._count;
            return acc;
        }, {});

        return {
            ministry,
            stats: {
                totalUsers: Object.values(statsMap).reduce((sum, count) => sum + count, 0),
                activeUsers: statsMap.ACTIVE || 0,
                pendingUsers: statsMap.PENDING || 0,
                inactiveUsers: statsMap.INACTIVE || 0,
                rejectedUsers: statsMap.REJECTED || 0
            }
        };
    }

    // Atualizar ministério de um usuário (usado pelo admin ao gerenciar membros)
    static async updateUserMinistry(userId, ministryId) {
        // Verificar se o usuário existe
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) {
            throw new Error('Usuário não encontrado');
        }

        // Se ministryId for null, remove o ministério do usuário
        if (ministryId === null) {
            const updatedUser = await prisma.user.update({
                where: { id: userId },
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

            return updatedUser;
        }

        // Verificar se o ministério existe e está ativo
        const ministry = await prisma.ministry.findUnique({
            where: { id: ministryId, active: true }
        });

        if (!ministry) {
            throw new Error('Ministério não encontrado ou inativo');
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { ministryId },
            include: {
                ministry: {
                    select: {
                        id: true,
                        name: true,
                        description: true
                    }
                },
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
}

module.exports = MinistryService;