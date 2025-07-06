const { transporter } = require('../config/email');
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

class EmailService {
  // Verificar se email está configurado
  static isEmailConfigured() {
    return !!(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS
    );
  }

  static async sendEmail(to, subject, html, text) {
    // Se email não estiver configurado, apenas logar e não falhar
    if (!this.isEmailConfigured()) {
      logger.warn('📧 Email não configurado - pulando envio de email', {
        to, subject,
        configStatus: {
          SMTP_HOST: !!process.env.SMTP_HOST,
          SMTP_USER: !!process.env.SMTP_USER,
          SMTP_PASS: !!process.env.SMTP_PASS
        }
      });
      return { skipped: true, reason: 'Email não configurado' };
    }
    
    logger.info(`📧 Tentando enviar email para: ${to} - Assunto: ${subject}`);

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@igreja.com',
        to,
        subject,
        html,
        text
      };

      const result = await transporter.sendMail(mailOptions);
      logger.info(`Email enviado para ${to}: ${subject}`);
      return result;
    } catch (error) {
      logger.error(`Erro ao enviar email para ${to}:`, error);
      
      // Em desenvolvimento, não falhar por causa de email
      if (process.env.NODE_ENV === 'development') {
        logger.warn('Erro de email ignorado em desenvolvimento');
        return { skipped: true, reason: 'Erro ignorado em desenvolvimento' };
      }
      
      throw error;
    }
  }

  static async notifyAdminsNewMember(user) {
    try {
      // Se email não configurado, pular silenciosamente
      if (!this.isEmailConfigured()) {
        logger.info('Email não configurado - notificação de admin pulada');
        return { skipped: true };
      }

      // Buscar todos os administradores
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { email: true, name: true }
      });

      if (admins.length === 0) {
        logger.warn('Nenhum administrador encontrado para notificar');
        return { skipped: true, reason: 'Nenhum admin encontrado' };
      }

      const subject = 'Novo Membro Aguardando Aprovação';
      const html = `
        <h2>Novo Membro Cadastrado</h2>
        <p>Um novo membro se cadastrou no sistema e está aguardando aprovação:</p>
        <ul>
          <li><strong>Nome:</strong> ${user.name}</li>
          <li><strong>Email:</strong> ${user.email}</li>
          <li><strong>Telefone:</strong> ${user.phone}</li>
          ${user.campus ? `<li><strong>Campus:</strong> ${user.campus.name}</li>` : ''}
          <li><strong>Data de Cadastro:</strong> ${new Date(user.createdAt).toLocaleDateString('pt-BR')}</li>
        </ul>
        <p>Acesse o painel administrativo para aprovar ou rejeitar este cadastro.</p>
      `;

      const results = [];
      for (const admin of admins) {
        try {
          const result = await this.sendEmail(admin.email, subject, html);
          results.push({ admin: admin.email, success: true, result });
        } catch (error) {
          logger.error(`Erro ao notificar admin ${admin.email}:`, error);
          results.push({ admin: admin.email, success: false, error: error.message });
        }
      }

      return { results };
    } catch (error) {
      logger.error('Erro geral ao notificar administradores:', error);
      
      // Em desenvolvimento, não falhar
      if (process.env.NODE_ENV === 'development') {
        return { skipped: true, reason: 'Erro ignorado em desenvolvimento' };
      }
      
      // Em produção, também não falhar o cadastro por causa de email
      return { skipped: true, reason: 'Erro de email - cadastro mantido' };
    }
  }

  static async sendMemberApproval(user) {
    try {
      if (!this.isEmailConfigured()) {
        logger.info('Email não configurado - aprovação por email pulada');
        return { skipped: true };
      }

      const subject = 'Cadastro Aprovado - Bem-vindo!';
      const html = `
        <h2>Parabéns, ${user.name}!</h2>
        <p>Seu cadastro foi aprovado e você já pode acessar o sistema de membros da igreja.</p>
        <p>Agora você pode:</p>
        <ul>
          <li>Visualizar suas escalas de serviço</li>
          <li>Definir períodos de indisponibilidade</li>
          <li>Receber notificações automáticas</li>
        </ul>
        <p>Acesse o sistema usando seu email e senha cadastrados.</p>
        <p>Que Deus abençoe seu ministério!</p>
      `;

      return await this.sendEmail(user.email, subject, html);
    } catch (error) {
      logger.error('Erro ao enviar email de aprovação:', error);
      return { skipped: true, reason: 'Erro de email' };
    }
  }

  static async sendMemberRejection(user, reason) {
    try {
      if (!this.isEmailConfigured()) {
        logger.info('Email não configurado - rejeição por email pulada');
        return { skipped: true };
      }

      const subject = 'Informações sobre seu Cadastro';
      const html = `
        <h2>Olá, ${user.name}</h2>
        <p>Infelizmente não foi possível aprovar seu cadastro no sistema de membros.</p>
        ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
        <p>Para mais informações, entre em contato com a administração da igreja.</p>
        <p>Deus abençoe!</p>
      `;

      return await this.sendEmail(user.email, subject, html);
    } catch (error) {
      logger.error('Erro ao enviar email de rejeição:', error);
      return { skipped: true, reason: 'Erro de email' };
    }
  }

  static async sendPasswordReset(email, resetToken) {
    try {
      if (!this.isEmailConfigured()) {
        logger.info('Email não configurado - reset de senha pulado');
        return { skipped: true };
      }

      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

      const subject = 'Redefinição de Senha';
      const html = `
        <h2>Redefinição de Senha</h2>
        <p>Você solicitou a redefinição de sua senha.</p>
        <p>Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Redefinir Senha
        </a>
        <p>Este link é válido por 1 hora.</p>
        <p>Se você não solicitou esta redefinição, ignore este email.</p>
      `;

      return await this.sendEmail(email, subject, html);
    } catch (error) {
      logger.error('Erro ao enviar email de reset:', error);
      return { skipped: true, reason: 'Erro de email' };
    }
  }

  static async sendScheduleReminder(schedule, user) {
    try {
      if (!this.isEmailConfigured()) {
        logger.info('Email não configurado - lembrete pulado');
        return { skipped: true };
      }

      const scheduleDate = new Date(schedule.date).toLocaleDateString('pt-BR');

      const subject = `Lembrete: ${schedule.title} - Amanhã`;
      const html = `
        <h2>Lembrete de Serviço</h2>
        <p>Olá, ${user.name}!</p>
        <p>Este é um lembrete de que você tem um serviço agendado para amanhã:</p>
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <h3>${schedule.title}</h3>
          <p><strong>Data:</strong> ${scheduleDate}</p>
          <p><strong>Horário:</strong> ${schedule.time}</p>
          <p><strong>Local:</strong> ${schedule.location}</p>
          ${schedule.description ? `<p><strong>Descrição:</strong> ${schedule.description}</p>` : ''}
        </div>
        <p>Contamos com sua presença!</p>
        <p>Deus abençoe!</p>
      `;

      return await this.sendEmail(user.email, subject, html);
    } catch (error) {
      logger.error('Erro ao enviar lembrete:', error);
      return { skipped: true, reason: 'Erro de email' };
    }
  }
}

module.exports = EmailService;