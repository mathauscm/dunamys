const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`Servidor rodando na porta ${PORT}`);
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📖 Documentação em http://localhost:${PORT}/api-docs`);
});