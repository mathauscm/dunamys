const AuthService = require('../services/AuthService');
const logger = require('../utils/logger');

class AuthController {
  static async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;
      
      const result = await AuthService.register({
        name,
        email,
        password,
        phone
      });

      logger.info(`Novo usuário registrado: ${email}`);
      
      res.status(201).json({
        message: 'Usuário registrado com sucesso. Aguarde aprovação do administrador.',
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      const result = await AuthService.login(email, password);
      
      logger.info(`Login realizado: ${email}`);
      
      res.json({
        message: 'Login realizado com sucesso',
        token: result.token,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req, res, next) {
    try {
      const newToken = await AuthService.refreshToken(req.user.id);
      
      res.json({
        token: newToken
      });
    } catch (error) {
      next(error);
    }
  }

  static async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      
      await AuthService.changePassword(req.user.id, currentPassword, newPassword);
      
      logger.info(`Senha alterada para usuário ID: ${req.user.id}`);
      
      res.json({
        message: 'Senha alterada com sucesso'
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      await AuthService.forgotPassword(email);
      
      res.json({
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;