# Documentação Técnica Completa - Sistema Dunamys

## 1. Visão Geral do Projeto

**Nome:** Dunamys - Sistema de Gerenciamento de Membros e Escalas para Igreja

**Descrição:** Sistema completo de gerenciamento de voluntários e escalas de serviço para igrejas, permitindo controle de membros, ministérios, funções, escalas e notificações automatizadas via WhatsApp.

**Arquitetura:** Aplicação full-stack com arquitetura de microserviços

**Tecnologias Principais:**
- **Backend:** Node.js + Express.js
- **Frontend:** React + Vite
- **Banco de Dados:** PostgreSQL
- **ORM:** Prisma
- **Cache/Queue:** Redis + Bull
- **Autenticação:** JWT
- **Notificações:** WhatsApp Web.js (microserviço separado)
- **Containerização:** Docker + Docker Compose
- **Proxy Reverso:** Nginx

**Autor:** Mathaus Dev

**Versão:** 1.0.0

**Node Version:** 22.16.0

---

## 2. Arquitetura do Sistema

### 2.1 Estrutura de Alto Nível

```
┌─────────────────┐
│   Nginx Proxy   │  (Porta 8080)
└────────┬────────┘
         │
    ┌────┴────────────────┬──────────────┐
    │                     │              │
┌───▼────┐         ┌──────▼────┐   ┌────▼─────┐
│Frontend│         │  Backend  │   │ WhatsApp │
│(React) │         │(Express)  │   │ Service  │
│Porta   │         │Porta 5000 │   │Porta 3000│
│Interna │         └─────┬─────┘   └────┬─────┘
└────────┘               │              │
                    ┌────┴──────┬───────┘
                    │           │
             ┌──────▼────┐  ┌───▼────┐
             │PostgreSQL │  │ Redis  │
             │Porta 5435 │  │Port6381│
             └───────────┘  └────────┘
```

### 2.2 Serviços Docker

**Serviços Definidos (docker-compose.yml):**

1. **backend** - API principal
   - Build: `./backend/Dockerfile`
   - Container: `dunamys-backend`
   - Porta: 5000 (interna)
   - Volumes: logs, whatsapp-session, uploads
   - Dependências: postgres, redis

2. **frontend** - Interface React
   - Build: `./frontend/Dockerfile`
   - Container: `dunamys-frontend`
   - Dependência: backend

3. **nginx** - Proxy reverso
   - Imagem: `nginx:alpine`
   - Container: `dunamys-nginx`
   - Porta: 8080 (exposta)
   - Config: `nginx.conf`

4. **postgres** - Banco de dados
   - Imagem: `postgres:15-alpine`
   - Container: `dunamys-postgres`
   - Porta: 5435 (host) -> 5432 (container)
   - Database: `igreja_membros`
   - Volume: `postgres_data`

5. **redis** - Cache e filas
   - Imagem: `redis:7-alpine`
   - Container: `dunamys-redis`
   - Porta: 6381 (host) -> 6379 (container)
   - Volume: `redis_data`

6. **whatsapp** - Microserviço WhatsApp
   - Build: `./backend/whatsapp/Dockerfile`
   - Container: `dunamys-whatsapp`
   - Porta: 3000 (apenas interna)
   - Volumes: whatsapp_session, whatsapp_temp
   - Recursos: 2GB RAM, SYS_ADMIN capability

**Rede:** `dunamys-network` (bridge driver)

---

## 3. Estrutura de Diretórios

### 3.1 Backend (`/root/dunamys/backend`)

```
backend/
├── docs/
│   └── swagger.js                    # Configuração Swagger/OpenAPI
├── logs/                             # Logs da aplicação
├── prisma/
│   ├── schema.prisma                 # Schema do banco de dados
│   ├── migrations/                   # Migrações do Prisma
│   └── seed.sql                      # Dados iniciais
├── src/
│   ├── config/
│   │   ├── database.js               # Configuração Prisma Client
│   │   ├── cors.js                   # Configuração CORS
│   │   ├── middleware.js             # Middlewares globais
│   │   ├── email.js                  # Configuração SMTP
│   │   ├── redis.js                  # Conexão Redis
│   │   └── rateLimit.js              # Rate limiting
│   ├── controllers/
│   │   ├── AuthController.js         # Autenticação
│   │   ├── AdminController.js        # Operações admin
│   │   ├── CampusController.js       # Gerenciamento de campus
│   │   ├── FunctionController.js     # Funções e grupos
│   │   ├── MinistryController.js     # Ministérios
│   │   ├── MemberController.js       # Operações de membros
│   │   └── ScheduleController.js     # Escalas
│   ├── jobs/
│   │   ├── emailQueue.js             # Fila de emails (Bull)
│   │   └── whatsappQueue.js          # Fila WhatsApp (Bull)
│   ├── middlewares/
│   │   ├── auth.js                   # Autenticação JWT
│   │   ├── admin.js                  # Verificação admin
│   │   ├── groupAdmin.js             # Admin de grupo
│   │   ├── validation.js             # Validação Joi
│   │   └── errorHandler.js           # Tratamento de erros
│   ├── routes/
│   │   ├── auth.js                   # Rotas de autenticação
│   │   ├── admin.js                  # Rotas administrativas
│   │   ├── campus.js                 # CRUD campus
│   │   ├── functions.js              # CRUD funções
│   │   ├── functionGroupAdmins.js    # Admin de grupos
│   │   ├── ministries.js             # CRUD ministérios
│   │   ├── members.js                # Operações membros
│   │   ├── schedules.js              # Consulta escalas
│   │   └── whatsapp.js               # Integração WhatsApp
│   ├── services/
│   │   ├── AuthService.js            # Lógica autenticação
│   │   ├── AdminService.js           # Lógica admin
│   │   ├── CampusService.js          # Lógica campus
│   │   ├── EmailService.js           # Envio de emails
│   │   ├── FunctionService.js        # Lógica funções
│   │   ├── MinistryService.js        # Lógica ministérios
│   │   ├── MemberService.js          # Lógica membros
│   │   ├── ScheduleService.js        # Lógica escalas
│   │   ├── NotificationService.js    # Sistema notificações
│   │   ├── WhatsAppServiceHTTP.js    # Cliente HTTP WhatsApp
│   │   └── admin/
│   │       ├── AdminAuditService.js      # Logs de auditoria
│   │       └── AdminScheduleService.js   # Gestão de escalas
│   ├── utils/
│   │   ├── AppError.js               # Classe de erro customizada
│   │   ├── validators.js             # Validadores Joi
│   │   ├── logger.js                 # Winston logger
│   │   ├── helpers.js                # Funções auxiliares
│   │   └── validators/
│   │       ├── index.js
│   │       ├── phoneValidator.js     # Validação telefone
│   │       └── emailValidator.js     # Validação email
│   └── app.js                        # Configuração Express
├── tests/
│   ├── setup.js                      # Configuração testes
│   ├── integration/
│   │   └── auth.test.js              # Testes integração
│   └── unit/
│       ├── controllers/
│       │   └── AuthController.test.js
│       └── services/
│           └── AuthService.test.js
├── uploads/                          # Arquivos upload
├── whatsapp/                         # Microserviço WhatsApp
│   ├── src/
│   │   └── server.js                 # Servidor WhatsApp standalone
│   ├── package.json
│   └── Dockerfile
├── whatsapp-session/                 # Sessão WhatsApp Web
├── package.json
├── jest.config.js                    # Configuração Jest
└── server.js                         # Entry point
```

