const AuthService = require('../../../src/services/AuthService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../../../src/config/database');
const EmailService = require('../../../src/services/EmailService');

// Mock das dependências
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');
jest.mock('../../../src/config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn()
    },
    campus: {
      findFirst: jest.fn()
    }
  }
}));
jest.mock('../../../src/services/EmailService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '7d';
  });

  describe('register', () => {
    const userData = {
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'senha123',
      phone: '11999999999',
      campusId: 1
    };

    it('deve registrar usuário com sucesso', async () => {
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        role: 'MEMBER',
        status: 'PENDING',
        createdAt: new Date(),
        campus: {
          id: 1,
          name: 'Campus Central',
          city: 'São Paulo'
        }
      };

      prisma.user.findUnique.mockResolvedValue(null); // Email não existe
      prisma.campus.findFirst.mockResolvedValue({ id: 1, active: true });
      bcrypt.hash.mockResolvedValue('hashedPassword');
      prisma.user.create.mockResolvedValue(mockUser);
      EmailService.notifyAdminsNewMember.mockResolvedValue();

      const result = await AuthService.register(userData);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: userData.email }
      });
      expect(prisma.campus.findFirst).toHaveBeenCalledWith({
        where: { id: userData.campusId, active: true }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(userData.password, 12);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          name: userData.name,
          email: userData.email,
          password: 'hashedPassword',
          phone: userData.phone,
          campusId: userData.campusId,
          role: 'MEMBER',
          status: 'PENDING'
        },
        select: expect.any(Object)
      });
      expect(EmailService.notifyAdminsNewMember).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual({ user: mockUser });
    });

    it('deve lançar erro se email já existe', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1 });

      await expect(AuthService.register(userData)).rejects.toThrow('Email já cadastrado no sistema');
    });

    it('deve lançar erro se campus não existe ou está inativo', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.campus.findFirst.mockResolvedValue(null);

      await expect(AuthService.register(userData)).rejects.toThrow('Campus selecionado não está disponível');
    });

    it('deve registrar usuário sem campus', async () => {
      const userDataWithoutCampus = { ...userData, campusId: null };
      const mockUser = {
        id: 1,
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        role: 'MEMBER',
        status: 'PENDING',
        createdAt: new Date(),
        campus: null
      };

      prisma.user.findUnique.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedPassword');
      prisma.user.create.mockResolvedValue(mockUser);
      EmailService.notifyAdminsNewMember.mockResolvedValue();

      const result = await AuthService.register(userDataWithoutCampus);

      expect(prisma.campus.findFirst).not.toHaveBeenCalled();
      expect(result).toEqual({ user: mockUser });
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      name: 'João Silva',
      email: 'joao@email.com',
      password: 'hashedPassword',
      phone: '11999999999',
      role: 'MEMBER',
      status: 'ACTIVE',
      campusId: 1,
      campus: {
        id: 1,
        name: 'Campus Central',
        city: 'São Paulo',
        active: true
      },
      functionGroupAdmins: []
    };

    it('deve fazer login com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token');
      prisma.user.update.mockResolvedValue();

      const result = await AuthService.login('joao@email.com', 'senha123');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@email.com' },
        include: expect.any(Object)
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('senha123', 'hashedPassword');
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 1,
          email: 'joao@email.com',
          role: 'MEMBER',
          userType: 'member',
          adminGroups: [],
          campusId: 1
        },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { lastLogin: expect.any(Date) }
      });
      expect(result).toEqual({
        token: 'jwt-token',
        user: {
          id: 1,
          name: 'João Silva',
          email: 'joao@email.com',
          phone: '11999999999',
          role: 'MEMBER',
          status: 'ACTIVE',
          userType: 'member',
          adminGroups: [],
          campus: mockUser.campus
        }
      });
    });

    it('deve lançar erro se usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.login('joao@email.com', 'senha123')).rejects.toThrow('Credenciais inválidas');
    });

    it('deve lançar erro se senha está incorreta', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.login('joao@email.com', 'senhaErrada')).rejects.toThrow('Credenciais inválidas');
    });

    it('deve lançar erro se usuário não está ativo', async () => {
      const inactiveUser = { ...mockUser, status: 'PENDING' };
      prisma.user.findUnique.mockResolvedValue(inactiveUser);
      bcrypt.compare.mockResolvedValue(true);

      await expect(AuthService.login('joao@email.com', 'senha123')).rejects.toThrow('Usuário aguardando aprovação ou inativo');
    });

    it('deve lançar erro se campus não está ativo', async () => {
      const userWithInactiveCampus = {
        ...mockUser,
        campus: { ...mockUser.campus, active: false }
      };
      prisma.user.findUnique.mockResolvedValue(userWithInactiveCampus);
      bcrypt.compare.mockResolvedValue(true);

      await expect(AuthService.login('joao@email.com', 'senha123')).rejects.toThrow('Campus não está mais ativo. Entre em contato com a administração');
    });

    it('deve identificar admin de grupo', async () => {
      const groupAdminUser = {
        ...mockUser,
        functionGroupAdmins: [
          {
            functionGroup: {
              id: 1,
              name: 'Grupo Teste',
              active: true
            }
          }
        ]
      };

      prisma.user.findUnique.mockResolvedValue(groupAdminUser);
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwt-token');
      prisma.user.update.mockResolvedValue();

      const result = await AuthService.login('joao@email.com', 'senha123');

      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          userType: 'groupAdmin',
          adminGroups: [1]
        }),
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result.user.userType).toBe('groupAdmin');
      expect(result.user.adminGroups).toEqual([1]);
    });
  });

  describe('refreshToken', () => {
    const mockUser = {
      id: 1,
      email: 'joao@email.com',
      role: 'MEMBER',
      status: 'ACTIVE',
      campusId: 1,
      campus: {
        id: 1,
        name: 'Campus Central',
        active: true
      },
      functionGroupAdmins: []
    };

    it('deve renovar token com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('new-jwt-token');

      const result = await AuthService.refreshToken(1);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object)
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: 1,
          email: 'joao@email.com',
          role: 'MEMBER',
          userType: 'member',
          adminGroups: [],
          campusId: 1,
          refreshedAt: expect.any(String)
        },
        'test-secret',
        { expiresIn: '7d' }
      );
      expect(result).toBe('new-jwt-token');
    });

    it('deve lançar erro se usuário não existe ou não está ativo', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.refreshToken(1)).rejects.toThrow('Usuário inválido');
    });

    it('deve lançar erro se campus não está ativo', async () => {
      const userWithInactiveCampus = {
        ...mockUser,
        campus: { ...mockUser.campus, active: false }
      };
      prisma.user.findUnique.mockResolvedValue(userWithInactiveCampus);

      await expect(AuthService.refreshToken(1)).rejects.toThrow('Campus não está mais ativo');
    });
  });

  describe('changePassword', () => {
    const mockUser = {
      id: 1,
      password: 'hashedPassword'
    };

    it('deve alterar senha com sucesso', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      bcrypt.hash.mockResolvedValue('newHashedPassword');
      prisma.user.update.mockResolvedValue();

      await AuthService.changePassword(1, 'senhaAtual', 'novaSenha');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 }
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('senhaAtual', 'hashedPassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha', 12);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { password: 'newHashedPassword' }
      });
    });

    it('deve lançar erro se usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(AuthService.changePassword(1, 'senhaAtual', 'novaSenha')).rejects.toThrow('Usuário não encontrado');
    });

    it('deve lançar erro se senha atual está incorreta', async () => {
      prisma.user.findUnique.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(false);

      await expect(AuthService.changePassword(1, 'senhaErrada', 'novaSenha')).rejects.toThrow('Senha atual incorreta');
    });
  });

  describe('forgotPassword', () => {
    it('deve processar recuperação de senha com sucesso', async () => {
      const mockUser = {
        id: 1,
        email: 'joao@email.com'
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      jwt.sign.mockReturnValue('reset-token');
      EmailService.sendPasswordReset.mockResolvedValue();

      const result = await AuthService.forgotPassword('joao@email.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'joao@email.com' }
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: 1 },
        'test-secret',
        { expiresIn: '1h' }
      );
      expect(EmailService.sendPasswordReset).toHaveBeenCalledWith('joao@email.com', 'reset-token');
      expect(result).toBe(true);
    });

    it('deve retornar sucesso mesmo se usuário não existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await AuthService.forgotPassword('naoexiste@email.com');

      expect(jwt.sign).not.toHaveBeenCalled();
      expect(EmailService.sendPasswordReset).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});