const { prisma } = require('../config/database');

class FunctionGroupAdminService {
  static async assignUserToGroup(userId, functionGroupId) {
    // Verificar se o usuário existe e está ativo
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        status: 'ACTIVE'
      }
    });

    if (!user) {
      throw new Error('Usuário não encontrado ou não está ativo');
    }

    // Verificar se o grupo existe e está ativo
    const group = await prisma.functionGroup.findFirst({
      where: {
        id: functionGroupId,
        active: true
      }
    });

    if (!group) {
      throw new Error('Grupo de funções não encontrado ou não está ativo');
    }

    // Verificar se já não é admin deste grupo
    const existingAdmin = await prisma.functionGroupAdmin.findUnique({
      where: {
        userId_functionGroupId: {
          userId,
          functionGroupId
        }
      }
    });

    if (existingAdmin) {
      throw new Error('Usuário já é administrador deste grupo');
    }

    // Criar a vinculação
    const admin = await prisma.functionGroupAdmin.create({
      data: {
        userId,
        functionGroupId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        functionGroup: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    return admin;
  }

  static async removeUserFromGroup(userId, functionGroupId) {
    const admin = await prisma.functionGroupAdmin.findUnique({
      where: {
        userId_functionGroupId: {
          userId,
          functionGroupId
        }
      }
    });

    if (!admin) {
      throw new Error('Usuário não é administrador deste grupo');
    }

    await prisma.functionGroupAdmin.delete({
      where: {
        userId_functionGroupId: {
          userId,
          functionGroupId
        }
      }
    });

    return true;
  }

  static async getUserGroups(userId) {
    const userGroups = await prisma.functionGroupAdmin.findMany({
      where: { userId },
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
    });

    return userGroups.map(admin => admin.functionGroup);
  }

  // NOVO: Método para pegar os ministérios associados aos grupos do admin (por NOME)
  static async getUserMinistries(userId) {
    const userGroups = await this.getUserGroups(userId);

    // Pegar os nomes dos grupos que o admin gerencia
    const groupNames = userGroups.map(group => group.name);

    if (groupNames.length === 0) {
      return [];
    }

    // Buscar ministérios com os MESMOS NOMES dos grupos
    const ministries = await prisma.ministry.findMany({
      where: {
        name: {
          in: groupNames
        },
        active: true
      },
      select: {
        id: true,
        name: true,
        description: true
      }
    });

    return ministries;
  }

  static async getGroupAdmins(functionGroupId) {
    const admins = await prisma.functionGroupAdmin.findMany({
      where: { functionGroupId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            campus: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    return admins.map(admin => admin.user);
  }

  static async getAllGroupAdmins() {
    const admins = await prisma.functionGroupAdmin.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            status: true,
            campus: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        functionGroup: {
          select: {
            id: true,
            name: true,
            description: true,
            active: true
          }
        }
      }
    });

    return admins;
  }

  static async getFunctionsForUserGroups(userId) {
    console.log('🔍 [getFunctionsForUserGroups] userId:', userId);

    // Buscar os grupos que o usuário administra
    const userGroups = await this.getUserGroups(userId);
    console.log('🔍 [getFunctionsForUserGroups] userGroups:', userGroups.map(g => ({ id: g.id, name: g.name })));

    const groupIds = userGroups.map(group => group.id);
    console.log('🔍 [getFunctionsForUserGroups] groupIds:', groupIds);

    if (groupIds.length === 0) {
      console.log('⚠️ [getFunctionsForUserGroups] Nenhum grupo encontrado para o usuário');
      return [];
    }

    // Buscar todas as funções dos grupos que o usuário administra
    const functions = await prisma.function.findMany({
      where: {
        groupId: {
          in: groupIds
        },
        active: true
      },
      include: {
        group: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { group: { name: 'asc' } },
        { name: 'asc' }
      ]
    });

    console.log('🔍 [getFunctionsForUserGroups] functions found:', functions.length);
    console.log('🔍 [getFunctionsForUserGroups] functions:', functions.map(f => ({ id: f.id, name: f.name, group: f.group.name })));

    return functions;
  }
}

module.exports = FunctionGroupAdminService;