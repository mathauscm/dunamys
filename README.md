<!-- Badges -->
![Build Status](https://img.shields.io/github/actions/workflow/status/mathauscm/dunamys/ci.yml)
![License](https://img.shields.io/github/license/mathauscm/dunamys)
![Issues](https://img.shields.io/github/issues/mathauscm/dunamys)
![Forks](https://img.shields.io/github/forks/mathauscm/dunamys)

# 🏛️ Sistema de Membros da Igreja

Sistema completo para gerenciamento de membros e escalas de serviço de igrejas, desenvolvido com Node.js, React e PostgreSQL.

## 📖 Sumário

- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação Rápida](#-instalação-rápida)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Configuração de Segurança](#-configuração-de-segurança)
- [Configuração de Email](#-configuração-de-email)
- [Configuração do WhatsApp](#-configuração-do-whatsapp)
- [Deploy em Produção](#-deploy-em-produção)
- [Monitoramento](#-monitoramento)
- [Testes](#-testes)
- [Backup e Restore](#-backup-e-restore)
- [Troubleshooting](#-troubleshooting)
- [API Documentation](#-api-documentation)
- [Contribuição](#-contribuição)
- [Suporte](#-suporte)
- [Licença](#-licença)
- [Agradecimentos](#-agradecimentos)
- [Roadmap](#-roadmap)

---

## 🔥 Demonstração

> 🚧 **Em desenvolvimento**: Screenshots e vídeos demonstrativos serão adicionados em breve.

**Preview das funcionalidades:**
- 📊 Dashboard com gráficos e estatísticas
- 📅 Calendário interativo de escalas
- 📱 Interface responsiva para mobile
- 🔔 Sistema de notificações em tempo real

## 🚀 Funcionalidades

### 👥 Para Membros
- **Dashboard**: Visão geral das próximas escalas
- **Escalas**: Visualizar todas as escalas (passadas e futuras)
- **Disponibilidade**: Definir períodos de indisponibilidade
- **Notificações**: Receber alertas por email e WhatsApp
- **Perfil**: Gerenciar dados pessoais

### 👨‍💼 Para Administradores
- **Dashboard**: Estatísticas e resumo do sistema
- **Gestão de Membros**: Aprovar, rejeitar e gerenciar membros
- **Gestão de Escalas**: Criar, editar e organizar escalas
- **Notificações**: Enviar comunicados personalizados
- **Logs**: Auditoria completa das ações

### 🔔 Sistema de Notificações
- **Email**: Notificações automáticas via SMTP
- **WhatsApp**: Integração com WhatsApp Web
- **Lembretes**: Alertas 1 dia antes do serviço

## 🛠️ Tecnologias

### Backend
- **Node.js** + **Express.js** - API REST
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **Redis** - Filas e cache
- **JWT** - Autenticação
- **Nodemailer** - Envio de emails
- **WhatsApp Web.js** - Integração WhatsApp
- **Bull** - Processamento de filas
- **Winston** - Logs
- **Swagger** - Documentação da API

### Frontend
- **React 18** + **Vite** - Interface moderna
- **TailwindCSS** - Estilização
- **React Router DOM** - Roteamento
- **React Hook Form** - Formulários
- **Axios** - Cliente HTTP
- **Context API** - Gerenciamento de estado

### Infraestrutura
- **Docker** + **Docker Compose** - Containerização
- **Nginx** - Proxy reverso
- **GitHub Actions** - CI/CD (opcional)

## 📋 Pré-requisitos

### Para Produção (Docker)
- [Docker](https://www.docker.com/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/) 2.0+
- [Git](https://git-scm.com/)
- **Mínimo**: 2GB RAM, 2 CPU cores, 20GB storage
- **Recomendado**: 4GB RAM, 4 CPU cores, 50GB storage

### Para Desenvolvimento
- [Node.js](https://nodejs.org/) 18+ 
- [PostgreSQL](https://www.postgresql.org/) 13+
- [Redis](https://redis.io/) 6+ (opcional)
- **RAM**: Mínimo 4GB, recomendado 8GB

## 🚀 Instalação Rápida

### 1. Clone o repositório
```bash
git clone https://github.com/mathauscm/dunamys.git
cd dunamys
```

### 2. Configure as variáveis de ambiente
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend  
cp frontend/.env.example frontend/.env
```

#### Variáveis Essenciais (Backend)

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `DATABASE_URL` | URL de conexão PostgreSQL | `postgresql://user:pass@localhost:5432/db` | ✅ |
| `JWT_SECRET` | Chave secreta para JWT | `sua_chave_super_secreta_aqui` | ✅ |
| `NODE_ENV` | Ambiente de execução | `development` ou `production` | ✅ |
| `PORT` | Porta do servidor | `5000` | ✅ |
| `SMTP_HOST` | Servidor SMTP | `smtp.gmail.com` | ❌ |
| `SMTP_USER` | Usuário SMTP | `seu_email@gmail.com` | ❌ |
| `SMTP_PASS` | Senha SMTP | `sua_senha_de_app` | ❌ |
| `REDIS_URL` | URL do Redis | `redis://localhost:6379` | ❌ |
| `WHATSAPP_ENABLED` | Habilitar WhatsApp | `true` ou `false` | ❌ |

#### Variáveis Essenciais (Frontend)

| Variável | Descrição | Exemplo | Obrigatório |
|----------|-----------|---------|-------------|
| `VITE_API_URL` | URL da API backend | `http://localhost:5000` | ✅ |
| `VITE_APP_NAME` | Nome da aplicação | `Sistema Igreja` | ❌ |

### 3. Inicie com Docker
```bash
# Desenvolvimento
docker-compose up -d

# Produção (com Nginx)
docker-compose --profile production up -d
```

### 4. Configure o banco de dados
```bash
# Execute as migrations
docker exec igreja-backend npm run migrate

# Execute o seed (dados iniciais)
docker exec igreja-backend npm run seed
```

### 5. Acesse o sistema
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Documentação**: http://localhost:5000/api-docs

### 6. Login inicial
```
Admin:
Email: admin@igreja.com
Senha: admin123

Membros de exemplo:
joao@email.com / 123456
maria@email.com / 123456
```

## 🔧 Desenvolvimento

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📁 Estrutura do Projeto

```
dunamys/
├── [backend/](backend/)                 # API Node.js
│   ├── [src/](backend/src/)
│   │   ├── [controllers/](backend/src/controllers/)
│   │   ├── [services/](backend/src/services/)
│   │   ├── [routes/](backend/src/routes/)
│   │   ├── [middlewares/](backend/src/middlewares/)
│   │   ├── [config/](backend/src/config/)
│   │   ├── [utils/](backend/src/utils/)
│   │   └── [jobs/](backend/src/jobs/)
│   ├── [prisma/](backend/prisma/)
│   ├── [tests/](backend/tests/)
│   └── [docs/](backend/docs/)
├── [frontend/](frontend/)                # Interface React
│   ├── [src/](frontend/src/)
│   │   ├── [components/](frontend/src/components/)
│   │   ├── [pages/](frontend/src/pages/)
│   │   ├── [services/](frontend/src/services/)
│   │   ├── [context/](frontend/src/context/)
│   │   ├── [hooks/](frontend/src/hooks/)
│   │   └── [utils/](frontend/src/utils/)
│   └── [public/](frontend/public/)
├── [nginx/](nginx/)                   # Configuração Nginx
├── [docker-compose.yml](docker-compose.yml)       # Orquestração
└── [README.md](README.md)               # Este arquivo
```

## ⚙️ Configuração Avançada

### 🔐 Segurança

#### Gerar JWT Secret
```bash
# Gere uma chave forte (64 caracteres)
openssl rand -base64 64
```

#### Segurança do Banco
```bash
# Em produção, sempre use senhas fortes
POSTGRES_PASSWORD=SuaSenhaSegura123!@#
```

#### Lista de Verificação de Segurança
- [ ] JWT_SECRET com pelo menos 64 caracteres
- [ ] Senhas do banco com caracteres especiais
- [ ] HTTPS habilitado em produção
- [ ] Firewall configurado (portas 80, 443, 22)
- [ ] Backup automatizado configurado

### 📧 Configuração de Email

#### Gmail (Recomendado)
1. **Ativar 2FA**: Acesse Configurações > Segurança
2. **Senha de App**: Gere em "Senhas de app"
3. **Configurar variáveis**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=seu_email@gmail.com
   SMTP_PASS=sua_senha_de_app_16_caracteres
   ```

#### Outros Provedores

| Provedor | Host | Porta | TLS |
|----------|------|-------|-----|
| **Outlook** | smtp-mail.outlook.com | 587 | ✅ |
| **Yahoo** | smtp.mail.yahoo.com | 587 | ✅ |
| **SendGrid** | smtp.sendgrid.net | 587 | ✅ |
| **Mailgun** | smtp.mailgun.org | 587 | ✅ |

#### Teste de Configuração
```bash
# Testar envio de email
curl -X POST http://localhost:5000/api/test/email \
  -H "Content-Type: application/json" \
  -d '{"to": "seu_email@teste.com"}'
```

### 📱 Configuração do WhatsApp

#### Configuração Inicial
1. **Ativar no .env**:
   ```env
   WHATSAPP_ENABLED=true
   ```

2. **Iniciar sistema**:
   ```bash
   docker-compose up -d
   ```

3. **Escanear QR Code**:
   ```bash
   # Visualizar logs em tempo real
   docker logs igreja-backend -f
   
   # Aguardar aparecer o QR Code e escanear com seu WhatsApp
   ```

4. **Verificar conexão**:
   ```bash
   # Status da conexão
   curl http://localhost:5000/api/whatsapp/status
   ```

#### Troubleshooting WhatsApp
```bash
# Limpar sessão e reconectar
rm -rf backend/whatsapp-session
docker restart igreja-backend

# Logs detalhados
docker logs igreja-backend --tail=100 | grep -i whatsapp
```

## 🚀 Deploy em Produção

### VPS/Servidor Dedicado

1. **Preparar servidor**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install docker.io docker-compose-plugin git

# CentOS/RHEL
sudo yum install docker docker-compose git
sudo systemctl start docker
```

2. **Clonar e configurar**
```bash
git clone https://github.com/mathauscm/dunamys.git
cd dunamys
cp backend/.env.example backend/.env
# Editar configurações de produção
```

3. **SSL com Let's Encrypt**
```bash
# Instalar certbot
sudo apt install certbot

# Gerar certificados
sudo certbot certonly --standalone -d seu-dominio.com
```

4. **Iniciar em produção**
```bash
docker-compose --profile production up -d
```

### Hospedagem na Nuvem

#### Hostinger VPS
1. Escolha um VPS com pelo menos 2GB RAM
2. Instale Docker
3. Configure domínio
4. Siga os passos de produção

#### DigitalOcean
1. Crie um Droplet Ubuntu
2. Configure firewall
3. Instale Docker
4. Deploy normalmente

#### AWS/Azure/GCP
1. Configure instância EC2/VM
2. Configure security groups
3. Use RDS para PostgreSQL (opcional)
4. Configure load balancer (opcional)

## 📊 Monitoramento

### Logs
```bash
# Backend logs
docker logs igreja-backend -f

# Frontend logs  
docker logs igreja-frontend -f

# Database logs
docker logs igreja-postgres -f
```

### Health Checks
- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000

### Métricas
```bash
# Status dos containers
docker stats

# Uso do banco
docker exec igreja-postgres psql -U postgres -d igreja_membros -c "SELECT * FROM pg_stat_activity;"
```

## 🧪 Testes

### Backend
```bash
cd backend
npm test                  # Todos os testes
npm run test:watch       # Modo watch
npm run test:coverage    # Com coverage
```

### Frontend
```bash
cd frontend
npm test
```

## 🔄 Backup e Restore

### 💾 Backup Automatizado

#### Script de Backup Diário
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Backup completo
docker exec igreja-postgres pg_dump -U postgres -c igreja_membros > $BACKUP_DIR/full_backup_$DATE.sql

# Backup apenas dados
docker exec igreja-postgres pg_dump -U postgres --data-only igreja_membros > $BACKUP_DIR/data_backup_$DATE.sql

# Manter apenas últimos 7 dias
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup realizado: $DATE"
```

#### Configurar Cron (Backup Automático)
```bash
# Adicionar ao crontab (backup diário às 2h)
crontab -e

# Adicionar linha:
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

### 🔄 Restore

#### Restore Completo
```bash
# Parar aplicação
docker stop igreja-backend

# Restore
docker exec -i igreja-postgres psql -U postgres igreja_membros < backup.sql

# Reiniciar
docker start igreja-backend
```

#### Restore de Dados Específicos
```bash
# Apenas dados (mantém estrutura)
docker exec -i igreja-postgres psql -U postgres igreja_membros < dados.sql
```

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Banco não conecta
```bash
# Verificar se o PostgreSQL está rodando
docker ps | grep postgres

# Verificar logs
docker logs igreja-postgres
```

#### 2. Frontend não carrega
```bash
# Verificar se o backend está acessível
curl http://localhost:5000/health

# Verificar proxy no Vite
# vite.config.js deve ter proxy configurado
```

#### 3. WhatsApp não conecta
```bash
# Limpar sessão
rm -rf backend/whatsapp-session

# Reiniciar backend
docker restart igreja-backend
```

#### 4. Emails não enviam
```bash
# Testar configuração SMTP
docker exec igreja-backend node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({...});
transporter.verify().then(console.log).catch(console.error);
"
```

### 🚀 Performance e Otimização

#### Backend
- **Redis Cache**:
  ```env
  REDIS_URL=redis://localhost:6379
  CACHE_TTL=3600
  ```
- **Connection Pooling**:
  ```env
  DATABASE_POOL_MIN=2
  DATABASE_POOL_MAX=10
  ```
- **Rate Limiting**:
  ```env
  RATE_LIMIT_WINDOW=15
  RATE_LIMIT_MAX=100
  ```

#### Frontend
- **Lazy Loading**: Componentes carregados sob demanda
- **Bundle Optimization**: Code splitting automático
- **Image Optimization**: WebP + compressão
- **CDN**: Configurar para assets estáticos

#### Monitoramento
```bash
# Métricas do sistema
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Métricas do banco
docker exec igreja-postgres psql -U postgres -d igreja_membros -c "
  SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del 
  FROM pg_stat_user_tables;
"
```

## 📚 API Documentation

A documentação completa da API está disponível via **Swagger UI**:
- **Desenvolvimento**: http://localhost:5000/api-docs
- **Produção**: https://seu-dominio.com/api-docs

### 🔑 Autenticação

Todos os endpoints (exceto login/register) requerem token JWT no header:
```bash
Authorization: Bearer seu_jwt_token_aqui
```

### 🚀 Principais Endpoints

#### 🔐 Autenticação
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `POST` | `/api/auth/login` | Login de usuário | ❌ |
| `POST` | `/api/auth/register` | Cadastro de membro | ❌ |
| `POST` | `/api/auth/refresh` | Renovar token | ✅ |
| `POST` | `/api/auth/logout` | Logout | ✅ |

#### 👥 Membros
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/members/profile` | Perfil do membro | ✅ |
| `PUT` | `/api/members/profile` | Atualizar perfil | ✅ |
| `GET` | `/api/members/schedules` | Escalas do membro | ✅ |
| `POST` | `/api/members/unavailability` | Definir indisponibilidade | ✅ |

#### 👨‍💼 Admin
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| `GET` | `/api/admin/dashboard` | Dashboard administrativo | Admin |
| `GET` | `/api/admin/members` | Listar todos os membros | Admin |
| `POST` | `/api/admin/schedules` | Criar nova escala | Admin |
| `PUT` | `/api/admin/members/:id/approve` | Aprovar membro | Admin |

### 📨 Exemplos de Uso

#### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@igreja.com",
    "password": "admin123"
  }'
```

#### Listar Escalas
```bash
curl -X GET http://localhost:5000/api/members/schedules \
  -H "Authorization: Bearer SEU_TOKEN"
```

## 🤝 Contribuição

> **Importante:** Todos os pull requests devem ser abertos para a branch `main`.
> 
> **Antes de contribuir**, leia nosso [Código de Conduta](CODE_OF_CONDUCT.md) e [Guia de Contribuição](CONTRIBUTING.md).

### Como contribuir:

1. Faça um fork deste repositório
2. Crie uma nova branch a partir da `main`:
   ```bash
   git checkout -b feature/nome-da-sua-feature
   ```
3. Implemente suas mudanças
4. Execute os testes:
   ```bash
   npm test
   ```
5. Faça commit das suas mudanças:
   ```bash
   git commit -m "feat: adiciona nova funcionalidade"
   ```
6. Faça push para sua branch:
   ```bash
   git push origin feature/nome-da-sua-feature
   ```
7. Abra um Pull Request

> **Dúvidas?** Abra uma [issue](https://github.com/mathauscm/dunamys/issues)

### Guidelines

- Use ESLint e Prettier
- Escreva testes para novas funcionalidades
- Documente mudanças significativas
- Siga o padrão de commits convencionais

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/mathauscm/dunamys/issues)
- **Discussões**: [GitHub Discussions](https://github.com/mathauscm/dunamys/discussions)
- **Email**: suporte@igreja.com

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- Comunidade open source
- Contribuidores do projeto
- Igrejas que forneceram feedback
- Desenvolvedores que testaram o sistema

---

---

<div align="center">

**Desenvolvido com ❤️ para servir à comunidade cristã**

*"E disse-lhes: Ide por todo o mundo, pregai o evangelho a toda criatura."* - Marcos 16:15

[![Estrelas](https://img.shields.io/github/stars/mathauscm/dunamys?style=social)](https://github.com/mathauscm/dunamys/stargazers)
[![Forks](https://img.shields.io/github/forks/mathauscm/dunamys?style=social)](https://github.com/mathauscm/dunamys/network/members)

</div>

## 🎯 Roadmap

### v2.0 (Próxima versão)
- [ ] Integração com calendário Google
- [ ] Relatórios avançados
- [ ] Multi-tenancy (várias igrejas)

### v1.1 (Melhorias)
- [ ] Dark mode
- [ ] PWA (Progressive Web App)
- [ ] Exportação de dados
- [ ] Webhooks
- [ ] Integração Slack/Discord
- [ ] Sistema de tags para membros
- [ ] Aprovação por líderes de ministério

Contribuições são bem-vindas! 🚀
