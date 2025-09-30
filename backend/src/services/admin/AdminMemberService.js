const { prisma } = require('../../config/database');
const NotificationService = require('../NotificationService');
const logger = require('../../utils/logger');
const { formatPhone } = require('../../utils/validators/phoneValidator');

/**
 * Serviço de administração de membros
 * Responsável por todas as operações de gestão de membros pelos administradores
 */
class AdminMemberService {
  /**
   * Lista membros com filtros e paginação
   * @param {Object} filters - Filtros de busca
   * @returns {Object} - Lista de membros e informações de paginação
   */
  static async getMembers(filters = {}) {
    const { status, search, page = 1, limit = 20, campusId, ministryId } = filters;

    let whereClause = { role: 'MEMBER' };

    if (status) {
      whereClause.status = status;
    }

    if (campusId) {
      whereClause.campusId = parseInt(campusId);
    }

    if (ministryId) {
      whereClause.ministryId = parseInt(ministryId);
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [members, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          status: true,
          createdAt: true,
          lastLogin: true,
          campusId: true,
          campus: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          ministry: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          _count: {
            select: {
              schedules: true
            }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Formatizar telefones para exibição
    const membersWithFormattedPhone = members.map(member => ({
      ...member,
      phoneFormatted: member.phone ? formatPhone(member.phone) : null
    }));

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AdminMemberService.getMembers - Membros retornados:');
      membersWithFormattedPhone.forEach(member => {
        console.log(`  ${member.name}: campusId=${member.campusId}, campus=${member.campus?.name}`);
      });
    }

    return {
      members: membersWithFormattedPhone,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Aprova um membro pendente
   * @param {number} memberId - ID do membro
   * @param {number} adminId - ID do administrador
   * @returns {Object} - Membro atualizado
   */
  static async approveMember(memberId, adminId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      if (member.status === 'ACTIVE') {
        throw new Error('Membro já está ativo');
      }

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { status: 'ACTIVE' }
      });

      // Log de auditoria
      await this.createMemberAuditLog({
        action: 'MEMBER_APPROVED',
        targetId: memberId,
        userId: adminId,
        description: `Membro ${member.name} foi aprovado`
      });

      // Enviar notificação
      try {
        await NotificationService.sendMemberApproval(member);
        logger.info(`Notificação de aprovação enviada para ${member.email}`);
      } catch (notificationError) {
        logger.error(`Erro ao enviar notificação de aprovação para ${member.email}:`, notificationError);
        logger.warn('Aprovação do membro continuou apesar do erro na notificação');
      }

      return {
        ...updatedMember,
        phoneFormatted: updatedMember.phone ? formatPhone(updatedMember.phone) : null
      };

    } catch (error) {
      logger.error(`Erro ao aprovar membro ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Rejeita um membro pendente
   * @param {number} memberId - ID do membro
   * @param {string} reason - Motivo da rejeição
   * @param {number} adminId - ID do administrador
   * @returns {Object} - Membro atualizado
   */
  static async rejectMember(memberId, reason, adminId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { status: 'REJECTED' }
      });

      // Log de auditoria
      await this.createMemberAuditLog({
        action: 'MEMBER_REJECTED',
        targetId: memberId,
        userId: adminId,
        description: `Membro ${member.name} foi rejeitado. Motivo: ${reason || 'Não informado'}`
      });

      // Enviar notificação
      try {
        await NotificationService.sendMemberRejection(member, reason);
        logger.info(`Notificação de rejeição enviada para ${member.email}`);
      } catch (notificationError) {
        logger.error(`Erro ao enviar notificação de rejeição para ${member.email}:`, notificationError);
        logger.warn('Rejeição do membro continuou apesar do erro na notificação');
      }

      return {
        ...updatedMember,
        phoneFormatted: updatedMember.phone ? formatPhone(updatedMember.phone) : null
      };

    } catch (error) {
      logger.error(`Erro ao rejeitar membro ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Exclui um membro completamente do sistema
   * @param {number} memberId - ID do membro
   * @param {number} adminId - ID do administrador
   * @returns {Object} - Resultado da exclusão
   */
  static async deleteMember(memberId, adminId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' },
        include: {
          campus: {
            select: {
              id: true,
              name: true
            }
          },
          ministry: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              schedules: true,
              unavailabilities: true
            }
          }
        }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      // Executar exclusão em transação
      const result = await prisma.$transaction(async (tx) => {
        // Remover associações com escalas
        await tx.scheduleMember.deleteMany({
          where: { userId: memberId }
        });

        // Remover indisponibilidades
        await tx.unavailability.deleteMany({
          where: { userId: memberId }
        });

        // Remover notificações
        await tx.notification.deleteMany({
          where: { userId: memberId }
        });

        // Remover logs de auditoria relacionados
        await tx.auditLog.deleteMany({
          where: {
            OR: [
              { userId: memberId },
              { targetId: memberId }
            ]
          }
        });

        // Deletar o usuário
        const deletedUser = await tx.user.delete({
          where: { id: memberId }
        });

        return deletedUser;
      });

      // Log de auditoria da exclusão
      await this.createMemberAuditLog({
        action: 'MEMBER_DELETED',
        targetId: memberId,
        userId: adminId,
        description: `Membro ${member.name} foi excluído do sistema. Campus: ${member.campus?.name || 'N/A'}, Ministério: ${member.ministry?.name || 'N/A'}`
      });

      logger.info(`Membro excluído: ${member.name} (ID: ${memberId}) por admin ${adminId}`);

      return {
        success: true,
        message: 'Membro excluído com sucesso',
        deletedMember: {
          id: member.id,
          name: member.name,
          email: member.email
        }
      };

    } catch (error) {
      logger.error(`Erro ao excluir membro ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Atualiza o ministério de um membro
   * @param {number} memberId - ID do membro
   * @param {number|null} ministryId - ID do ministério (null para remover)
   * @param {number} adminId - ID do administrador
   * @returns {Object} - Membro atualizado
   */
  static async updateMemberMinistry(memberId, ministryId, adminId) {
    try {
      const member = await prisma.user.findUnique({
        where: { id: memberId, role: 'MEMBER' }
      });

      if (!member) {
        throw new Error('Membro não encontrado');
      }

      // Se ministryId for null, remove o ministério
      if (ministryId === null) {
        const updatedMember = await prisma.user.update({
          where: { id: memberId },
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

        await this.createMemberAuditLog({
          action: 'MEMBER_MINISTRY_REMOVED',
          targetId: memberId,
          userId: adminId,
          description: `Ministério removido do membro ${member.name}`
        });

        return {
          ...updatedMember,
          phoneFormatted: updatedMember.phone ? formatPhone(updatedMember.phone) : null
        };
      }

      // Verificar se o ministério existe e está ativo
      const ministry = await prisma.ministry.findUnique({
        where: { id: ministryId, active: true }
      });

      if (!ministry) {
        throw new Error('Ministério não encontrado ou inativo');
      }

      const updatedMember = await prisma.user.update({
        where: { id: memberId },
        data: { ministryId },
        include: {
          campus: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          ministry: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        }
      });

      await this.createMemberAuditLog({
        action: 'MEMBER_MINISTRY_UPDATED',
        targetId: memberId,
        userId: adminId,
        description: `Membro ${member.name} adicionado ao ministério ${ministry.name}`
      });

      return {
        ...updatedMember,
        phoneFormatted: updatedMember.phone ? formatPhone(updatedMember.phone) : null
      };

    } catch (error) {
      logger.error(`Erro ao atualizar ministério do membro ${memberId}:`, error);
      throw error;
    }
  }

  /**
   * Busca indisponibilidades dos membros para uma data específica
   * @param {string} date - Data no formato YYYY-MM-DD
   * @returns {Array} - Lista de membros indisponíveis na data
   */
  static async getMemberUnavailabilities(date) {
    try {
      const targetDate = new Date(date);
      
      const unavailabilities = await prisma.unavailability.findMany({
        where: {
          AND: [
            { startDate: { lte: targetDate } },
            { endDate: { gte: targetDate } },
            {
              user: {
                role: 'MEMBER',
                status: 'ACTIVE'
              }
            }
          ]
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              campusId: true,
              campus: {
                select: {
                  id: true,
                  name: true,
                  city: true
                }
              }
            }
          }
        }
      });

      // Retornar lista de IDs dos membros indisponíveis
      return {
        unavailableMembers: unavailabilities.map(unavail => unavail.user),
        unavailabilities: unavailabilities.map(unavail => ({
          id: unavail.id,
          userId: unavail.userId,
          startDate: unavail.startDate,
          endDate: unavail.endDate,
          reason: unavail.reason,
          member: unavail.user
        }))
      };
    } catch (error) {
      logger.error(`Erro ao buscar indisponibilidades para a data ${date}:`, error);
      throw error;
    }
  }

  /**
   * Obtém membros disponíveis para uma data específica
   * @param {string} date - Data no formato YYYY-MM-DD
   * @param {Object} filters - Filtros adicionais (campusId, userId, userRole, etc.)
   * @returns {Object} - Lista de membros disponíveis
   */
  static async getAvailableMembers(date, filters = {}) {
    try {
      console.log('🔍 [AdminMemberService] getAvailableMembers called with:', { date, filters });

      // Buscar indisponibilidades para a data
      const { unavailableMembers } = await this.getMemberUnavailabilities(date);
      const unavailableMemberIds = unavailableMembers.map(member => member.id);

      // Filtros base
      let whereClause = {
        role: 'MEMBER',
        status: 'ACTIVE',
        // Excluir membros indisponíveis
        id: { notIn: unavailableMemberIds }
      };

      // Aplicar filtros adicionais
      if (filters.campusId) {
        whereClause.campusId = parseInt(filters.campusId);
      }

      console.log('🔍 [AdminMemberService] Checking groupAdmin filter - userRole:', filters.userRole, 'userId:', filters.userId);

      // FILTRO PARA GROUP ADMIN: Ver apenas membros do ministério que ele administra
      if (filters.userRole === 'groupAdmin' && filters.userId) {
        console.log('✅ [AdminMemberService] ENTRANDO NO FILTRO GROUPADMIN');
        // Buscar os grupos de funções que o usuário administra
        const adminGroups = await prisma.functionGroupAdmin.findMany({
          where: { userId: parseInt(filters.userId) },
          include: {
            functionGroup: {
              select: {
                id: true,
                name: true,
                ministryId: true
              }
            }
          }
        });

        if (adminGroups.length > 0) {
          // Extrair IDs únicos dos ministérios
          const ministryIds = [...new Set(
            adminGroups
              .map(ag => ag.functionGroup.ministryId)
              .filter(id => id !== null)
          )];

          if (ministryIds.length > 0) {
            // Filtrar membros APENAS pelo ministryId (sem incluir membros sem ministério)
            whereClause.ministryId = { in: ministryIds };
            logger.info(`🔒 GroupAdmin ${filters.userId} vendo APENAS membros dos ministérios: ${ministryIds.join(', ')}`);
          } else {
            // Se não há ministérios, não retorna nenhum membro
            whereClause.id = -1;
            logger.warn(`⚠️ GroupAdmin ${filters.userId} não tem ministérios associados - nenhum membro será exibido`);
          }
        } else {
          // Se o groupAdmin não gerencia grupos, não retorna membros
          whereClause.id = -1;
          logger.warn(`⚠️ GroupAdmin ${filters.userId} não gerencia nenhum grupo de funções`);
        }
      }

      if (filters.search) {
        // Se já houver um filtro de ministério, combinar com AND
        if (whereClause.ministryId) {
          const ministryFilter = whereClause.ministryId;
          whereClause = {
            ...whereClause,
            ministryId: ministryFilter,
            OR: [
              { name: { contains: filters.search, mode: 'insensitive' } },
              { email: { contains: filters.search, mode: 'insensitive' } }
            ]
          };
        } else {
          whereClause.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { email: { contains: filters.search, mode: 'insensitive' } }
          ];
        }
      }

      console.log('🔍 [AdminMemberService] Final whereClause:', JSON.stringify(whereClause, null, 2));

      const availableMembers = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          campusId: true,
          campus: {
            select: {
              id: true,
              name: true,
              city: true
            }
          },
          ministry: {
            select: {
              id: true,
              name: true,
              description: true
            }
          }
        },
        orderBy: { name: 'asc' }
      });

      return {
        members: availableMembers.map(member => ({
          ...member,
          phoneFormatted: member.phone ? formatPhone(member.phone) : null
        })),
        unavailableCount: unavailableMemberIds.length,
        totalAvailable: availableMembers.length
      };
    } catch (error) {
      logger.error(`Erro ao buscar membros disponíveis para a data ${date}:`, error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de membros
   * @returns {Object} - Estatísticas de membros
   */
  static async getMemberStats() {
    const [
      totalMembers,
      activeMembers,
      pendingMembers,
      rejectedMembers,
      membersByCampus,
      membersByMinistry
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'MEMBER' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'PENDING' } }),
      prisma.user.count({ where: { role: 'MEMBER', status: 'REJECTED' } }),
      
      // Membros por campus
      prisma.user.groupBy({
        by: ['campusId'],
        where: { role: 'MEMBER', status: 'ACTIVE' },
        _count: true
      }),
      
      // Membros por ministério
      prisma.user.groupBy({
        by: ['ministryId'],
        where: { role: 'MEMBER', status: 'ACTIVE', ministryId: { not: null } },
        _count: true
      })
    ]);

    return {
      totalMembers,
      activeMembers,
      pendingMembers,
      rejectedMembers,
      membersByCampus,
      membersByMinistry
    };
  }

  /**
   * Cria um log de auditoria específico para membros
   * @param {Object} data - Dados do log
   * @returns {Promise} - Log criado
   */
  static async createMemberAuditLog(data) {
    try {
      const { action, targetId, userId, description } = data;

      return await prisma.auditLog.create({
        data: {
          action,
          targetId,
          userId,
          description,
          createdAt: new Date()
        }
      });
    } catch (error) {
      logger.error('Erro ao criar log de auditoria para membro:', error);
    }
  }
}

module.exports = AdminMemberService;