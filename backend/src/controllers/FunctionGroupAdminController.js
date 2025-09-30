const FunctionGroupAdminService = require('../services/FunctionGroupAdminService');
const logger = require('../utils/logger');

class FunctionGroupAdminController {
  static async assignUser(req, res, next) {
    try {
      const { userId, functionGroupId } = req.body;

      if (!userId || !functionGroupId) {
        return res.status(400).json({
          message: 'userId e functionGroupId são obrigatórios'
        });
      }

      const admin = await FunctionGroupAdminService.assignUserToGroup(
        parseInt(userId),
        parseInt(functionGroupId)
      );

      logger.info(`Usuário ${userId} designado como admin do grupo ${functionGroupId} por ${req.user.userId}`);

      res.status(201).json({
        message: 'Usuário designado como administrador do grupo com sucesso',
        admin
      });
    } catch (error) {
      next(error);
    }
  }

  static async removeUser(req, res, next) {
    try {
      const { userId, functionGroupId } = req.params;

      await FunctionGroupAdminService.removeUserFromGroup(
        parseInt(userId),
        parseInt(functionGroupId)
      );

      logger.info(`Usuário ${userId} removido como admin do grupo ${functionGroupId} por ${req.user.userId}`);

      res.json({
        message: 'Usuário removido do grupo com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserGroups(req, res, next) {
    try {
      const { userId } = req.params;
      
      const groups = await FunctionGroupAdminService.getUserGroups(parseInt(userId));

      res.json({ groups });
    } catch (error) {
      next(error);
    }
  }

  static async getMyGroups(req, res, next) {
    try {
      const groups = await FunctionGroupAdminService.getUserGroups(req.user.userId);

      res.json({ groups });
    } catch (error) {
      next(error);
    }
  }

  static async getGroupAdmins(req, res, next) {
    try {
      const { functionGroupId } = req.params;
      
      const admins = await FunctionGroupAdminService.getGroupAdmins(parseInt(functionGroupId));

      res.json({ admins });
    } catch (error) {
      next(error);
    }
  }

  static async getAllGroupAdmins(req, res, next) {
    try {
      const admins = await FunctionGroupAdminService.getAllGroupAdmins();

      res.json({ admins });
    } catch (error) {
      next(error);
    }
  }

  static async getMyFunctions(req, res, next) {
    try {
      const userId = req.user.id || req.user.userId;
      const functions = await FunctionGroupAdminService.getFunctionsForUserGroups(userId);

      res.json({ functions });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = FunctionGroupAdminController;