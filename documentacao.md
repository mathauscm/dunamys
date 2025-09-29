# 📚 Documentação Técnica - Dunamys

## 📋 Índice
1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Diretórios](#estrutura-de-diretórios)
4. [Stack Tecnológica](#stack-tecnológica)
5. [Banco de Dados](#banco-de-dados)
6. [API Endpoints](#api-endpoints)
7. [Autenticação e Autorização](#autenticação-e-autorização)
8. [Serviços e Integrações](#serviços-e-integrações)
9. [Docker e Deploy](#docker-e-deploy)
10. [Variáveis de Ambiente](#variáveis-de-ambiente)
11. [Fluxos Principais](#fluxos-principais)
12. [Convenções de Código](#convenções-de-código)

---

## 🎯 Visão Geral

**Dunamys** é um sistema completo para gerenciamento de membros e escalas de serviço de igrejas.

### Funcionalidades Principais
- **Gestão de Membros**: Cadastro, aprovação e gerenciamento de voluntários
- **Sistema de Escalas**: Criação automática e manual de escalas de serviço
- **Disponibilidade**: Membros podem informar períodos de indisponibilidade
- **Notificações**: Email e WhatsApp para lembretes e comunicados
- **Dashboard Administrativo**: Estatísticas e visão geral do sistema
- **Área do Voluntário**: Interface para membros visualizarem suas escalas

### Usuários do Sistema
- **Admin Master**: Acesso total ao sistema (email configurado em `.env`)
- **Administradores**: Podem gerenciar membros e escalas
- **Membros/Voluntários**: Visualizam suas escalas e gerenciam disponibilidade

---

## 🏗️ Arquitetura

### Arquitetura Geral
```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Nginx     │─────▶│   Frontend  │      │   Backend   │
│   (Proxy)   │      │   (React)   │─────▶│  (Node.js)  │
└─────────────┘      └─────────────┘      └──────┬──────┘
                                                  │
                                    ┌─────────────┼─────────────┐
                                    │             │             │
                              ┌─────▼────┐  ┌────▼────┐  ┌────▼────┐
                              │PostgreSQL│  │  Redis  │  │WhatsApp │
                              └──────────┘  └─────────┘  └─────────┘
```

### Comunicação
- **Frontend ↔ Backend**: REST API via Axios
- **Backend ↔ Database**: Prisma ORM
- **Backend ↔ Redis**: Filas (Bull) e cache
- **Backend ↔ WhatsApp**: whatsapp-web.js

### Camadas do Backend
```
Routes → Middlewares → Controllers → Services → Database
                ↓
            Validation (Joi)
```

---

## 📁 Estrutura de Diretórios

### Backend (`/backend`)
```
backend/
├── src/
│   ├── app.js                    # Configuração principal do Express
│   ├── controllers/              # Controladores (lógica de requisições)
│   │   ├── authController.js     # Autenticação (login, register)
│   │   ├── memberController.js   # Gestão de membros
│   │   ├── scheduleController.js # Gestão de escalas
│   │   ├── adminController.js    # Funções administrativas
│   │   └── notificationController.js # Notificações
│   ├── services/                 # Lógica de negócio
│   │   ├── authService.js
│   │   ├── memberService.js
│   │   ├── scheduleService.js
│   │   ├── emailService.js       # Envio de emails
│   │   ├── whatsappService.js    # Integração WhatsApp
│   │   └── notificationService.js
│   ├── routes/                   # Definição de rotas
│   │   ├── authRoutes.js
│   │   ├── memberRoutes.js
│   │   ├── scheduleRoutes.js
│   │   └── adminRoutes.js
│   ├── middlewares/              # Middlewares
│   │   ├── auth.js               # Verificação de JWT
│   │   ├── adminAuth.js          # Verificação de admin
│   │   ├── validation.js         # Validação de dados
│   │   └── errorHandler.js       # Tratamento de erros
│   ├── config/                   # Configurações
│   │   ├── database.js           # Prisma client
│   │   ├── redis.js              # Cliente Redis
│   │   └── swagger.js            # Documentação API
│   ├── jobs/                     # Jobs assíncronos (Bull)
│   │   ├── emailQueue.js         # Fila de emails
│   │   └── notificationQueue.js  # Fila de notificações
│   └── utils/                    # Utilitários
│       ├── logger.js             # Winston logger
│       ├── validators.js         # Schemas Joi
│       └── helpers.js            # Funções auxiliares
├── prisma/
│   ├── schema.prisma             # Schema do banco de dados
│   ├── seed.js                   # Dados iniciais
│   └── migrations/               # Migrações do banco
├── tests/                        # Testes
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── logs/                         # Logs da aplicação
├── uploads/                      # Arquivos uploadados
├── whatsapp-session/             # Sessão do WhatsApp
├── Dockerfile
├── package.json
└── server.js                     # Entry point
```

### Frontend (`/frontend`)
```
frontend/
├── src/
│   ├── components/               # Componentes reutilizáveis
│   │   ├── common/               # Componentes genéricos
│   │   │   ├── Button.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── Input.jsx
│   │   ├── layout/               # Layout components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Footer.jsx
│   │   └── features/             # Componentes por feature
│   │       ├── schedules/
│   │       ├── members/
│   │       └── admin/
│   ├── pages/                    # Páginas (rotas)
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── MemberDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── Schedules.jsx
│   │   ├── Members.jsx
│   │   └── Profile.jsx
│   ├── services/                 # Serviços de API
│   │   ├── api.js                # Configuração Axios
│   │   ├── authService.js
│   │   ├── memberService.js
│   │   ├── scheduleService.js
│   │   └── adminService.js
│   ├── context/                  # Context API
│   │   ├── AuthContext.jsx       # Contexto de autenticação
│   │   └── ThemeContext.jsx      # Contexto de tema
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.js
│   │   ├── useApi.js
│   │   └── useNotification.js
│   ├── utils/                    # Utilitários
│   │   ├── helpers.js
│   │   ├── validators.js
│   │   └── constants.js
│   ├── styles/                   # Estilos globais
│   │   └── index.css
│   ├── App.jsx                   # Componente principal
│   └── main.jsx                  # Entry point
├── public/
│   ├── telas/                    # Screenshots do sistema
│   └── assets/                   # Imagens e ícones
├── Dockerfile
├── package.json
└── vite.config.js
```

### Raiz do Projeto
```
dunamys/
├── backend/                      # Backend Node.js
├── frontend/                     # Frontend React
├── nginx.conf                    # Configuração Nginx interno
├── nginx-final.conf              # Configuração Nginx VPS
├── docker-compose.yml            # Orquestração Docker
├── .env                          # Variáveis de ambiente (dev)
├── .env.production               # Variáveis de ambiente (prod)
├── README.md                     # Documentação geral
├── deploy.md                     # Guia de deploy
├── instrucao.md                  # Instruções de Nginx/VPS
└── documentacao.md               # Este arquivo
```

---

## 🛠️ Stack Tecnológica

### Backend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 18+ | Runtime JavaScript |
| **Express.js** | ^4.18 | Framework web |
| **PostgreSQL** | 15 | Banco de dados relacional |
| **Prisma** | ^5.2 | ORM |
| **Redis** | 7 | Cache e filas |
| **Bull** | ^4.11 | Processamento de filas |
| **JWT** | ^9.0 | Autenticação |
| **Bcrypt** | ^2.4 | Hash de senhas |
| **Joi** | ^17.9 | Validação de dados |
| **Nodemailer** | ^6.9 | Envio de emails |
| **WhatsApp Web.js** | ^1.21 | Integração WhatsApp |
| **Winston** | ^3.10 | Sistema de logs |
| **Swagger** | ^6.2 | Documentação API |
| **Helmet** | ^7.0 | Segurança HTTP |
| **CORS** | ^2.8 | Cross-Origin Resource Sharing |

### Frontend
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | ^18.2 | Biblioteca UI |
| **Vite** | ^4.4 | Build tool |
| **React Router DOM** | ^6.15 | Roteamento |
| **Axios** | ^1.5 | Cliente HTTP |
| **TailwindCSS** | ^3.3 | Framework CSS |
| **React Hook Form** | ^7.45 | Gerenciamento de formulários |
| **React Toastify** | ^9.1 | Notificações toast |
| **Lucide React** | ^0.263 | Ícones |
| **date-fns** | ^2.30 | Manipulação de datas |

### Infraestrutura
| Tecnologia | Uso |
|------------|-----|
| **Docker** | Containerização |
| **Docker Compose** | Orquestração de containers |
| **Nginx** | Proxy reverso |
| **Ubuntu/Debian** | Sistema operacional (VPS) |

---

## 🗄️ Banco de Dados

### Models Principais (Prisma Schema)

#### User
```prisma
model User {
  id           Int       @id @default(autoincrement())
  email        String    @unique
  password     String
  name         String
  phone        String?
  role         Role      @default(MEMBER)
  status       Status    @default(PENDING)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  schedules    Schedule[]
  unavailability Unavailability[]
}
```

#### Schedule (Escala)
```prisma
model Schedule {
  id           Int       @id @default(autoincrement())
  title        String
  description  String?
  date         DateTime
  startTime    String
  endTime      String
  function     String
  status       ScheduleStatus @default(PENDING)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  userId       Int
  user         User      @relation(fields: [userId], references: [id])
}
```

#### Unavailability (Indisponibilidade)
```prisma
model Unavailability {
  id           Int       @id @default(autoincrement())
  startDate    DateTime
  endDate      DateTime
  reason       String?
  createdAt    DateTime  @default(now())

  userId       Int
  user         User      @relation(fields: [userId], references: [id])
}
```

### Enums
```prisma
enum Role {
  ADMIN
  MEMBER
}

enum Status {
  PENDING    // Aguardando aprovação
  APPROVED   // Aprovado
  REJECTED   // Rejeitado
  INACTIVE   // Inativo
}

enum ScheduleStatus {
  PENDING    // Escala criada
  CONFIRMED  // Membro confirmou
  CANCELLED  // Escala cancelada
  COMPLETED  // Escala concluída
}
```

### Relacionamentos
- **User** tem muitos **Schedule** (1:N)
- **User** tem muitos **Unavailability** (1:N)

---

## 🔌 API Endpoints

### Base URL
- **Desenvolvimento**: `http://localhost:5000/api`
- **Produção**: `http://69.62.90.202/dunamys/api`

### Autenticação (`/api/auth`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/login` | Login de usuário | ❌ |
| POST | `/register` | Cadastro de novo membro | ❌ |
| POST | `/refresh` | Renovar token JWT | ✅ |
| POST | `/logout` | Logout | ✅ |
| GET | `/me` | Dados do usuário logado | ✅ |

### Membros (`/api/members`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/profile` | Perfil do membro | ✅ Member |
| PUT | `/profile` | Atualizar perfil | ✅ Member |
| GET | `/schedules` | Escalas do membro | ✅ Member |
| POST | `/unavailability` | Criar indisponibilidade | ✅ Member |
| GET | `/unavailability` | Listar indisponibilidades | ✅ Member |
| DELETE | `/unavailability/:id` | Remover indisponibilidade | ✅ Member |

### Escalas (`/api/schedules`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar todas as escalas | ✅ |
| GET | `/:id` | Detalhes de uma escala | ✅ |
| POST | `/` | Criar escala | ✅ Admin |
| PUT | `/:id` | Atualizar escala | ✅ Admin |
| DELETE | `/:id` | Deletar escala | ✅ Admin |
| POST | `/:id/confirm` | Confirmar presença | ✅ Member |
| POST | `/:id/cancel` | Cancelar escala | ✅ Admin |

### Administração (`/api/admin`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/dashboard` | Estatísticas gerais | ✅ Admin |
| GET | `/members` | Listar todos os membros | ✅ Admin |
| GET | `/members/pending` | Membros pendentes | ✅ Admin |
| PUT | `/members/:id/approve` | Aprovar membro | ✅ Admin |
| PUT | `/members/:id/reject` | Rejeitar membro | ✅ Admin |
| DELETE | `/members/:id` | Deletar membro | ✅ Admin |
| POST | `/notifications` | Enviar notificação | ✅ Admin |

### Notificações (`/api/notifications`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/` | Listar notificações | ✅ |
| POST | `/send` | Enviar notificação | ✅ Admin |
| PUT | `/:id/read` | Marcar como lida | ✅ |

### WhatsApp (`/api/whatsapp`)
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/status` | Status da conexão | ✅ Admin |
| GET | `/qr` | Obter QR Code | ✅ Admin |
| POST | `/disconnect` | Desconectar | ✅ Admin |

### Health Check
| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/health` | Status da API | ❌ |

---

## 🔐 Autenticação e Autorização

### JWT (JSON Web Token)
- **Algoritmo**: HS256
- **Expiração**: Configurável via `JWT_EXPIRES_IN` (padrão: 7d)
- **Payload**:
  ```json
  {
    "id": 1,
    "email": "user@exemplo.com",
    "role": "MEMBER"
  }
  ```

### Middleware de Autenticação (`auth.js`)
```javascript
// Verifica se o token JWT é válido
// Anexa dados do usuário em req.user
// Usado em todas as rotas protegidas
```

### Middleware de Admin (`adminAuth.js`)
```javascript
// Verifica se o usuário é ADMIN ou MASTER_ADMIN
// Usado apenas em rotas administrativas
```

### Master Admin
- **Email configurado em**: `MASTER_ADMIN_EMAIL` no `.env`
- **Acesso total**: Pode gerenciar todos os recursos
- **Criado automaticamente**: No seed do banco

### Hierarquia de Permissões
```
Master Admin (email configurado) → Admin → Member → Pending Member
       ↓                             ↓        ↓           ↓
  Acesso total              Gestão parcial  Básico   Sem acesso
```

---

## 🔗 Serviços e Integrações

### Email Service (`emailService.js`)
**Provedor**: Nodemailer (SMTP)

**Tipos de Email**:
- Welcome email (novo cadastro)
- Aprovação de membro
- Rejeição de cadastro
- Nova escala atribuída
- Lembrete de escala (1 dia antes)
- Cancelamento de escala

**Configuração**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_app_16_caracteres
```

### WhatsApp Service (`whatsappService.js`)
**Biblioteca**: whatsapp-web.js

**Funcionalidades**:
- Conexão via QR Code
- Envio de mensagens individuais
- Envio de mensagens em massa
- Lembretes automáticos de escalas
- Status de conexão

**Sessão**:
- Salva em: `backend/whatsapp-session/`
- Mantém sessão entre restarts

**Habilitação**:
```env
WHATSAPP_ENABLED=true
```

### Notification Queue (`notificationQueue.js`)
**Biblioteca**: Bull + Redis

**Filas**:
- `email-queue`: Fila de emails
- `whatsapp-queue`: Fila de mensagens WhatsApp
- `reminder-queue`: Lembretes automáticos

**Processamento**:
- Assíncrono
- Retry automático em caso de falha
- Logging de erros

### Logger Service (`logger.js`)
**Biblioteca**: Winston

**Níveis de Log**:
- `error`: Erros críticos
- `warn`: Avisos
- `info`: Informações gerais
- `debug`: Debugging (apenas dev)

**Destinos**:
- Console (desenvolvimento)
- Arquivo `logs/app.log` (produção)
- Arquivo `logs/error.log` (apenas erros)

---

## 🐳 Docker e Deploy

### Containers
```yaml
services:
  backend:       # Node.js API (porta interna 5000)
  frontend:      # React app (servido pelo Nginx)
  nginx:         # Proxy reverso (porta 8080)
  postgres:      # Database (porta 5435 externa, 5432 interna)
  redis:         # Cache/Filas (porta 6381 externa, 6379 interna)
```

### Network
- **Nome**: `dunamys-network`
- **Driver**: bridge
- **Comunicação interna**: Via nome do container

### Volumes
- `postgres_data`: Dados do PostgreSQL
- `redis_data`: Dados do Redis
- `./backend/logs`: Logs da aplicação
- `./backend/whatsapp-session`: Sessão WhatsApp
- `./backend/uploads`: Arquivos uploadados

### Portas Expostas
```
8080  → Nginx (acesso externo ao sistema)
5435  → PostgreSQL (acesso externo ao banco)
6381  → Redis (acesso externo ao Redis)
```

### Deploy na VPS
**IP da VPS**: `69.62.90.202`

**Estrutura de URLs**:
```
http://69.62.90.202/            → Dashboard de projetos
http://69.62.90.202/dunamys     → Sistema Dunamys
```

**Nginx VPS** (`/etc/nginx/sites-available/multiprojetos`):
```nginx
location /dunamys {
    proxy_pass http://127.0.0.1:8080;
    # ... configurações de proxy
}
```

**Comandos de Deploy**:
```bash
# Build e iniciar
docker compose --env-file .env.production up --build -d

# Migrar banco
docker compose exec backend npx prisma migrate deploy

# Popular banco
docker compose exec backend npm run seed

# Ver logs
docker compose logs -f
```

---

## ⚙️ Variáveis de Ambiente

### Backend (`.env` ou `.env.production`)

#### Essenciais
```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@postgres:5432/dunamys_prod
JWT_SECRET=chave_super_secreta_64_caracteres_minimo
MASTER_ADMIN_EMAIL=mathauscarvalho@gmail.com
```

#### Frontend URL (CORS)
```env
FRONTEND_URL=http://69.62.90.202
```

#### Redis
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379
```

#### Email (Opcional)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=senha_de_app
SMTP_FROM=Sistema Dunamys <noreply@dunamys.com>
```

#### WhatsApp (Opcional)
```env
WHATSAPP_ENABLED=true
WHATSAPP_SESSION_PATH=./whatsapp-session
```

#### Logging
```env
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

#### JWT
```env
JWT_SECRET=sua_chave_secreta_muito_forte_aqui
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
```

#### Database (Docker Compose)
```env
POSTGRES_DB=igreja_membros
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=Sistema Dunamys
VITE_MASTER_ADMIN_EMAIL=mathauscarvalho@gmail.com
```

**Produção**:
```env
VITE_API_URL=http://69.62.90.202/dunamys
```

---

## 🔄 Fluxos Principais

### 1. Cadastro de Novo Membro
```
1. Usuário preenche formulário de registro
2. POST /api/auth/register
3. Backend cria usuário com status PENDING
4. Email de boas-vindas enviado (via fila)
5. Admin recebe notificação de novo cadastro
6. Admin aprova ou rejeita no painel
7. PUT /api/admin/members/:id/approve
8. Status alterado para APPROVED
9. Email de aprovação enviado ao membro
10. Membro pode fazer login
```

### 2. Criação de Escala
```
1. Admin acessa painel de escalas
2. Preenche formulário (data, função, membro)
3. POST /api/schedules
4. Backend verifica disponibilidade do membro
5. Escala criada com status PENDING
6. Notificação enviada ao membro (email + WhatsApp)
7. Membro visualiza escala no dashboard
8. Membro confirma: POST /api/schedules/:id/confirm
9. Status alterado para CONFIRMED
```

### 3. Definir Indisponibilidade
```
1. Membro acessa "Minha Disponibilidade"
2. Seleciona período de indisponibilidade
3. POST /api/members/unavailability
4. Backend salva indisponibilidade
5. Sistema impede alocação de escalas nesse período
6. Admin é notificado da indisponibilidade
```

### 4. Lembrete Automático de Escala
```
1. Job diário verifica escalas para o próximo dia
2. Para cada escala CONFIRMED:
   a. Email enviado (via fila)
   b. WhatsApp enviado (via fila)
3. Log de notificações enviadas
```

### 5. Autenticação
```
1. POST /api/auth/login (email + senha)
2. Backend valida credenciais
3. Verifica se status é APPROVED
4. Gera JWT token
5. Retorna: { token, user: { id, email, role } }
6. Frontend armazena token no localStorage
7. Token enviado em todas as requisições:
   Authorization: Bearer <token>
```

---

## 📝 Convenções de Código

### Backend

#### Estrutura de Controller
```javascript
const functionName = async (req, res, next) => {
  try {
    // 1. Extrair dados da requisição
    const { param } = req.body;
    const userId = req.user.id;

    // 2. Validar dados (Joi)
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    // 3. Chamar service
    const result = await service.functionName(param, userId);

    // 4. Retornar resposta
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
```

#### Estrutura de Service
```javascript
const functionName = async (param, userId) => {
  // 1. Lógica de negócio
  // 2. Interação com banco (Prisma)
  // 3. Retornar dados ou lançar erro

  return result;
};
```

#### Tratamento de Erros
```javascript
// Erros customizados
throw new Error('MEMBER_NOT_FOUND');
throw new Error('UNAUTHORIZED');
throw new Error('INVALID_CREDENTIALS');

// Capturados pelo errorHandler middleware
```

#### Nomenclatura
- **Arquivos**: camelCase (`memberController.js`)
- **Funções**: camelCase (`getMemberProfile`)
- **Classes**: PascalCase (`EmailService`)
- **Constantes**: UPPER_SNAKE_CASE (`JWT_SECRET`)

### Frontend

#### Estrutura de Componente
```jsx
import React from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  // 1. Hooks (useState, useEffect, etc)
  // 2. Handlers
  // 3. Render

  return (
    <div className="tailwind-classes">
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

#### Nomenclatura
- **Componentes**: PascalCase (`MemberCard.jsx`)
- **Funções**: camelCase (`handleSubmit`)
- **Variáveis**: camelCase (`isLoading`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)

#### Estrutura de Service
```javascript
import api from './api';

export const serviceFunction = async (data) => {
  const response = await api.post('/endpoint', data);
  return response.data;
};
```

### Git Commit Messages
Seguir convenção [Conventional Commits](https://www.conventionalcommits.org/):
```
feat: adiciona funcionalidade X
fix: corrige bug Y
docs: atualiza documentação
style: formatação de código
refactor: refatora módulo Z
test: adiciona testes
chore: atualiza dependências
```

---

## 🚀 Comandos Úteis

### Desenvolvimento Local
```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev

# Banco (Prisma)
npx prisma migrate dev
npx prisma generate
npx prisma studio
npm run seed
```

### Docker
```bash
# Subir containers
docker compose up -d

# Rebuild
docker compose up --build -d

# Ver logs
docker compose logs -f [service]

# Executar comando em container
docker compose exec backend npm run seed

# Parar containers
docker compose down

# Remover volumes
docker compose down -v
```

### Produção (VPS)
```bash
# Deploy completo
docker compose --env-file .env.production up --build -d
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed

# Atualizar código
git pull origin main
docker compose up --build -d

# Backup database
docker compose exec postgres pg_dump -U postgres dunamys_prod > backup.sql

# Restore database
docker compose exec -i postgres psql -U postgres dunamys_prod < backup.sql

# Ver logs
docker compose logs -f backend
```

### Nginx (VPS)
```bash
# Testar configuração
sudo nginx -t

# Recarregar
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. WhatsApp não conecta
```bash
# Limpar sessão
rm -rf backend/whatsapp-session
docker compose restart backend
# Verificar logs para QR Code
docker compose logs backend -f
```

#### 2. Database connection error
```bash
# Verificar se PostgreSQL está rodando
docker compose ps postgres
# Verificar variável DATABASE_URL
docker compose exec backend printenv | grep DATABASE
```

#### 3. Frontend não carrega
```bash
# Verificar se backend está acessível
curl http://localhost:5000/health
# Verificar variável VITE_API_URL
cat frontend/.env
```

#### 4. Emails não enviam
```bash
# Verificar configuração SMTP
docker compose exec backend node -e "console.log(process.env.SMTP_HOST)"
# Ver fila de emails
docker compose exec redis redis-cli KEYS "*"
```

---

## 📊 Métricas e Monitoramento

### Health Checks
- **Backend**: `GET /health`
  ```json
  {
    "status": "ok",
    "timestamp": "2025-09-29T12:00:00Z",
    "uptime": 3600
  }
  ```

### Logs
- **Localização**: `backend/logs/`
- **Rotação**: Diária
- **Retenção**: 7 dias

### Métricas Docker
```bash
# CPU e Memória
docker stats

# Espaço em disco
docker system df
```

---

## 🔒 Segurança

### Checklist de Segurança
- [x] JWT com secret forte (64+ caracteres)
- [x] Senhas hashadas com bcrypt (10 rounds)
- [x] Helmet.js para headers de segurança
- [x] CORS configurado
- [x] Rate limiting (100 req/15min)
- [x] Validação de inputs (Joi)
- [x] SQL injection protection (Prisma)
- [x] XSS protection
- [ ] HTTPS em produção (pendente certificado SSL)
- [x] Variáveis sensíveis em .env (não commitadas)

### Variáveis Sensíveis (NUNCA commitadas)
- `JWT_SECRET`
- `POSTGRES_PASSWORD`
- `SMTP_PASS`
- Qualquer API key ou token

---

## 📞 Contatos e Links

- **Repositório**: https://github.com/mathauscm/dunamys
- **Admin Master**: mathauscarvalho@gmail.com
- **VPS IP**: 69.62.90.202
- **URL Produção**: http://69.62.90.202/dunamys

---

**Última atualização**: 2025-09-29
**Versão**: 1.0.0