### 3.2 Frontend (`/root/dunamys/frontend`)

```
frontend/
├── public/
│   └── telas/                        # Screenshots
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Footer.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── LogoutButton.jsx
│   │   │   ├── FloatingLogoutButton.jsx
│   │   │   ├── ConfirmationButtons.jsx
│   │   │   └── ConfirmationBadge.jsx
│   │   ├── forms/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── MemberForm.jsx
│   │   │   ├── DateTimePicker.jsx
│   │   │   ├── FunctionSelector.jsx
│   │   │   └── schedule/
│   │   │       ├── ScheduleFormWizard.jsx
│   │   │       ├── ScheduleDetailsForm.jsx
│   │   │       ├── MemberSelectionForm.jsx
│   │   │       └── FunctionAssignmentForm.jsx
│   │   ├── layout/
│   │   │   ├── AdminLayout.jsx       # Layout admin
│   │   │   └── MemberLayout.jsx      # Layout membro
│   │   └── schedules/
│   │       ├── ScheduleCard.jsx
│   │       └── MembersSection.jsx
│   ├── context/
│   │   ├── AuthContext.jsx           # Contexto autenticação
│   │   └── NotificationContext.jsx   # Contexto notificações
│   ├── hooks/
│   │   ├── useAuth.js                # Hook autenticação
│   │   ├── useApi.js                 # Hook API
│   │   ├── usePhoneValidation.js     # Validação telefone
│   │   └── useFormWizard.js          # Wizard multi-step
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── admin/
│   │   │   ├── Dashboard.jsx         # Dashboard admin
│   │   │   ├── Members.jsx           # Gestão membros
│   │   │   ├── Schedules.jsx         # Gestão escalas
│   │   │   ├── Campus.jsx            # Gestão campus
│   │   │   ├── Ministries.jsx        # Gestão ministérios
│   │   │   ├── Functions.jsx         # Gestão funções
│   │   │   ├── GroupAdmins.jsx       # Admin de grupos
│   │   │   ├── Logs.jsx              # Logs auditoria
│   │   │   └── WhatsApp.jsx          # Configuração WhatsApp
│   │   └── member/
│   │       ├── Dashboard.jsx         # Dashboard membro
│   │       ├── Schedules.jsx         # Minhas escalas
│   │       └── Availability.jsx      # Indisponibilidade
│   ├── services/
│   │   ├── api.js                    # Axios instance
│   │   ├── auth.js                   # Serviço auth
│   │   ├── campus.js                 # Serviço campus
│   │   ├── members.js                # Serviço membros
│   │   ├── ministries.js             # Serviço ministérios
│   │   ├── functionGroupAdmin.js     # Serviço admin grupos
│   │   └── whatsapp.js               # Serviço WhatsApp
│   ├── styles/                       # CSS/Tailwind
│   ├── test/
│   │   └── setup.js                  # Setup Vitest
│   ├── utils/
│   │   ├── constants.js              # Constantes
│   │   ├── formatters.js             # Formatadores
│   │   ├── phoneFormatter.js         # Format telefone
│   │   └── validators/               # Validadores client
│   ├── App.jsx                       # App principal
│   └── main.jsx                      # Entry point
├── tests/
│   └── unit/
│       └── components/
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── vite.config.js
```

---

## 4. Modelo de Dados (Prisma Schema)

### 4.1 Enumerações (Enums)

```prisma
enum UserRole {
  ADMIN
  MEMBER
}

enum UserStatus {
  PENDING    // Aguardando aprovação
  ACTIVE     // Aprovado e ativo
  INACTIVE   // Inativo
  REJECTED   // Rejeitado
}

enum NotificationType {
  SCHEDULE_ASSIGNMENT              // Nova escala atribuída
  SCHEDULE_UPDATE                  // Escala atualizada
  SCHEDULE_CANCELLATION            // Escala cancelada
  SCHEDULE_REMINDER                // Lembrete de escala
  SCHEDULE_CONFIRMATION            // Confirmação de presença
  SCHEDULE_CONFIRMATION_REMINDER   // Lembrete de confirmação
  CUSTOM_NOTIFICATION              // Notificação customizada
}

enum NotificationChannel {
  EMAIL
  WHATSAPP
  EMAIL_WHATSAPP
  BOTH
}

enum NotificationStatus {
  SENT
  FAILED
  PENDING
}

enum ConfirmationStatus {
  PENDING      // Aguardando confirmação
  CONFIRMED    // Confirmado
  UNAVAILABLE  // Marcado como indisponível
}
```

### 4.2 Entidades Principais

#### **Ministry (Ministério)**
```prisma
model Ministry {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  users          User[]
  functionGroups FunctionGroup[]
}
```

**Propósito:** Representa os ministérios da igreja (Louvor, Multimídia, Recepção, etc.)

#### **Campus**
```prisma
model Campus {
  id        Int      @id @default(autoincrement())
  name      String   @unique
  city      String?
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relacionamentos
  users User[]
}
```

**Propósito:** Representa os diferentes campus/congregações da igreja

#### **User (Usuário/Membro)**
```prisma
model User {
  id         Int        @id @default(autoincrement())
  name       String
  email      String     @unique
  password   String     // Hash bcrypt
  phone      String
  role       UserRole   @default(MEMBER)
  status     UserStatus @default(PENDING)
  campusId   Int?
  ministryId Int?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt
  lastLogin  DateTime?

  // Relacionamentos
  campus              Campus?               @relation(fields: [campusId], references: [id])
  ministry            Ministry?             @relation(fields: [ministryId], references: [id])
  schedules           ScheduleMember[]
  unavailabilities    Unavailability[]
  notifications       Notification[]
  auditLogs           AuditLog[]
  functionGroupAdmins FunctionGroupAdmin[]
}
```

**Propósito:** Usuários do sistema (membros e administradores)

**Campos Importantes:**
- `role`: ADMIN (acesso total) ou MEMBER (acesso restrito)
- `status`: Controle de aprovação de cadastro
- `ministryId`: Ministério ao qual o membro pertence

#### **Schedule (Escala)**
```prisma
model Schedule {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  date        DateTime
  time        String
  location    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  members       ScheduleMember[]
  notifications Notification[]
}
```

**Propósito:** Representa uma escala de serviço/evento

#### **ScheduleMember (Membro na Escala)**
```prisma
model ScheduleMember {
  id                 Int                @id @default(autoincrement())
  userId             Int
  scheduleId         Int
  confirmationStatus ConfirmationStatus @default(PENDING)
  confirmedAt        DateTime?
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt

  // Relacionamentos
  user      User                     @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedule  Schedule                 @relation(fields: [scheduleId], references: [id], onDelete: Cascade)
  functions ScheduleMemberFunction[]

  @@unique([userId, scheduleId])
}
```

**Propósito:** Relacionamento N:N entre usuários e escalas, com status de confirmação

