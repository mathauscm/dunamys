#!/bin/bash

echo "🚀 Setup do Sistema Igreja Membros - Backend"
echo "=============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para print colorido
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Execute este script no diretório backend/"
    exit 1
fi

# 1. Verificar Node.js
print_info "Verificando Node.js..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js encontrado: $NODE_VERSION"
else
    print_error "Node.js não encontrado. Instale o Node.js 18+ antes de continuar."
    exit 1
fi

# 2. Verificar npm
print_info "Verificando npm..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_status "npm encontrado: $NPM_VERSION"
else
    print_error "npm não encontrado."
    exit 1
fi

# 3. Instalar dependências
print_info "Instalando dependências..."
if npm install; then
    print_status "Dependências instaladas com sucesso"
else
    print_error "Erro ao instalar dependências"
    exit 1
fi

# 4. Verificar PostgreSQL
print_info "Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    print_status "PostgreSQL encontrado"
else
    print_warning "PostgreSQL não encontrado no PATH. Certifique-se de que está instalado e rodando."
fi

# 5. Verificar Redis
print_info "Verificando Redis..."
if command -v redis-cli &> /dev/null; then
    print_status "Redis encontrado"
else
    print_warning "Redis não encontrado no PATH. Certifique-se de que está instalado e rodando."
fi

# 6. Criar arquivo .env se não existir
if [ ! -f ".env" ]; then
    print_info "Criando arquivo .env..."
    cp .env.example .env
    print_status "Arquivo .env criado. IMPORTANTE: Configure as variáveis de ambiente!"
    print_warning "Edite o arquivo .env com suas configurações antes de continuar."
else
    print_info "Arquivo .env já existe"
fi

# 7. Verificar conexão com banco
print_info "Testando conexão com banco de dados..."
if npm run generate > /dev/null 2>&1; then
    print_status "Prisma Client gerado com sucesso"
else
    print_warning "Erro ao gerar Prisma Client. Verifique a configuração do DATABASE_URL no .env"
fi

# 8. Executar migrações
print_info "Executando migrações do banco de dados..."
if npm run migrate > /dev/null 2>&1; then
    print_status "Migrações executadas com sucesso"
else
    print_warning "Erro ao executar migrações. Verifique se o banco PostgreSQL está rodando."
fi

# 9. Executar seed (popular banco com dados iniciais)
print_info "Populando banco com dados iniciais..."
if npm run seed > /dev/null 2>&1; then
    print_status "Dados iniciais inseridos com sucesso"
else
    print_warning "Erro ao inserir dados iniciais"
fi

# 10. Criar diretórios necessários
print_info "Criando diretórios necessários..."
mkdir -p logs
mkdir -p uploads
mkdir -p whatsapp-session
print_status "Diretórios criados"

echo ""
echo "🎉 Setup concluído!"
echo "=================="
echo ""
print_info "Próximos passos:"
echo "1. Configure o arquivo .env com suas credenciais"
echo "2. Certifique-se de que PostgreSQL está rodando"
echo "3. Certifique-se de que Redis está rodando (opcional)"
echo "4. Execute: npm run dev"
echo ""
print_info "Login padrão do administrador:"
echo "Email: admin@igreja.com"
echo "Senha: admin123"
echo ""
print_info "Campus criados:"
echo "- Ubajara"
echo "- Tianguá"
echo ""
print_warning "IMPORTANTE: Altere a senha do administrador após o primeiro login!"
echo ""
print_info "Para verificar se tudo está funcionando:"
echo "curl http://localhost:5000/health"