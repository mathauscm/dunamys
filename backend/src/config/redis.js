const redis = require('redis');
const logger = require('../utils/logger');

const client = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
});

client.on('connect', () => {
  logger.info('Conectado ao Redis');
});

client.on('error', (err) => {
  logger.error('Erro no Redis:', err);
});

async function connectRedis() {
  try {
    await client.connect();
  } catch (error) {
    logger.error('Erro ao conectar ao Redis:', error);
  }
}

module.exports = {
  client,
  connectRedis
};