#### **Unavailability (Indisponibilidade)**
```prisma
model Unavailability {
  id        Int      @id @default(autoincrement())
  userId    Int
  startDate DateTime
  endDate   DateTime
  reason    String?
  createdAt DateTime @default(now())

  // Relacionamentos
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

**Propósito:** Períodos de indisponibilidade de membros

#### **FunctionGroup (Grupo de Funções)**
```prisma
model FunctionGroup {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  active      Boolean  @default(true)
  ministryId  Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  ministry  Ministry?            @relation(fields: [ministryId], references: [id], onDelete: Cascade)
  functions Function[]
  admins    FunctionGroupAdmin[]
}
```

**Propósito:** Agrupa funções relacionadas (ex: Grupo "Som" com funções "Técnico de Som", "Operador de Mesa")

#### **Function (Função/Serviço)**
```prisma
model Function {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  icon        String?  // Nome do ícone (ex: "car", "mic", "camera")
  active      Boolean  @default(true)
  groupId     Int
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relacionamentos
  group                   FunctionGroup            @relation(fields: [groupId], references: [id], onDelete: Cascade)
  scheduleMemberFunctions ScheduleMemberFunction[]

  @@unique([name, groupId])
}
```

**Propósito:** Funções específicas que membros podem desempenhar

**Exemplos:**
- Grupo: "Multimídia" → Funções: "Operador de Câmera", "Operador de Projeção", "Editor de Vídeo"
- Grupo: "Recepção" → Funções: "Recepcionista Principal", "Orientador de Estacionamento"

#### **ScheduleMemberFunction**
```prisma
model ScheduleMemberFunction {
  id               Int @id @default(autoincrement())
  scheduleMemberId Int
  functionId       Int

  // Relacionamentos
  scheduleMember ScheduleMember @relation(fields: [scheduleMemberId], references: [id], onDelete: Cascade)
  function       Function       @relation(fields: [functionId], references: [id], onDelete: Cascade)

  @@unique([scheduleMemberId, functionId])
}
```

**Propósito:** Relacionamento N:N entre membros em escalas e funções (um membro pode ter múltiplas funções numa mesma escala)

#### **FunctionGroupAdmin (Administrador de Grupo)**
```prisma
model FunctionGroupAdmin {
  id              Int      @id @default(autoincrement())
  userId          Int
  functionGroupId Int
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relacionamentos
  user          User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  functionGroup FunctionGroup @relation(fields: [functionGroupId], references: [id], onDelete: Cascade)

  @@unique([userId, functionGroupId])
}
```

**Propósito:** Define admins delegados que podem gerenciar grupos específicos de funções

#### **Notification (Notificação)**
```prisma
model Notification {
  id         Int                 @id @default(autoincrement())
  userId     Int
  scheduleId Int?
  type       NotificationType
  channel    NotificationChannel
  status     NotificationStatus
  message    String?
  error      String?
  sentAt     DateTime            @default(now())

  // Relacionamentos
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  schedule Schedule? @relation(fields: [scheduleId], references: [id], onDelete: SetNull)
}
```

**Propósito:** Log de todas as notificações enviadas

#### **AuditLog (Log de Auditoria)**
```prisma
model AuditLog {
  id          Int      @id @default(autoincrement())
  action      String
  targetId    Int?
  userId      Int?
  description String
  createdAt   DateTime @default(now())

  // Relacionamentos
  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)
}
```

**Propósito:** Rastreamento de ações administrativas no sistema

### 4.3 Relacionamentos

**Diagrama de Relacionamentos:**

```
Ministry (1) ──── (N) User
Ministry (1) ──── (N) FunctionGroup

Campus (1) ──── (N) User

User (1) ──── (N) ScheduleMember
User (1) ──── (N) Unavailability
User (1) ──── (N) Notification
User (1) ──── (N) AuditLog
User (1) ──── (N) FunctionGroupAdmin

Schedule (1) ──── (N) ScheduleMember
Schedule (1) ──── (N) Notification

ScheduleMember (1) ──── (N) ScheduleMemberFunction

FunctionGroup (1) ──── (N) Function
FunctionGroup (1) ──── (N) FunctionGroupAdmin

Function (1) ──── (N) ScheduleMemberFunction
```

---

## 5. Principais Funcionalidades

### 5.1 Autenticação e Autorização

**Sistema de Autenticação JWT:**

**Fluxo de Login:**
1. Cliente envia `email` e `password` para `POST /api/auth/login`
2. `AuthController` delega para `AuthService.login()`
3. `AuthService` valida credenciais (bcrypt), verifica status do usuário
4. Busca grupos administrados (`functionGroupAdmins`)
5. Determina `userType`:
   - `admin`: usuário com `role === 'ADMIN'`
   - `groupAdmin`: usuário MEMBER que administra grupos de funções
   - `member`: usuário comum
6. Gera JWT com payload:
   ```javascript
   {
     userId: user.id,
     email: user.email,
     role: user.role,
     userType: 'admin' | 'groupAdmin' | 'member',
     adminGroups: [groupId1, groupId2, ...],
     campusId: user.campusId
   }
   ```
7. Retorna token + dados do usuário

**Fluxo de Registro:**
1. Cliente envia dados para `POST /api/auth/register`
2. `AuthService.register()`:
   - Valida email único
   - Valida campus (se fornecido)
   - Hash da senha (bcrypt rounds: 12)
   - Cria usuário com `status: PENDING`
3. Envia notificação para administradores via `EmailService.notifyAdminsNewMember()`
4. Retorna dados do usuário criado (sem token, pois está pendente)

**Middleware de Autenticação (`middlewares/auth.js`):**

```javascript
// Verifica token JWT
const authenticateToken = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id, email, name, role, status }
  });

  if (!user || user.status !== 'ACTIVE') {
    return res.status(401).json({ error: 'Usuário inválido ou inativo' });
  }

  req.user = {
    ...user,
    userType: decoded.userType,
    adminGroups: decoded.adminGroups || []
  };

  next();
};
```

**Middleware de Autorização:**

1. **requireAdmin** (`middlewares/admin.js`):
   - Verifica `req.user.role === 'ADMIN'`

2. **requireGroupAdmin** (`middlewares/groupAdmin.js`):
   - Verifica `req.user.role === 'ADMIN' || req.user.userType === 'groupAdmin'`

3. **requireFullAdmin** (`middlewares/groupAdmin.js`):
   - Verifica `req.user.role === 'ADMIN'` (apenas admins gerais)

4. **requireAdminOrGroupAdmin** (`middlewares/groupAdmin.js`):
   - Permite tanto ADMIN quanto groupAdmin

5. **requireGroupAccess** (`middlewares/groupAdmin.js`):
   - Verifica se groupAdmin tem acesso ao grupo específico
   - Checa se `groupId` está em `req.user.adminGroups`

### 5.2 Gerenciamento de Membros

**Aprovação de Membros (Admin):**
- `POST /api/admin/members/:id/approve`
- `AdminService.approveMember(id)`:
  - Atualiza `status: 'ACTIVE'`
  - Envia notificação via `NotificationService.sendMemberApproval(user)`
  - Cria log de auditoria

**Rejeição de Membros (Admin):**
- `POST /api/admin/members/:id/reject`
- `AdminService.rejectMember(id, reason)`:
  - Atualiza `status: 'REJECTED'`
  - Envia notificação via `NotificationService.sendMemberRejection(user, reason)`
  - Cria log de auditoria

**Listagem de Membros:**
- `GET /api/admin/members?status=PENDING&search=nome&page=1&limit=20`
- Filtros: status, busca por nome/email, paginação
- GroupAdmins só veem membros `ACTIVE`

**Gerenciamento de Indisponibilidade:**
- `POST /api/members/unavailability` - Criar período de indisponibilidade
- `GET /api/members/unavailability` - Listar indisponibilidades
- `DELETE /api/members/unavailability/:id` - Remover indisponibilidade

### 5.3 Gerenciamento de Escalas

**Criação de Escala (Admin):**
- `POST /api/admin/schedules`
- Payload:
  ```javascript
  {
    title: "Culto de Domingo",
    description: "Descrição opcional",
    date: "2025-10-10",
    time: "19:00",
    location: "Templo Principal",
    memberIds: [1, 2, 3],
    memberFunctions: {
      "1": [5, 6],  // Membro 1 tem funções 5 e 6
      "2": [7],     // Membro 2 tem função 7
      "3": []       // Membro 3 sem função específica
    }
  }
  ```

**Fluxo de Criação (`AdminScheduleService.createSchedule`):**
1. Valida se membros existem e estão ativos
2. Verifica indisponibilidades na data
3. Cria `Schedule`
4. Cria `ScheduleMember` para cada membro
5. Associa funções via `FunctionService.assignFunctionToScheduleMember()`
6. Cria log de auditoria
7. Envia notificações **assíncronas** via `NotificationService.sendScheduleAssignment()`

**Atualização de Escala:**
- `PUT /api/admin/schedules/:id`
- Similar à criação, mas:
  - Remove membros existentes
  - Recria com novos membros
  - Envia notificação de atualização

**Exclusão de Escala:**
- `DELETE /api/admin/schedules/:id`
- Envia notificação de cancelamento
- Deleta escala (cascade remove `ScheduleMember` e funções)

**Confirmação de Presença (Membro):**
- `POST /api/members/schedules/:scheduleId/confirm`
- Atualiza `confirmationStatus: 'CONFIRMED'`
- Notifica administradores via `NotificationService.sendScheduleConfirmation()`

**Marcação de Indisponibilidade na Escala (Membro):**
- `POST /api/members/schedules/:scheduleId/unavailable`
- Atualiza `confirmationStatus: 'UNAVAILABLE'`
- Notifica administradores

### 5.4 Sistema de Funções

**Conceito:** Sistema hierárquico de funções que membros podem desempenhar

**Estrutura:**
```
FunctionGroup (ex: "Multimídia")
  └── Function 1 (ex: "Operador de Câmera")
  └── Function 2 (ex: "Operador de Projeção")
  └── Function 3 (ex: "Editor de Vídeo")
