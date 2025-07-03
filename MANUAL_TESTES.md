# Manual de Testes - Sistema Dunamys

## Visão Geral

Este documento fornece instruções completas para executar e interpretar os testes do sistema Dunamys. O sistema possui testes para backend (Node.js) e frontend (React), organizados em diferentes níveis de teste.

## Estrutura dos Testes

### Backend (`/backend/tests/`)
```
tests/
├── unit/
│   ├── controllers/    # Testes unitários dos controllers
│   ├── services/       # Testes unitários dos services
│   └── utils/          # Testes unitários dos utilitários
├── integration/        # Testes de integração das APIs
├── e2e/               # Testes end-to-end
└── setup.js           # Configuração global dos testes
```

### Frontend (`/frontend/tests/`)
```
tests/
├── unit/
│   ├── components/     # Testes unitários dos componentes
│   ├── hooks/          # Testes dos custom hooks
│   └── utils/          # Testes dos utilitários
├── integration/        # Testes de integração
└── e2e/               # Testes end-to-end
```

## Pré-requisitos

### Backend
- Node.js 22.16.0
- PostgreSQL rodando (para testes de integração)
- Redis rodando (para testes de fila)

### Frontend
- Node.js 22.16.0
- Dependências instaladas

## Executando os Testes

### Backend

#### 1. Configurar Ambiente de Teste
```bash
cd backend
cp .env.example .env.test
# Editar .env.test com configurações de teste
```

#### 2. Instalar Dependências
```bash
npm install
```

#### 3. Executar Testes

**Todos os testes:**
```bash
npm test
```

**Testes com watch mode:**
```bash
npm run test:watch
```

**Testes com coverage:**
```bash
npm test -- --coverage
```

**Testes específicos:**
```bash
# Apenas testes unitários
npm test -- tests/unit/

# Apenas testes de integração
npm test -- tests/integration/

# Teste específico
npm test -- tests/unit/controllers/AuthController.test.js
```

#### 4. Testes de Integração
Os testes de integração requerem um banco de dados de teste:

```bash
# Criar banco de teste
npx prisma migrate dev --name init

# Executar testes de integração
npm test -- tests/integration/
```

### Frontend

#### 1. Instalar Dependências
```bash
cd frontend
npm install
```

#### 2. Executar Testes

**Todos os testes:**
```bash
npm run test
```

**Testes com watch mode:**
```bash
npm run test:watch
```

**Testes com coverage:**
```bash
npm run test:coverage
```

**Testes específicos:**
```bash
# Apenas componentes
npm run test -- tests/unit/components/

# Teste específico
npm run test -- tests/unit/components/LoginForm.test.jsx
```

## Interpretando os Resultados

### Estrutura dos Resultados

#### Saída Padrão
```
 PASS  tests/unit/controllers/AuthController.test.js
  AuthController
    register
      ✓ deve registrar um usuário com sucesso (15ms)
      ✓ deve tratar erro no registro (3ms)
    login
      ✓ deve fazer login com sucesso (5ms)
      ✓ deve tratar erro no login (2ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.851s
```

#### Relatório de Coverage
```
File                     | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------------|---------|----------|---------|---------|------------------
controllers/             |   85.71 |     75.0 |    85.7 |   85.71 |
 AuthController.js       |   85.71 |     75.0 |    85.7 |   85.71 | 25,26
services/                |   90.48 |     83.3 |    90.9 |   90.48 |
 AuthService.js          |   90.48 |     83.3 |    90.9 |   90.48 | 45,46,47
```

### Métricas de Qualidade

#### Coverage Mínimo Recomendado
- **Statements**: 80%
- **Branches**: 75%
- **Functions**: 85%
- **Lines**: 80%

#### Interpretação das Métricas

**Statements (% Stmts)**: Porcentagem de declarações executadas
- ✅ > 80%: Excelente
- ⚠️ 60-80%: Adequado
- ❌ < 60%: Inadequado

**Branches (% Branch)**: Porcentagem de ramificações testadas
- ✅ > 75%: Excelente
- ⚠️ 55-75%: Adequado
- ❌ < 55%: Inadequado

**Functions (% Funcs)**: Porcentagem de funções testadas
- ✅ > 85%: Excelente
- ⚠️ 70-85%: Adequado
- ❌ < 70%: Inadequado

**Lines (% Lines)**: Porcentagem de linhas executadas
- ✅ > 80%: Excelente
- ⚠️ 60-80%: Adequado
- ❌ < 60%: Inadequado

## Tipos de Teste e Objetivos

### 1. Testes Unitários

**Objetivo**: Testar componentes isoladamente
**Escopo**: Funções, classes, componentes individuais

**Exemplo - Backend**:
```javascript
// Testa apenas a lógica do AuthController
describe('AuthController', () => {
  it('deve registrar um usuário com sucesso', async () => {
    // Arrange
    const userData = { ... };
    AuthService.register.mockResolvedValue(mockResult);
    
    // Act
    await AuthController.register(req, res, next);
    
    // Assert
    expect(AuthService.register).toHaveBeenCalledWith(userData);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});
```

