const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

// Log das queries em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e) => {
  logger.error('Erro no banco de dados:', e);
});

// Função para conectar ao banco
async function connectDatabase() {
  try {
    await prisma.$connect();
    logger.info('Conectado ao banco de dados PostgreSQL');
  } catch (error) {
    logger.error('Erro ao conectar ao banco:', error);
    process.exit(1);
  }
}

// Função para desconectar
async function disconnectDatabase() {
  await prisma.$disconnect();
  logger.info('Desconectado do banco de dados');
}

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase
};