```

**CRUD de Grupos de Funções:**
- `GET /api/functions/groups` - Listar grupos
- `POST /api/functions/groups` - Criar grupo (Admin)
- `PUT /api/functions/groups/:id` - Atualizar grupo (Admin)
- `DELETE /api/functions/groups/:id` - Excluir grupo (Admin)

**CRUD de Funções:**
- `GET /api/functions?groupId=1` - Listar funções
- `POST /api/functions` - Criar função (Admin)
- `PUT /api/functions/:id` - Atualizar função (Admin)
- `DELETE /api/functions/:id` - Excluir função (Admin)

**Integração com Ministérios (`FunctionService`):**
- Ao criar `FunctionGroup`, cria automaticamente `Ministry` com mesmo nome
- Ao renomear grupo, renomeia ministério
- Ao deletar grupo sem uso, deleta ministério (se não tiver membros)

**Atribuição de Funções em Escalas:**
- Múltiplas funções por membro em uma escala
- Via `ScheduleMemberFunction` (N:N entre `ScheduleMember` e `Function`)

### 5.5 Sistema de Notificações

**Canais de Notificação:**
- **EMAIL**: Desabilitado (comentado no código)
- **WHATSAPP**: Canal principal ativo

**Tipos de Notificação:**
1. **SCHEDULE_ASSIGNMENT** - Nova escala atribuída
2. **SCHEDULE_UPDATE** - Escala atualizada
3. **SCHEDULE_CANCELLATION** - Escala cancelada
4. **SCHEDULE_REMINDER** - Lembrete (1 dia antes)
5. **SCHEDULE_CONFIRMATION** - Membro confirmou/rejeitou
6. **CUSTOM_NOTIFICATION** - Mensagem customizada do admin

**Fluxo de Notificação WhatsApp:**

**Criação de Escala:**
```javascript
// AdminScheduleService.createSchedule()
setImmediate(async () => {
  await NotificationService.sendScheduleAssignment(schedule);
});
```

**NotificationService.sendScheduleAssignment():**
1. Busca escala com funções dos membros
2. Para cada membro:
   - Verifica se WhatsApp está conectado (`WhatsAppService.isConnected()`)
   - Formata mensagem com dados da escala + funções
   - Envia via `WhatsAppService.sendMessage(phone, message)`
   - Registra notificação no banco via `logNotification()`

**Mensagem de Exemplo:**
```
*🎯 Nova Escala*

Olá, João Silva!

Você foi escalado para:

*Culto de Domingo*

Culto de celebração dominical

📅 Data: 10/10/2025
⏰ Horário: 19:00
📍 Local: Templo Principal
⚙️ Função: Operador de Câmera, Técnico de Som

Confirme sua escala em https://voluntarios.mathaus.dev/
```

**Notificações Customizadas:**
- Admin pode enviar mensagem customizada para todos membros de uma escala
- `POST /api/admin/schedules/:id/notify`
- Envia via WhatsApp com mensagem personalizada

### 5.6 Dashboard e Estatísticas

**Dashboard Admin (`/api/admin/dashboard`):**

Retorna:
```javascript
{
  members: {
    total: 150,
    active: 120,
    pending: 25,
    inactive: 5
  },
  schedules: {
    upcoming: 12,
    thisMonth: 20,
    total: 350
  },
  campus: {
    total: 3,
    active: 3
  },
  notifications: {
    sent: 1500,
    failed: 15
  }
}
```

**Dashboard Membro (`/api/members/profile`):**
- Dados do perfil
- Próximas escalas
- Status de confirmações

---

## 6. Microserviço WhatsApp

### 6.1 Arquitetura

**Localização:** `/root/dunamys/backend/whatsapp/`

**Stack:**
- **Runtime:** Node.js
- **Framework:** Express.js
- **Biblioteca:** `whatsapp-web.js` v1.21.0
- **Estratégia de Autenticação:** `LocalAuth` (persistência em disco)
- **Puppeteer:** Chromium headless

**Configuração Docker:**
```yaml
whatsapp:
  build: ./backend/whatsapp
  container_name: dunamys-whatsapp
  restart: unless-stopped
  environment:
    - NODE_ENV=production
    - PORT=3000
  volumes:
    - whatsapp_session:/app/whatsapp-session  # Persistência sessão
    - whatsapp_temp:/app/temp
  cap_add:
    - SYS_ADMIN  # Necessário para Chromium
  security_opt:
    - seccomp:unconfined
  mem_limit: 2g
  networks:
    - dunamys-network