**Exemplo - Frontend**:
```javascript
// Testa apenas o componente LoginForm
describe('LoginForm', () => {
  it('deve validar campos obrigatórios', async () => {
    // Arrange
    render(<LoginForm />);
    
    // Act
    await user.click(screen.getByRole('button', { name: /entrar/i }));
    
    // Assert
    expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
  });
});
```

### 2. Testes de Integração

**Objetivo**: Testar interação entre componentes
**Escopo**: APIs, fluxos de dados, integrações

**Exemplo**:
```javascript
// Testa o fluxo completo de autenticação
describe('Auth Integration', () => {
  it('deve fazer login completo', async () => {
    // Act
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@email.com', password: '123456' });
    
    // Assert
    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    
    // Verificar no banco
    const user = await prisma.user.findUnique({ where: { email: 'test@email.com' } });
    expect(user.lastLogin).toBeTruthy();
  });
});
```

### 3. Testes End-to-End

**Objetivo**: Testar fluxos completos do usuário
**Escopo**: Simulação de uso real

## Cenários de Teste por Módulo

### Autenticação

**Cenários Críticos**:
- ✅ Registro de usuário com dados válidos
- ✅ Registro com email duplicado (deve falhar)
- ✅ Login com credenciais válidas
- ✅ Login com credenciais inválidas (deve falhar)
- ✅ Renovação de token
- ✅ Alteração de senha
- ✅ Recuperação de senha

**Validações**:
- Email formato válido
- Senha tamanho mínimo
- Campus ativo
- Status do usuário

### Gerenciamento de Membros

**Cenários Críticos**:
- ✅ Criação de membro
- ✅ Listagem com filtros
- ✅ Atualização de dados
- ✅ Ativação/desativação
- ✅ Associação com funções

### Escalas

**Cenários Críticos**:
- ✅ Criação de escala
- ✅ Atribuição de funções
- ✅ Verificação de disponibilidade
- ✅ Notificações

## Debugging de Testes

### Falhas Comuns

#### 1. Timeout
```
Error: Timeout of 5000ms exceeded
```
**Solução**: Aumentar timeout ou verificar operações assíncronas

#### 2. Mock não funcionando
```
Error: Cannot read property 'mockResolvedValue' of undefined
```
**Solução**: Verificar se o mock está configurado corretamente

#### 3. Banco de dados
```
Error: relation "users" does not exist
```
**Solução**: Executar migrações no banco de teste

#### 4. Dependências não mockadas
```
Error: Cannot read property 'info' of undefined
```
**Solução**: Verificar se todas as dependências estão mockadas

### Ferramentas de Debug

#### Backend
```bash
# Debug específico
npm test -- --verbose tests/unit/controllers/AuthController.test.js

# Debug com logs
DEBUG=test npm test
```

#### Frontend
```bash
# Debug específico
npm run test -- --reporter=verbose tests/unit/components/LoginForm.test.jsx

# Debug com logs
npm run test -- --verbose
```

## Automação e CI/CD

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '22.16.0'
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v1
```

### Scripts Úteis

#### Backend
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest tests/unit/",
    "test:integration": "jest tests/integration/",
    "test:e2e": "jest tests/e2e/"
  }
}
```

#### Frontend
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Boas Práticas

### 1. Nomenclatura
- Use nomes descritivos: `deve registrar usuário com sucesso`
- Agrupe testes relacionados: `describe('AuthController')`
- Use padrão AAA: Arrange, Act, Assert

### 2. Isolamento
- Cada teste deve ser independente
- Use `beforeEach` para setup limpo
- Limpe dados após cada teste

### 3. Performance
- Mock dependências externas
- Use dados mínimos necessários
- Paralelização quando possível

### 4. Manutenibilidade
- Evite duplicação de código
- Use factories para dados de teste
- Documente cenários complexos

## Troubleshooting

### Problemas Comuns

#### Jest não encontra módulos
```bash
# Instalar dependências
npm install --save-dev @types/jest

# Configurar jest.config.js
module.exports = {
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

#### Vitest não funciona
```bash
# Verificar vite.config.js
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js']
  }
});
```

#### Prisma em testes
```javascript
// Mock correto do Prisma
jest.mock('../config/database', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));
```

## Conclusão

Este sistema de testes garante:
- ✅ Qualidade do código
- ✅ Prevenção de regressões
- ✅ Documentação viva
- ✅ Confiança em deploys
- ✅ Facilita refatorações

**Meta de Coverage**: 85% para funcionalidades críticas
**Execução**: Todos os testes devem passar antes de merge
**Manutenção**: Atualizar testes junto com código

Para dúvidas ou problemas, consulte a documentação específica de cada ferramenta:
- [Jest](https://jestjs.io/docs/getting-started)
- [Vitest](https://vitest.dev/guide/)
- [Testing Library](https://testing-library.com/docs/)