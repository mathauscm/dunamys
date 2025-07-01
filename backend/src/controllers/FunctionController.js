const FunctionService = require('../services/FunctionService');
const AdminService = require('../services/AdminService');
const logger = require('../utils/logger');

class FunctionController {

  // ==================== GRUPOS DE FUNÇÕES ====================

  static async getFunctionGroups(req, res) {
    try {
      const { includeInactive = false } = req.query;
      
      const groups = await FunctionService.getFunctionGroups(includeInactive === 'true');
      
      res.status(200).json({
        success: true,
        data: groups
      });
    } catch (error) {
      logger.error('Erro ao buscar grupos de funções:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async createFunctionGroup(req, res) {
    try {
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          message: 'Nome do grupo é obrigatório'
        });
      }

      const group = await FunctionService.createFunctionGroup({
        name,
        description
      });

      // Log de auditoria
      await AdminService.createAuditLog({
        action: 'FUNCTION_GROUP_CREATED',
        targetId: group.id,
        userId: req.user.id,
        description: `Grupo de funções "${name}" criado`
      });

      res.status(201).json({
        success: true,
        data: group,
        message: 'Grupo de funções criado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar grupo de funções:', error);
      
      if (error.message.includes('já existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async updateFunctionGroup(req, res) {
    try {
      const { id } = req.params;
      const { name, description, active } = req.body;

      const group = await FunctionService.updateFunctionGroup(parseInt(id), {
        name,
        description,
        active
      });

      // Log de auditoria
      await AdminService.createAuditLog({
        action: 'FUNCTION_GROUP_UPDATED',
        targetId: group.id,
        userId: req.user.id,
        description: `Grupo de funções "${group.name}" atualizado`
      });

      res.status(200).json({
        success: true,
        data: group,
        message: 'Grupo de funções atualizado com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar grupo de funções:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('já existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async deleteFunctionGroup(req, res) {
    try {
      const { id } = req.params;

      await FunctionService.deleteFunctionGroup(parseInt(id));

      // Log de auditoria
      await AdminService.createAuditLog({
        action: 'FUNCTION_GROUP_DELETED',
        targetId: parseInt(id),
        userId: req.user.id,
        description: `Grupo de funções excluído`
      });

      res.status(200).json({
        success: true,
        message: 'Grupo de funções excluído com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir grupo de funções:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('sendo usadas')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ==================== FUNÇÕES ====================

  static async getFunctions(req, res) {
    try {
      const { groupId, includeInactive = false } = req.query;
      
      const functions = await FunctionService.getFunctions(
        groupId ? parseInt(groupId) : null,
        includeInactive === 'true'
      );
      
      res.status(200).json({
        success: true,
        data: functions
      });
    } catch (error) {
      logger.error('Erro ao buscar funções:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async createFunction(req, res) {
    try {
      const { name, description, icon, groupId } = req.body;

      if (!name || !groupId) {
        return res.status(400).json({
          success: false,
          message: 'Nome e grupo são obrigatórios'
        });
      }

      const func = await FunctionService.createFunction({
        name,
        description,
        icon,
        groupId: parseInt(groupId)
      });

      // Log de auditoria
      await AdminService.createAuditLog({
        action: 'FUNCTION_CREATED',
        targetId: func.id,
        userId: req.user.id,
        description: `Função "${name}" criada no grupo "${func.group.name}"`
      });

      res.status(201).json({
        success: true,
        data: func,
        message: 'Função criada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao criar função:', error);
      
      if (error.message.includes('não encontrado') || error.message.includes('já existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async updateFunction(req, res) {
    try {
      const { id } = req.params;
      const { name, description, icon, groupId, active } = req.body;

      const func = await FunctionService.updateFunction(parseInt(id), {
        name,
        description,
        icon,
        groupId: groupId ? parseInt(groupId) : undefined,
        active
      });

      // Log de auditoria
      await AdminService.createAuditLog({
        action: 'FUNCTION_UPDATED',
        targetId: func.id,
        userId: req.user.id,
        description: `Função "${func.name}" atualizada`
      });

      res.status(200).json({
        success: true,
        data: func,
        message: 'Função atualizada com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao atualizar função:', error);
      
      if (error.message.includes('não encontrada') || error.message.includes('já existe')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  static async deleteFunction(req, res) {
    try {
      const { id } = req.params;

      await FunctionService.deleteFunction(parseInt(id));

      // Log de auditoria
      await AdminService.createAuditLog({
        action: 'FUNCTION_DELETED',
        targetId: parseInt(id),
        userId: req.user.id,
        description: `Função excluída`
      });

      res.status(200).json({
        success: true,
        message: 'Função excluída com sucesso'
      });
    } catch (error) {
      logger.error('Erro ao excluir função:', error);
      
      if (error.message.includes('não encontrada') || error.message.includes('sendo usada')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = FunctionController;