```

**Porta:** 3000 (apenas interna, não exposta ao host)

### 6.2 Endpoints do Microserviço

**Health Check:**
```http
GET /health
Response: { status: 'OK', whatsapp: 'connected'|'disconnected', timestamp: ISO }
```

**Status da Conexão:**
```http
GET /status
Response: { connected: true|false, hasQR: true|false, timestamp: ISO }
```

**Obter QR Code:**
```http
GET /qr
Response: { qrCode: "data:image/png;base64,..." }
```

**Enviar Mensagem:**
```http
POST /send
Body: { phone: "5511999999999", message: "Texto da mensagem" }
Response: { success: true, messageId: "...", phone: "...", formattedPhone: "..." }
```

**Desconectar:**
```http
POST /disconnect
Response: { message: "WhatsApp desconectado com sucesso" }
```

**Reconectar:**
```http
POST /reconnect
Response: { message: "Reconexão iniciada" }
```

### 6.3 Lógica de Envio de Mensagens

**Formatação de Número:**
```javascript
function formatPhoneNumber(phone) {
  let cleanPhone = phone.replace(/\D/g, '');

  // Remove código do país 55
  if (cleanPhone.startsWith('55')) {
    cleanPhone = cleanPhone.substring(2);
  }

  // Adiciona 9º dígito se necessário (celulares)
  if (cleanPhone.length === 10) {
    const areaCode = cleanPhone.substring(0, 2);
    const number = cleanPhone.substring(2);
    cleanPhone = `${areaCode}9${number}`;
  }

  return cleanPhone;
}
```

**Estratégias de Envio (Múltiplas Tentativas):**

1. **Formato Original:**
   - `55${cleanPhone}@c.us` (ex: `5511999999999@c.us`)
   - Verifica com `client.isRegisteredUser()`

2. **Formato Alternativo (Com/Sem 9º Dígito):**
   - Se original falhar, tenta com/sem 9º dígito
   - Ex: `5511999999999@c.us` → `5511999999999@c.us`

3. **getNumberId (Método Mais Confiável):**
   - `client.getNumberId(phoneForNumberId)`
   - Retorna ID exato do WhatsApp
   - Envia via `numberId._serialized`

4. **Último Recurso:**
   - Tenta enviar com formato original mesmo sem verificação

**Código de Envio (`POST /send`):**
```javascript
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;

  if (!isReady) {
    return res.status(503).json({ error: 'WhatsApp não conectado' });
  }

  // Estratégia 1: Formato original
  const originalFormatted = `55${formatPhoneNumber(phone)}@c.us`;
  const isRegistered = await client.isRegisteredUser(originalFormatted);

  if (!isRegistered) {
    // Estratégia 2: Formato alternativo
    const alternativeNumber = getAlternativeFormat(phone);
    const altRegistered = await client.isRegisteredUser(alternativeNumber);

    if (altRegistered) {
      const result = await client.sendMessage(alternativeNumber, message);
      return res.json({ success: true, messageId: result.id._serialized });
    }
  }

  // Estratégia 3: getNumberId
  const numberId = await client.getNumberId(phoneForNumberId);

  if (numberId) {
    const result = await client.sendMessage(numberId._serialized, message);
    return res.json({ success: true, messageId: result.id._serialized });
  }

  // Estratégia 4: Último recurso
  const result = await client.sendMessage(originalFormatted, message);
  res.json({ success: true, messageId: result.id._serialized });
});
```

### 6.4 Cliente HTTP no Backend Principal

**Localização:** `/root/dunamys/backend/src/services/WhatsAppServiceHTTP.js`

**Classe:** `WhatsAppService` (singleton)

**Propriedades:**
- `serviceUrl`: `http://whatsapp:3000` (URL do microserviço)
- `cachedStatus`: Cache de status (connected, qrCode)

**Métodos Principais:**

**initialize():**
```javascript
async initialize() {
  // Aguarda microserviço ficar disponível (max 90 tentativas)
  // Verifica /health
  // Atualiza cache de status
}
```

**sendMessage(phone, message):**
```javascript
async sendMessage(phone, message) {
  const response = await axios.post(`${this.serviceUrl}/send`, {
    phone,
    message
  }, { timeout: 30000 });

  return response.data;
}
```

**isConnected():** (síncrono)
```javascript
isConnected() {
  return this.cachedStatus.connected;
}
```

**getQRCode():** (síncrono)
```javascript
getQRCode() {
  return this.cachedStatus.qrCode;
}
```

**refreshStatus():** (assíncrono)
```javascript
async refreshStatus() {
  const response = await axios.get(`${this.serviceUrl}/status`);
  this.cachedStatus.connected = response.data.connected;

  if (!this.cachedStatus.connected && response.data.hasQR) {
    const qrResponse = await axios.get(`${this.serviceUrl}/qr`);
    this.cachedStatus.qrCode = qrResponse.data.qrCode;
  }

  return this.cachedStatus.connected;
}
```

**Status Polling:**
- Atualiza cache a cada 5 segundos automaticamente
- Busca status + QR Code se desconectado

---

## 7. Fluxos de Trabalho Importantes

### 7.1 Fluxo de Cadastro e Aprovação de Membro

```
1. Membro acessa /register
   ├─> Preenche formulário (nome, email, senha, telefone, campus)
   └─> Submit

2. Frontend → POST /api/auth/register
   └─> Backend: AuthService.register()
       ├─> Valida email único
       ├─> Valida campus
       ├─> Hash senha (bcrypt)
       ├─> Cria User com status: PENDING
       └─> Retorna user (sem token)

3. Frontend redireciona para /login

4. Membro faz login
   ├─> POST /api/auth/login
   └─> Backend: AuthService.login()
       ├─> Valida credenciais
       ├─> Verifica status !== ACTIVE
       └─> Retorna erro: "Usuário aguardando aprovação"

5. Membro fica bloqueado na tela /pending

6. Admin acessa /admin/members
   ├─> GET /api/admin/members?status=PENDING
   └─> Lista membros pendentes

7. Admin clica "Aprovar"
   ├─> POST /api/admin/members/:id/approve
   └─> Backend: AdminService.approveMember()
       ├─> Atualiza status: ACTIVE
       ├─> NotificationService.sendMemberApproval(user)
       │   └─> Envia WhatsApp: "Parabéns! Cadastro aprovado"
       └─> Cria AuditLog

8. Membro faz login novamente
   └─> AuthService.login() retorna token + user
       └─> Frontend redireciona para /member/dashboard
```

### 7.2 Fluxo de Criação de Escala com Notificações

```
1. Admin acessa /admin/schedules → Clica "Nova Escala"

2. Wizard Multi-step (ScheduleFormWizard.jsx):
   ├─> Passo 1: Dados da Escala (título, data, hora, local)
   ├─> Passo 2: Seleção de Membros
   │   ├─> GET /api/admin/members/available?date=2025-10-10
   │   └─> Backend: AdminService.getAvailableMembers()
   │       ├─> Busca users ACTIVE
   │       └─> Exclui membros com indisponibilidade na data
   └─> Passo 3: Atribuição de Funções
       ├─> GET /api/functions/groups
       └─> Permite selecionar múltiplas funções por membro

3. Submit → POST /api/admin/schedules
   Body: {
     title: "Culto de Domingo",
     date: "2025-10-10",
     time: "19:00",
     location: "Templo Principal",
     memberIds: [1, 2, 3],
     memberFunctions: { "1": [5, 6], "2": [7] }
   }

4. Backend: AdminScheduleService.createSchedule()
   ├─> Valida membros ativos
   ├─> Verifica indisponibilidades
   ├─> Prisma Transaction:
   │   ├─> Cria Schedule
   │   ├─> Cria ScheduleMember (userId: 1, scheduleId: X)
   │   ├─> Cria ScheduleMember (userId: 2, scheduleId: X)
   │   ├─> Cria ScheduleMember (userId: 3, scheduleId: X)
   │   └─> Associa Funções:
   │       ├─> FunctionService.assignFunctionToScheduleMember(SM1, [5,6])
   │       └─> FunctionService.assignFunctionToScheduleMember(SM2, [7])
   ├─> Cria AuditLog
   └─> setImmediate(() => {
       NotificationService.sendScheduleAssignment(schedule)
     })

5. NotificationService.sendScheduleAssignment() [Assíncrono]:
   ├─> Busca schedule com members + functions
   ├─> Para cada membro:
   │   ├─> Verifica WhatsAppService.isConnected()
   │   ├─> Formata mensagem:
   │   │   ```
   │   │   *🎯 Nova Escala*
   │   │   Olá, João!
   │   │   Você foi escalado para:
   │   │   *Culto de Domingo*
   │   │   📅 10/10/2025 ⏰ 19:00
   │   │   📍 Templo Principal
   │   │   ⚙️ Função: Técnico de Som, Operador de Mesa
   │   │   ```
   │   ├─> WhatsAppService.sendMessage(phone, message)
   │   │   └─> axios.post('http://whatsapp:3000/send', { phone, message })
   │   │       └─> WhatsApp Microservice envia via whatsapp-web.js
   │   └─> logNotification({
   │         userId, scheduleId, type: 'SCHEDULE_ASSIGNMENT',
   │         channel: 'WHATSAPP', status: 'SENT'
   │       })
   └─> Logger: "✅ Notificações enviadas para 3 membros"

6. Frontend mostra mensagem: "Escala criada com sucesso"
```

