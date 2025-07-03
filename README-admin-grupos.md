# Sistema de Administradores de Grupo - Guia de Uso

## 🎯 Funcionalidade Implementada

Foi implementado um sistema que permite ao administrador geral designar administradores específicos para grupos de funções (como "Multimídia" e "Voluntariado Geral").

## 🚀 Como Usar

### 1. Como Admin Geral - Designar Administradores de Grupo

1. **Acesse a página de Funções:**
   - Vá para `http://localhost:3000/admin/functions`
   - Você verá seus grupos existentes (Multimídia, Voluntariado Geral)

2. **Gerenciar Administradores:**
   - Clique no botão **"Admins"** (ícone de escudo) ao lado de cada grupo
   - Uma modal será aberta mostrando:
     - Lista de administradores atuais do grupo
     - Opção para adicionar novos administradores
     - Opção para remover administradores existentes

3. **Adicionar um Administrador:**
   - No dropdown "Selecione um usuário", escolha um membro ativo
   - Clique em "Adicionar"
   - O usuário agora será administrador daquele grupo específico

### 2. Como Admin de Grupo - Experiência Limitada

Quando um usuário é designado como admin de grupo:

1. **Login:** Faça login com as credenciais do usuário designado
2. **Interface Simplificada:** Verá apenas:
   - Dashboard
   - Escalas
3. **Funções Filtradas:** Ao criar escalas, verá apenas funções do seu grupo
4. **Sem Acesso a:** Logs, Membros globais, Campus, Ministérios, Funções (CRUD)

## 🔧 Estrutura Técnica

### Backend
- **Modelo:** `FunctionGroupAdmin` relaciona usuários com grupos
- **JWT:** Inclui `userType` e `adminGroups`
- **Middlewares:** Controle de acesso por tipo de usuário
- **APIs:** `/api/function-group-admins/*`

### Frontend
- **Hooks:** `useIsGroupAdmin()`, `useCanManageGroup()`, etc.
- **Menu Dinâmico:** Filtra opções baseado em permissões
- **Filtros:** Funções disponíveis filtradas por grupo

## 📋 Fluxo de Teste

### Teste Básico:
1. **Crie um usuário membro** (se não tiver)
2. **Como admin geral:** Designe o usuário como admin do grupo "Multimídia"
3. **Faça logout** e **login com o usuário designado**
4. **Verifique:** Menu limitado (só Dashboard e Escalas)
5. **Crie uma escala:** Veja apenas funções do grupo Multimídia

### APIs para Teste Manual:

```bash
# Designar usuário ID 2 como admin do grupo ID 1
curl -X POST http://localhost:5000/api/function-group-admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN" \
  -d '{"userId": 2, "functionGroupId": 1}'

# Listar admins do grupo ID 1
curl -X GET http://localhost:5000/api/function-group-admins/group/1/admins \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN"

# Listar funções disponíveis para admin de grupo
curl -X GET http://localhost:5000/api/function-group-admins/my-functions \
  -H "Authorization: Bearer TOKEN_DO_ADMIN_GRUPO"
```

## ✅ Funcionalidades Confirmadas

- ✅ Cadastro de administradores por grupo via interface
- ✅ Menu dinâmico baseado em permissões
- ✅ Filtro de funções por grupo do administrador
- ✅ Proteção de rotas no backend
- ✅ JWT com informações de tipo de usuário
- ✅ Interface responsiva e intuitiva

## 🎨 Interface

Na página `/admin/functions`, você verá:
- **Botão "Admins"** (azul claro) para cada grupo
- **Modal de administradores** com:
  - Lista de admins atuais
  - Dropdown para adicionar novos
  - Botão de remoção para cada admin

A implementação está completa e pronta para uso!