const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verificar configuração do email
async function verifyEmailConfig() {
  try {
    await transporter.verify();
    logger.info('Configuração de email verificada com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro na configuração de email:', error);
    return false;
  }
}

module.exports = {
  transporter,
  verifyEmailConfig
};