### 7.3 Fluxo de Confirmação de Presença

```
1. Membro acessa /member/schedules

2. Frontend → GET /api/members/schedules
   └─> Backend: MemberService.getSchedules(userId)
       └─> Retorna escalas do membro com confirmationStatus

3. Frontend exibe lista de escalas com badges:
   ├─> PENDING: Badge amarelo "Aguardando confirmação"
   ├─> CONFIRMED: Badge verde "Confirmado"
   └─> UNAVAILABLE: Badge vermelho "Indisponível"

4. Membro clica "Confirmar Presença" em uma escala

5. Frontend → POST /api/members/schedules/:scheduleId/confirm
   └─> Backend: MemberController.confirmSchedule()
       └─> MemberService.confirmSchedule(userId, scheduleId)
           ├─> Atualiza ScheduleMember:
           │   ├─> confirmationStatus: 'CONFIRMED'
           │   └─> confirmedAt: now()
           └─> NotificationService.sendScheduleConfirmation(userId, scheduleId, 'CONFIRMED')
               ├─> Busca admins (role: ADMIN)
               └─> Para cada admin:
                   ├─> Formata mensagem:
                   │   ```
                   │   *✅ Confirmação de Escala*
                   │   Olá, Admin!
                   │   *João Silva* confirmou presença para:
                   │   *Culto de Domingo*
                   │   📅 10/10/2025 ⏰ 19:00
                   │   ✅ Status: Confirmado
                   │   ```
                   └─> WhatsAppService.sendMessage(admin.phone, message)

6. Frontend atualiza badge para "Confirmado" (verde)
```

### 7.4 Fluxo de Indisponibilidade

```
1. Membro acessa /member/availability

2. Frontend → GET /api/members/unavailability
   └─> Backend: MemberService.getUnavailabilities(userId)
       └─> Retorna lista de unavailabilities

3. Membro clica "Nova Indisponibilidade"
   └─> Formulário: startDate, endDate, reason

4. Submit → POST /api/members/unavailability
   Body: {
     startDate: "2025-10-15",
     endDate: "2025-10-20",
     reason: "Viagem a trabalho"
   }

5. Backend: MemberController.setUnavailability()
   └─> Valida (Joi):
       ├─> startDate obrigatório
       ├─> endDate >= startDate
       └─> reason opcional
   └─> Cria Unavailability

6. Proteção em Criação de Escala:
   Admin tenta criar escala com data 2025-10-17
   └─> AdminScheduleService.createSchedule()
       └─> Verifica indisponibilidades:
           ```sql
           WHERE userId IN (memberIds)
             AND startDate <= '2025-10-17'
             AND endDate >= '2025-10-17'
           ```
       └─> Se encontrar: throw Error("João Silva está indisponível nesta data")
```

### 7.5 Fluxo de WhatsApp QR Code

```
1. Deploy do sistema → Docker Compose inicia containers

2. Microserviço WhatsApp inicia (dunamys-whatsapp):
   └─> initializeWhatsApp()
       ├─> Cria WhatsApp Client (whatsapp-web.js)
       ├─> LocalAuth strategy (persiste em /app/whatsapp-session)
       └─> Eventos:
           ├─> on('qr', (qr) => {
           │     console.log(qrString) // Exibe no terminal
           │     qrcode.toDataURL(qr, (url) => qrCode = url) // Salva base64
           │   })
           ├─> on('authenticated', () => { isReady = false })
           ├─> on('ready', () => {
           │     setTimeout(() => isReady = true, 10000) // Aguarda 10s
           │   })
           └─> on('disconnected', () => { isReady = false })

3. Backend principal inicia (dunamys-backend):
   └─> server.js → WhatsAppService.initialize()
       ├─> Loop de retry (max 90 tentativas):
       │   └─> axios.get('http://whatsapp:3000/health')
       └─> refreshStatus()
           ├─> GET /status → cachedStatus.connected
           └─> Se !connected: GET /qr → cachedStatus.qrCode

4. Admin acessa /admin/whatsapp (Frontend)

5. Frontend → GET /api/whatsapp/status (backend)
   └─> WhatsAppService.isConnected() // Cache
       └─> Retorna: { connected: false, qrCode: null }

6. Frontend → GET /api/whatsapp/qr
   └─> WhatsAppService.getQRCode() // Cache
       └─> Retorna: { qrCode: "data:image/png;base64,..." }

7. Frontend exibe QR Code em <img>

8. Admin escaneia QR Code com WhatsApp

9. Microserviço WhatsApp:
   └─> on('authenticated') → isReady = false
   └─> on('ready') → setTimeout(() => isReady = true, 10000)

10. Frontend polling (a cada 5s):
    └─> GET /api/whatsapp/status
        └─> Retorna: { connected: true }

11. Frontend mostra: "✅ WhatsApp Conectado"
```

---

## 8. Configurações Importantes

### 8.1 Variáveis de Ambiente (.env)

```bash
# ===== BANCO DE DADOS =====
POSTGRES_DB=igreja_membros
POSTGRES_USER=postgres
POSTGRES_PASSWORD=dunamys_db_2024_super_forte_vps
DATABASE_URL=postgresql://postgres:dunamys_db_2024_super_forte_vps@postgres:5432/igreja_membros?schema=public

# ===== SERVIDOR =====
NODE_ENV=production  # development | production
PORT=5000
LOG_LEVEL=info       # error | warn | info | debug

# ===== URLs =====
API_URL=https://voluntarios.mathaus.dev
FRONTEND_URL=https://voluntarios.mathaus.dev

# ===== JWT =====
JWT_SECRET=dunamys_production_jwt_secret_muito_forte_vps_2024_abcdef123456
JWT_EXPIRES_IN=7d  # Padrão: 7 dias

# ===== ADMIN MASTER =====
MASTER_ADMIN_EMAIL=mathauscarvalho@gmail.com

# ===== WHATSAPP =====
WHATSAPP_ENABLED=true
WHATSAPP_SERVICE_URL=http://whatsapp:3000  # URL interna Docker

# ===== EMAIL (DESABILITADO) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu_email@gmail.com
SMTP_PASS=sua_senha_de_app_gmail

# ===== REDIS =====
REDIS_HOST=redis
REDIS_PORT=6379
```

### 8.2 CORS e Rate Limiting

**CORS (src/app.js):**

```javascript
const corsOptions = {
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true); // Permite todas origens em dev
    }

    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Permissivo em produção também
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

**Rate Limiting:**

```javascript
// DESABILITADO EM DEVELOPMENT
if (process.env.NODE_ENV === 'production') {
  // General: 100 req / 15min
  app.use('/api/', generalLimiter);

  // Auth: 5 req / 15min
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
} else {
  console.log('Rate limiting DESABILITADO em desenvolvimento');
}
```

### 8.3 Logging (Winston)

**Configuração (src/utils/logger.js):**

```javascript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

