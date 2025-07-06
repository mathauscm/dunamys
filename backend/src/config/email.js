const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Verificar se as variáveis de email estão configuradas
const isEmailConfigured = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

// Criar transporter apenas se email estiver configurado
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
} else {
  logger.warn('Email não configurado - transporter não criado');
  
  // Criar transporter mock para evitar erros
  transporter = {
    sendMail: async () => {
      throw new Error('Email não configurado');
    },
    verify: async () => {
      throw new Error('Email não configurado');
    }
  };
}

// Verificar configuração do email
async function verifyEmailConfig() {
  if (!isEmailConfigured()) {
    logger.warn('Variáveis de email não configuradas:', {
      SMTP_HOST: !!process.env.SMTP_HOST,
      SMTP_USER: !!process.env.SMTP_USER,
      SMTP_PASS: !!process.env.SMTP_PASS
    });
    throw new Error('Credenciais de email não configuradas');
  }

  try {
    await transporter.verify();
    logger.info('Configuração de email verificada com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro na configuração de email:', error.message);
    throw error;
  }
}

module.exports = {
  transporter,
  verifyEmailConfig,
  isEmailConfigured
};