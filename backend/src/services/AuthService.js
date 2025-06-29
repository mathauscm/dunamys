const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');
const EmailService = require('./EmailService');

class AuthService {
  static async register(userData) {
    const { name, email, password, phone, campusId } = userData;

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('Email já cadastrado no sistema');
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
        throw new Error('Campus selecionado não está disponível');
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
    // Buscar usuário com campus
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
        }
      }
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar se usuário está ativo
    if (user.status !== 'ACTIVE') {
      throw new Error('Usuário aguardando aprovação ou inativo');
    }

    // Verificar se campus está ativo (se tiver campus)
    if (user.campus && !user.campus.active) {
      throw new Error('Campus não está mais ativo. Entre em contato com a administração');
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
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
        }
      }
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new Error('Usuário inválido');
    }

    // Verificar se campus ainda está ativo
    if (user.campus && !user.campus.active) {
      throw new Error('Campus não está mais ativo');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        campusId: user.campusId
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
      throw new Error('Usuário não encontrado');
    }

    // Verificar senha atual
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
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