// Console em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 8.4 Validação (Joi)

**Exemplo de Validator (src/utils/validators.js):**

```javascript
const scheduleValidator = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).allow('', null),
  date: Joi.date().iso().required(),
  time: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required(),
  location: Joi.string().min(3).max(100).required(),
  memberIds: Joi.array().items(Joi.number().integer()).min(1).required(),
  memberFunctions: Joi.object().pattern(
    Joi.number(),
    Joi.array().items(Joi.number().integer())
  )
});
```

**Uso em Middleware:**

```javascript
router.post('/schedules',
  requireAdmin,
  validate(validators.schedule),
  AdminController.createSchedule
);
```

### 8.5 Segurança

**Helmet:**
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));
```

**Bcrypt:**
- Rounds: 12
- Hash de senha: `bcrypt.hash(password, 12)`
- Comparação: `bcrypt.compare(password, user.password)`

**JWT:**
- Secret: `process.env.JWT_SECRET`
- Expiração: 7 dias (padrão)
- Payload: userId, email, role, userType, adminGroups

---

## 9. Frontend - Tecnologias e Arquitetura

### 9.1 Stack Tecnológico

**Core:**
- **React:** 18.2.0
- **React Router DOM:** 6.15.0 (rotas SPA)
- **Vite:** 4.4.5 (build tool)

**State Management & Forms:**
- **React Hook Form:** 7.45.4 (gerenciamento de formulários)
- **Context API:** AuthContext, NotificationContext

**HTTP Client:**
- **Axios:** 1.5.0

**UI & Styling:**
- **Tailwind CSS:** 3.3.3
- **Lucide React:** 0.263.1 (ícones)

**Notificações:**
- **React Toastify:** 9.1.3
- **React Hot Toast:** 2.5.2

**Validação:**
- **Joi:** 17.9.2 (validação client-side)

**Utilidades:**
- **date-fns:** 2.30.0 (manipulação de datas)

**Testing:**
- **Vitest:** 3.2.4
- **@testing-library/react:** 16.3.0
- **@testing-library/user-event:** 14.6.1
- **jsdom:** 26.1.0

### 9.2 Estrutura de Rotas

**Rotas Públicas:**
- `/login` - Login
- `/register` - Cadastro

**Rotas de Aprovação:**
- `/pending` - Tela de aguardando aprovação

**Rotas de Membro (ProtectedRoute):**
- `/member` - Layout base
  - `/member` (index) - Dashboard
  - `/member/schedules` - Minhas escalas
  - `/member/availability` - Indisponibilidade

**Rotas de Admin (ProtectedRoute + adminOnly):**
- `/admin` - Layout base
  - `/admin` (index) - Dashboard
  - `/admin/members` - Gestão de membros
  - `/admin/schedules` - Gestão de escalas
  - `/admin/campus` - Gestão de campus
  - `/admin/ministries` - Gestão de ministérios
  - `/admin/functions` - Gestão de funções
  - `/admin/logs` - Logs de auditoria
  - `/admin/whatsapp` - Configuração WhatsApp

**ProtectedRoute Component:**
```jsx
const ProtectedRoute = ({ children, adminOnly = false, requiresActive = true }) => {
  const { user, loading } = useAuth();

  if (loading) return <Loading fullScreen />;
  if (!user) return <Navigate to="/login" />;
  if (requiresActive && user.status !== 'ACTIVE') return <Navigate to="/pending" />;
  if (adminOnly && user.role !== 'ADMIN' && user.userType !== 'groupAdmin') {
    return <Navigate to="/member" />;
  }

  return children;
};
```

### 9.3 Context e Hooks

**AuthContext (src/context/AuthContext.jsx):**

**Estado:**
```javascript
{
  user: {
    id, name, email, phone, role, status,
    userType: 'admin' | 'groupAdmin' | 'member',
    adminGroups: [1, 2, 3],
    campus: { id, name, city }
  },
  token: 'jwt_token',
  loading: true | false,
  error: 'error_message' | null
}
```

**Métodos:**
- `login(email, password)` - Faz login e armazena token
- `register(userData)` - Cadastra novo usuário
- `logout()` - Remove token e reseta estado
- `updateUser(userData)` - Atualiza dados do usuário
- `changePassword(current, new)` - Altera senha

**useAuth Hook (src/hooks/useAuth.js):**
```javascript
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
```

**NotificationContext (src/context/NotificationContext.jsx):**
- Gerencia notificações toast
- Integra com React Toastify

### 9.4 Serviços API (src/services/)

**api.js - Axios Instance:**
```javascript
export const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor: Adiciona token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@igreja:token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor: Trata erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@igreja:token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**auth.js - Serviço de Autenticação:**
```javascript
export const authService = {
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async verifyToken(token) {
    api.defaults.headers.Authorization = `Bearer ${token}`;
    const response = await api.get('/members/profile');
    return response.data;
  }
};
```

**members.js - Serviço de Membros:**
```javascript
export const membersService = {
  async getProfile() {
    const response = await api.get('/members/profile');
    return response.data;
  },

  async getSchedules() {
    const response = await api.get('/members/schedules');
    return response.data;
  },

  async confirmSchedule(scheduleId) {
    const response = await api.post(`/members/schedules/${scheduleId}/confirm`);
    return response.data;
  },

  async setUnavailability(data) {
    const response = await api.post('/members/unavailability', data);
    return response.data;
  }
};
```

### 9.5 Componentes Principais

**ScheduleFormWizard (Multi-step Form):**

**Hook useFormWizard:**
```javascript
export const useFormWizard = (totalSteps) => {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const goToStep = (step) => setCurrentStep(step);

  return { currentStep, nextStep, prevStep, goToStep };
};
```

**Wizard Component:**
```jsx
<ScheduleFormWizard>
  {currentStep === 1 && (
    <ScheduleDetailsForm
      data={formData}
      onChange={updateFormData}
      onNext={nextStep}
    />
  )}

  {currentStep === 2 && (
    <MemberSelectionForm
      data={formData}
      onChange={updateFormData}
      onNext={nextStep}
      onBack={prevStep}
    />
  )}

  {currentStep === 3 && (
    <FunctionAssignmentForm
      data={formData}
      onChange={updateFormData}
      onSubmit={handleSubmit}
      onBack={prevStep}
    />
  )}
</ScheduleFormWizard>
```

**ConfirmationButtons (Confirmação de Presença):**
```jsx
<ConfirmationButtons
  schedule={schedule}
  confirmationStatus={scheduleMember.confirmationStatus}
  onConfirm={() => handleConfirm(schedule.id)}
  onUnavailable={() => handleUnavailable(schedule.id)}
/>
```

### 9.6 Formatadores e Utilitários

**phoneFormatter.js:**
```javascript
export const formatPhone = (phone) => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);

  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }

  return phone;
};

export const normalizePhone = (phone) => {
  return phone.replace(/\D/g, '');
};
```

**formatters.js:**
```javascript
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('pt-BR');
};

export const formatDateTime = (date, time) => {
  const formattedDate = formatDate(date);
  return `${formattedDate} às ${time}`;
};

export const formatConfirmationStatus = (status) => {
  const statusMap = {
    PENDING: 'Aguardando confirmação',
    CONFIRMED: 'Confirmado',
    UNAVAILABLE: 'Indisponível'
  };

  return statusMap[status] || status;
};
```

