const AuthController = require('../../../src/controllers/AuthController');
const AuthService = require('../../../src/services/AuthService');
const logger = require('../../../src/utils/logger');

// Mock dos serviços
jest.mock('../../../src/services/AuthService');
jest.mock('../../../src/utils/logger');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 1 }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    
    // Limpar mocks
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('deve registrar um usuário com sucesso', async () => {
      const userData = {
        name: 'João Silva',
        email: 'joao@email.com',
        password: 'senha123',
        phone: '11999999999',
        campusId: 1
      };

      const mockResult = {
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com'
        }
      };

      req.body = userData;
      AuthService.register.mockResolvedValue(mockResult);

      await AuthController.register(req, res, next);

      expect(AuthService.register).toHaveBeenCalledWith(userData);
      expect(logger.info).toHaveBeenCalledWith('Novo usuário registrado: joao@email.com');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Usuário registrado com sucesso. Aguarde aprovação do administrador.',
        user: mockResult.user
      });
    });

    it('deve tratar erro no registro', async () => {
      const error = new Error('Email já existe');
      req.body = { email: 'joao@email.com' };
      AuthService.register.mockRejectedValue(error);

      await AuthController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('login', () => {
    it('deve fazer login com sucesso', async () => {
      const loginData = {
        email: 'joao@email.com',
        password: 'senha123'
      };

      const mockResult = {
        token: 'jwt-token',
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com'
        }
      };

      req.body = loginData;
      AuthService.login.mockResolvedValue(mockResult);

      await AuthController.login(req, res, next);

      expect(AuthService.login).toHaveBeenCalledWith(loginData.email, loginData.password);
      expect(logger.info).toHaveBeenCalledWith('Login realizado: joao@email.com');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Login realizado com sucesso',
        token: mockResult.token,
        user: mockResult.user
      });
    });

    it('deve tratar erro no login', async () => {
      const error = new Error('Credenciais inválidas');
      req.body = { email: 'joao@email.com', password: 'senha123' };
      AuthService.login.mockRejectedValue(error);

      await AuthController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    it('deve renovar token com sucesso', async () => {
      const newToken = 'new-jwt-token';
      AuthService.refreshToken.mockResolvedValue(newToken);

      await AuthController.refreshToken(req, res, next);

      expect(AuthService.refreshToken).toHaveBeenCalledWith(req.user.id);
      expect(res.json).toHaveBeenCalledWith({
        token: newToken
      });
    });

    it('deve tratar erro na renovação do token', async () => {
      const error = new Error('Token inválido');
      AuthService.refreshToken.mockRejectedValue(error);

      await AuthController.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('changePassword', () => {
    it('deve alterar senha com sucesso', async () => {
      const passwordData = {
        currentPassword: 'senhaAtual',
        newPassword: 'novaSenha123'
      };

      req.body = passwordData;
      AuthService.changePassword.mockResolvedValue();

      await AuthController.changePassword(req, res, next);

      expect(AuthService.changePassword).toHaveBeenCalledWith(
        req.user.id,
        passwordData.currentPassword,
        passwordData.newPassword
      );
      expect(logger.info).toHaveBeenCalledWith('Senha alterada para usuário ID: 1');
      expect(res.json).toHaveBeenCalledWith({
        message: 'Senha alterada com sucesso'
      });
    });

    it('deve tratar erro na alteração de senha', async () => {
      const error = new Error('Senha atual inválida');
      req.body = { currentPassword: 'senhaAtual', newPassword: 'novaSenha123' };
      AuthService.changePassword.mockRejectedValue(error);

      await AuthController.changePassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('forgotPassword', () => {
    it('deve processar recuperação de senha com sucesso', async () => {
      const email = 'joao@email.com';
      req.body = { email };
      AuthService.forgotPassword.mockResolvedValue();

      await AuthController.forgotPassword(req, res, next);

      expect(AuthService.forgotPassword).toHaveBeenCalledWith(email);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha'
      });
    });

    it('deve tratar erro na recuperação de senha', async () => {
      const error = new Error('Erro interno');
      req.body = { email: 'joao@email.com' };
      AuthService.forgotPassword.mockRejectedValue(error);

      await AuthController.forgotPassword(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});