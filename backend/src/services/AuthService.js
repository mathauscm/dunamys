// backend/src/services/AuthService.js - ATUALIZADO COM CAMPUS
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

    // Verificar se o campus existe e está ativo
    if (campusId) {
      const campus = await prisma.campus.findFirst({
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
        phone, // Já vem limpo do frontend
        campusId: campusId || null,
        role: 'MEMBER',
        status: 'PENDING' // Aguardando aprovação
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

// =================================================================

// backend/src/app.js - ADICIONAR ROTA DE CAMPUS
// ... (no final das rotas existentes, adicionar:)

const campusRoutes = require('./routes/campus');

// ... (depois das outras rotas)
app.use('/api/campus', campusRoutes);

// =================================================================

// backend/src/utils/validators.js - ATUALIZAR VALIDADORES
const Joi = require('joi');

const schemas = {
  // Validação de usuário - ATUALIZADA
  user: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^\d{10,11}$/).required(), // Apenas números
    campusId: Joi.number().integer().positive().optional(),
  }),

  // Validação de login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Validação de escala
  schedule: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(500).optional(),
    date: Joi.date().iso().required(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    location: Joi.string().max(200).required(),
    memberIds: Joi.array().items(Joi.number().integer().positive()).required(),
  }),

  // Validação de indisponibilidade
  unavailability: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    reason: Joi.string().max(200).optional(),
  }),

  // NOVA: Validação de campus
  campus: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    city: Joi.string().max(100).optional().allow('', null),
  }),

  updateCampus: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    city: Joi.string().max(100).optional().allow('', null),
    active: Joi.boolean().optional(),
  }),
};

module.exports = schemas;