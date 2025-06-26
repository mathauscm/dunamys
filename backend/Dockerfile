FROM node:18-slim

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Configurar Puppeteer para usar o Chromium instalado
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código fonte
COPY . .

# Criar diretório de logs
RUN mkdir -p logs

# Expor porta
EXPOSE 5000

# Comando para executar
CMD ["npm", "start"]

// ===== BACKEND/DOCKER-COMPOSE.YML =====
version: '3.8'

services:
  # Banco de dados PostgreSQL
  postgres:
    image: postgres:15-alpine
    container_name: igreja-postgres
    environment:
      POSTGRES_DB: igreja_membros
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - igreja-network

  # Redis para filas
  redis:
    image: redis:7-alpine
    container_name: igreja-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - igreja-network

  # Backend API
  backend:
    build: .
    container_name: igreja-backend
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://postgres:postgres123@postgres:5432/igreja_membros?schema=public
      REDIS_HOST: redis
      REDIS_PORT: 6379
      JWT_SECRET: sua_chave_secreta_super_forte_aqui
      SMTP_HOST: smtp.gmail.com
      SMTP_PORT: 587
      SMTP_USER: seu_email@gmail.com
      SMTP_PASS: sua_senha_de_app
    depends_on:
      - postgres
      - redis
    volumes:
      - ./logs:/app/logs
      - ./whatsapp-session:/app/whatsapp-session
    networks:
      - igreja-network
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:

networks:
  igreja-network:
    driver: bridge
