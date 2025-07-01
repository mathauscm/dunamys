const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class FunctionService {
  
  // ==================== GRUPOS DE FUNÇÕES ====================
  
  static async getFunctionGroups(includeInactive = false) {
    const where = includeInactive ? {} : { active: true };
    
    return await prisma.functionGroup.findMany({
      where,
      include: {
        functions: {
          where: includeInactive ? {} : { active: true },
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  static async createFunctionGroup(data) {
    const { name, description } = data;

    // Verificar se já existe um grupo com este nome
    const existingGroup = await prisma.functionGroup.findUnique({
      where: { name }
    });

    if (existingGroup) {
      throw new Error('Já existe um grupo de funções com este nome');
    }

    return await prisma.functionGroup.create({
      data: {
        name,
        description,
        active: true
      }
    });
  }

  static async updateFunctionGroup(groupId, data) {
    const { name, description, active } = data;

    const existingGroup = await prisma.functionGroup.findUnique({
      where: { id: groupId }
    });

    if (!existingGroup) {
      throw new Error('Grupo de funções não encontrado');
    }

    // Se mudando o nome, verificar duplicação
    if (name && name !== existingGroup.name) {
      const nameExists = await prisma.functionGroup.findUnique({
        where: { name }
      });

      if (nameExists) {
        throw new Error('Já existe um grupo com este nome');
      }
    }

    return await prisma.functionGroup.update({
      where: { id: groupId },
      data: {
        name,
        description,
        active
      }
    });
  }

  static async deleteFunctionGroup(groupId) {
    const group = await prisma.functionGroup.findUnique({
      where: { id: groupId },
      include: {
        functions: {
          include: {
            scheduleMemberFunctions: true
          }
        }
      }
    });

    if (!group) {
      throw new Error('Grupo de funções não encontrado');
    }

    // Verificar se há funções sendo usadas em escalas
    const functionsInUse = group.functions.some(func => 
      func.scheduleMemberFunctions.length > 0
    );

    if (functionsInUse) {
      throw new Error('Não é possível excluir o grupo pois existem funções sendo usadas em escalas');
    }

    return await prisma.functionGroup.delete({
      where: { id: groupId }
    });
  }

  // ==================== FUNÇÕES ====================

  static async getFunctions(groupId = null, includeInactive = false) {
    const where = {
      ...(groupId && { groupId }),
      ...(includeInactive ? {} : { active: true })
    };

    return await prisma.function.findMany({
      where,
      include: {
        group: true
      },
      orderBy: [
        { group: { name: 'asc' } },
        { name: 'asc' }
      ]
    });
  }

  static async createFunction(data) {
    const { name, description, icon, groupId } = data;

    // Verificar se o grupo existe
    const group = await prisma.functionGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new Error('Grupo de funções não encontrado');
    }

    // Verificar se já existe uma função com este nome no grupo
    const existingFunction = await prisma.function.findUnique({
      where: { 
        name_groupId: { name, groupId } 
      }
    });

    if (existingFunction) {
      throw new Error('Já existe uma função com este nome neste grupo');
    }

    return await prisma.function.create({
      data: {
        name,
        description,
        icon,
        groupId,
        active: true
      },
      include: {
        group: true
      }
    });
  }

  static async updateFunction(functionId, data) {
    const { name, description, icon, groupId, active } = data;

    const existingFunction = await prisma.function.findUnique({
      where: { id: functionId }
    });

    if (!existingFunction) {
      throw new Error('Função não encontrada');
    }

    // Se mudando nome ou grupo, verificar duplicação
    if ((name && name !== existingFunction.name) || 
        (groupId && groupId !== existingFunction.groupId)) {
      
      const finalGroupId = groupId || existingFunction.groupId;
      const finalName = name || existingFunction.name;

      const nameExists = await prisma.function.findUnique({
        where: { 
          name_groupId: { 
            name: finalName, 
            groupId: finalGroupId 
          } 
        }
      });

      if (nameExists && nameExists.id !== functionId) {
        throw new Error('Já existe uma função com este nome neste grupo');
      }
    }

    return await prisma.function.update({
      where: { id: functionId },
      data: {
        name,
        description,
        icon,
        groupId,
        active
      },
      include: {
        group: true
      }
    });
  }

  static async deleteFunction(functionId) {
    const func = await prisma.function.findUnique({
      where: { id: functionId },
      include: {
        scheduleMemberFunctions: true
      }
    });

    if (!func) {
      throw new Error('Função não encontrada');
    }

    // Verificar se a função está sendo usada em escalas
    if (func.scheduleMemberFunctions.length > 0) {
      throw new Error('Não é possível excluir a função pois ela está sendo usada em escalas');
    }

    return await prisma.function.delete({
      where: { id: functionId }
    });
  }

  // ==================== FUNÇÕES PARA ESCALAS ====================

  static async assignFunctionToScheduleMember(scheduleMemberId, functionIds) {
    // Remover funções existentes do membro na escala
    await prisma.scheduleMemberFunction.deleteMany({
      where: { scheduleMemberId }
    });

    // Adicionar novas funções
    if (functionIds && functionIds.length > 0) {
      const data = functionIds.map(functionId => ({
        scheduleMemberId,
        functionId
      }));

      return await prisma.scheduleMemberFunction.createMany({
        data
      });
    }

    return null;
  }

  static async getScheduleMemberFunctions(scheduleMemberId) {
    return await prisma.scheduleMemberFunction.findMany({
      where: { scheduleMemberId },
      include: {
        function: {
          include: {
            group: true
          }
        }
      }
    });
  }
}

module.exports = FunctionService;