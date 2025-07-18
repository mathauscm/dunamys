const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const EmailService = require('./EmailService');
const AppError = require('../utils/AppError');

class AuthService {
  static async register(userData) {
    const { name, email, password, phone, campusId } = userData;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new AppError('Email já cadastrado no sistema', 400);
    }

    // Verificar se o campus existe e está ativo (se campusId for informado)
    let campus = null;
    if (campusId) {
      campus = await prisma.campus.findFirst({
        where: {
          id: campusId,
          active: true
        }
      });

      if (!campus) {
        throw new AppError('Campus selecionado não está disponível', 400);
      }
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 12);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        campusId: campusId || null,
        role: 'MEMBER',
        status: 'PENDING'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        campus: {
          select: {
            id: true,
            name: true,
            city: true
          }
        }
      }
    });

    // Notificar administradores sobre novo cadastro
    await EmailService.notifyAdminsNewMember(user);

    return { user };
  }

  static async login(email, password) {
    // Buscar usuário com campus e grupos que administra
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        campus: {
          select: {
            id: true,
            name: true,
            city: true,
            active: true
          }
        },
        functionGroupAdmins: {
          include: {
            functionGroup: {
              select: {
                id: true,
                name: true,
                active: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Credenciais inválidas', 401);
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ACTIVE') {
      throw new AppError('Usuário aguardando aprovação ou inativo', 401);
    }

    // Verificar se campus está ativo (se tiver campus)
    if (user.campus && !user.campus.active) {
      throw new AppError('Campus não está mais ativo. Entre em contato com a administração', 401);
    }

    // Verificar se é admin de grupo e quais grupos administra
    const adminGroups = user.functionGroupAdmins
      .filter(admin => admin.functionGroup.active)
      .map(admin => admin.functionGroup.id);
    
    const userType = user.role === 'ADMIN' ? 'admin' : (adminGroups.length > 0 ? 'groupAdmin' : 'member');

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        userType: userType,
        adminGroups: adminGroups,
        campusId: user.campusId
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        userType: userType,
        adminGroups: adminGroups,
        campus: user.campus
      }
    };
  }

  static async refreshToken(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        campus: {
          select: {
            id: true,
            name: true,
            active: true
          }
        },
        functionGroupAdmins: {
          include: {
            functionGroup: {
              select: {
                id: true,
                name: true,
                active: true
              }
            }
          }
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new AppError('Usuário inválido', 401);
    }

    // Verificar se campus ainda está ativo
    if (user.campus && !user.campus.active) {
      throw new AppError('Campus não está mais ativo', 401);
    }

    // Verificar se é admin de grupo e quais grupos administra
    const adminGroups = user.functionGroupAdmins
      .filter(admin => admin.functionGroup.active)
      .map(admin => admin.functionGroup.id);
    
    const userType = user.role === 'ADMIN' ? 'admin' : (adminGroups.length > 0 ? 'groupAdmin' : 'member');

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        userType: userType,
        adminGroups: adminGroups,
        campusId: user.campusId,
        refreshedAt: new Date().toISOString()
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return token;
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new AppError('Senha atual incorreta', 400);
    }

    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Atualizar senha
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
  }

  static async forgotPassword(email) {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      // Gerar token de recuperação
      const resetToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );

      // Enviar email de recuperação
      await EmailService.sendPasswordReset(user.email, resetToken);
    }

    // Sempre retornar sucesso por segurança
    return true;
  }
}

module.exports = AuthService;