---

## 10. Convenções de Código

### 10.1 Backend

**Naming Conventions:**
- **Arquivos:** PascalCase para classes/serviços (`AuthService.js`, `MemberController.js`)
- **Variáveis:** camelCase (`userId`, `scheduleData`)
- **Constantes:** UPPER_SNAKE_CASE (`JWT_SECRET`, `MAX_RETRIES`)
- **Models Prisma:** PascalCase (`User`, `Schedule`, `FunctionGroup`)

**Estrutura de Service:**
```javascript
class ServiceName {
  static async methodName(params) {
    // 1. Validações
    // 2. Lógica de negócio
    // 3. Operações de banco
    // 4. Retorno
  }
}

module.exports = ServiceName;
```

**Estrutura de Controller:**
```javascript
class ControllerName {
  static async methodName(req, res, next) {
    try {
      const { param1, param2 } = req.body;
      const result = await ServiceName.methodName(param1, param2);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControllerName;
```

**Error Handling:**
```javascript
// AppError customizado
throw new AppError('Mensagem de erro', 400);

// Middleware errorHandler captura e formata
```

**Logging:**
```javascript
logger.info('Mensagem informativa', { metadata });
logger.warn('Alerta', { details });
logger.error('Erro crítico', error);
```

### 10.2 Frontend

**Naming Conventions:**
- **Componentes:** PascalCase (`MemberForm.jsx`, `ScheduleCard.jsx`)
- **Hooks:** camelCase com prefixo `use` (`useAuth.js`, `useFormWizard.js`)
- **Services:** camelCase (`authService`, `membersService`)
- **Context:** PascalCase com sufixo `Context` (`AuthContext`, `NotificationContext`)

**Estrutura de Component:**
```jsx
import React, { useState, useEffect } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  // 1. Hooks
  const [state, setState] = useState(initialValue);

  // 2. Effects
  useEffect(() => {
    // Effect logic
  }, [dependencies]);

  // 3. Handlers
  const handleAction = () => {
    // Handler logic
  };

  // 4. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

**Tailwind CSS:**
- Classes inline nos componentes
- Uso de design tokens consistentes
- Responsividade com prefixos `sm:`, `md:`, `lg:`

**Estado Local vs Global:**
- **Local:** useState para estado de UI (modals, forms)
- **Global:** Context para autenticação, notificações
- **Server State:** Buscar do backend, não duplicar em estado

---

## 11. Deployment

### 11.1 Build e Deploy

**Comandos Docker:**
```bash
# Build e iniciar todos serviços
docker-compose up -d --build

# Ver logs
docker-compose logs -f backend
docker-compose logs -f whatsapp

# Parar serviços
docker-compose down

# Rebuild específico
docker-compose up -d --build backend
```

**Migrações Prisma:**
```bash
# Gerar migration
npx prisma migrate dev --name migration_name

# Aplicar migrations em produção
npx prisma migrate deploy

# Gerar Prisma Client
npx prisma generate
```

### 11.2 Nginx Configuration

**nginx.conf:**
```nginx
upstream backend {
    server backend:5000;
}

upstream frontend {
    server frontend:3000;
}

server {
    listen 80;
    server_name _;

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # API Docs
    location /api-docs {
        proxy_pass http://backend;
    }
}
```

### 11.3 Variáveis de Ambiente de Build

**Frontend (.env):**
```bash
VITE_API_URL=https://voluntarios.mathaus.dev
VITE_MASTER_ADMIN_EMAIL=mathauscarvalho@gmail.com
```

**Build Args (Dockerfile):**
```dockerfile
ARG VITE_API_URL
ARG VITE_MASTER_ADMIN_EMAIL

ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_MASTER_ADMIN_EMAIL=${VITE_MASTER_ADMIN_EMAIL}
```

### 11.4 Healthchecks

**Backend:**
- `GET /health` - Status da aplicação
- `GET /api/health` - Status de serviços (DB, Redis, WhatsApp)

**WhatsApp Microservice:**
- `GET /health` - Status do microserviço

---

## 12. Testes

### 12.1 Backend (Jest)

**Configuração (jest.config.js):**
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/tests/**/*.test.js'],
  setupFilesAfterEnv: ['./tests/setup.js']
};
```

**Tipos de Testes:**
- **Unit:** `tests/unit/` - Serviços e controllers isolados
- **Integration:** `tests/integration/` - Rotas e fluxos completos

**Executar:**
```bash
npm test                  # Todos os testes
npm run test:watch        # Watch mode
npm run test:coverage     # Com coverage
npm run test:unit         # Apenas unit
npm run test:integration  # Apenas integration
```

### 12.2 Frontend (Vitest)

**Configuração:**
- **Framework:** Vitest 3.2.4
- **Testing Library:** @testing-library/react 16.3.0
- **DOM:** jsdom 26.1.0

**Executar:**
```bash
npm test              # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # Com coverage
npm run test:ui       # UI interativa
```

---

## 13. Documentação API (Swagger)

**URL:** `http://localhost:8080/api-docs` ou `https://voluntarios.mathaus.dev/api-docs`

**Configuração (docs/swagger.js):**
```javascript
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Igreja Membros API',
      version: '1.0.0',
      description: 'API para gerenciamento de membros e escalas'
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
      { url: 'https://voluntarios.mathaus.dev', description: 'Production' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

module.exports = swaggerJsdoc(options);
```

---

## 14. Troubleshooting Comum

### 14.1 WhatsApp Não Conecta

**Sintomas:** QR Code não aparece ou WhatsApp não autentica

**Soluções:**
1. Verificar logs do container: `docker-compose logs -f whatsapp`
2. Verificar se sessão está corrompida:
   ```bash
   docker-compose down
   docker volume rm dunamys_whatsapp_session
   docker-compose up -d --build whatsapp
   ```
3. Verificar memória do container (limite 2GB)
4. Reiniciar WhatsApp via endpoint: `POST /api/whatsapp/reconnect`

### 14.2 Notificações Não Enviadas

**Sintomas:** Membros não recebem WhatsApp ao criar escala

**Verificações:**
1. WhatsApp está conectado? `GET /api/whatsapp/status`
2. Telefone cadastrado corretamente? (verificar formato: 5511999999999)
3. Logs do backend: `docker-compose logs -f backend | grep WhatsApp`
4. Verificar tabela `notifications` no banco:
   ```sql
   SELECT * FROM notifications WHERE status = 'FAILED' ORDER BY sentAt DESC;
   ```

### 14.3 Erro de Token Expirado

**Sintomas:** Usuário logado é deslogado automaticamente

**Causas:**
- JWT expirado (padrão: 7 dias)
- JWT_SECRET alterado no backend
- Token corrompido no localStorage

**Soluções:**
1. Fazer login novamente
2. Verificar `JWT_EXPIRES_IN` no `.env`
3. Limpar localStorage: `localStorage.removeItem('@igreja:token')`

### 14.4 Erro ao Criar Escala com Membros Indisponíveis

**Sintomas:** Erro "Membros indisponíveis na data"

**Causa:** Membros têm `Unavailability` cadastrada na data da escala

**Solução:**
1. Verificar indisponibilidades: `GET /api/admin/members/unavailabilities?date=2025-10-10`
2. Remover indisponibilidade ou escolher outros membros

---

**Última atualização**: 2025-10-05
**Versão**: 1.0.0
**Autor**: Mathaus Dev
