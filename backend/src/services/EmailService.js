const { transporter } = require('../config/email');
const logger = require('../utils/logger');

class EmailService {
  static async sendEmail(to, subject, html, text) {
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
      throw error;
    }
  }

  static async notifyAdminsNewMember(user) {
    // Buscar todos os administradores
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true, name: true }
    });

    const subject = 'Novo Membro Aguardando Aprovação';
    const html = `
      <h2>Novo Membro Cadastrado</h2>
      <p>Um novo membro se cadastrou no sistema e está aguardando aprovação:</p>
      <ul>
        <li><strong>Nome:</strong> ${user.name}</li>
        <li><strong>Email:</strong> ${user.email}</li>
        <li><strong>Telefone:</strong> ${user.phone}</li>
        <li><strong>Data de Cadastro:</strong> ${new Date(user.createdAt).toLocaleDateString('pt-BR')}</li>
      </ul>
      <p>Acesse o painel administrativo para aprovar ou rejeitar este cadastro.</p>
    `;

    for (const admin of admins) {
      await this.sendEmail(admin.email, subject, html);
    }
  }

  static async sendMemberApproval(user) {
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

    await this.sendEmail(user.email, subject, html);
  }

  static async sendMemberRejection(user, reason) {
    const subject = 'Informações sobre seu Cadastro';
    const html = `
      <h2>Olá, ${user.name}</h2>
      <p>Infelizmente não foi possível aprovar seu cadastro no sistema de membros.</p>
      ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
      <p>Para mais informações, entre em contato com a administração da igreja.</p>
      <p>Deus abençoe!</p>
    `;

    await this.sendEmail(user.email, subject, html);
  }

  static async sendPasswordReset(email, resetToken) {
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

    await this.sendEmail(email, subject, html);
  }

  static async sendScheduleReminder(schedule, user) {
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

    await this.sendEmail(user.email, subject, html);
  }
}

module.exports = EmailService;