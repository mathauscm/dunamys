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

<!-- Adicione aqui prints ou GIFs da interface do sistema -->
<!-- Exemplo: -->
<!-- ![Tela de login](docs/login-screen.png) -->

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

- [Docker](https://www.docker.com/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/) 2.0+
- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) 18+ (para desenvolvimento)

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

# Edite os arquivos .env com suas configurações
```

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

## 🔐 Configuração de Segurança

### 1. JWT Secret
```bash
# Gere uma chave forte
openssl rand -base64 64
```

### 2. Banco de Dados
```bash
# Em produção, use senhas fortes
POSTGRES_PASSWORD=sua_senha_super_forte
```

### 3. Email SMTP
```bash
# Configure com suas credenciais
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app
```

## 📧 Configuração de Email

### Gmail
1. Ative a verificação em 2 etapas
2. Gere uma senha de app
3. Use a senha de app no `SMTP_PASS`

### Outros provedores
- **Outlook**: smtp-mail.outlook.com:587
- **Yahoo**: smtp.mail.yahoo.com:587
- **SendGrid**: smtp.sendgrid.net:587

## 📱 Configuração do WhatsApp

1. Inicie o sistema
2. Acesse os logs do backend:
```bash
docker logs igreja-backend -f
```
3. Escaneie o QR Code que aparecerá
4. O WhatsApp ficará conectado

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

### Backup do Banco
```bash
# Backup automático
docker exec igreja-postgres pg_dump -U postgres igreja_membros > backup_$(date +%Y%m%d).sql

# Backup com dados
docker exec igreja-postgres pg_dump -U postgres --data-only igreja_membros > dados_$(date +%Y%m%d).sql
```

### Restore
```bash
# Restore completo
docker exec -i igreja-postgres psql -U postgres igreja_membros < backup.sql

# Restore apenas dados
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

### Performance

#### Otimizações Backend
- Use Redis para cache
- Configure connection pooling
- Ative compressão gzip
- Configure rate limiting

#### Otimizações Frontend
- Use lazy loading
- Otimize imagens
- Configure CDN
- Minifique assets

## 📚 API Documentation

A documentação completa da API está disponível em:
- **Desenvolvimento**: http://localhost:5000/api-docs
- **Produção**: https://seu-dominio.com/api-docs

### Principais Endpoints

#### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Cadastro
- `POST /api/auth/refresh` - Renovar token

#### Membros
- `GET /api/members/profile` - Perfil do membro
- `GET /api/members/schedules` - Escalas do membro
- `POST /api/members/unavailability` - Definir indisponibilidade

#### Admin
- `GET /api/admin/dashboard` - Dashboard administrativo
- `GET /api/admin/members` - Listar membros
- `POST /api/admin/schedules` - Criar escala

## 🤝 Contribuição

> **Importante:** Todos os pull requests devem ser abertos para a branch `main`.

### Como contribuir:

1. Faça um fork deste repositório
2. Crie uma nova branch a partir da `main`:
   ```bash
   git checkout -b feature/nome-da-sua-feature

> - Dúvidas? Abra uma [issue](https://github.com/mathauscm/dunamys/issues)

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

**Desenvolvido com ❤️ para servir à comunidade cristã Dunamys**

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
