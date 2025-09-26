# 🚀 Deploy do Dunamys na VPS - Guia Completo

## 📁 Arquivos de Nginx no Projeto

**Mantido apenas:**
- `nginx-final.conf` - Configuração para VPS multi-projeto

**Removidos (desnecessários):**
- ~~nginx.conf~~
- ~~nginx-server-config.conf~~
- ~~nginx-voluntarios-domain.conf~~
- ~~nginx-vps-config.conf~~

---

## 🔧 Pré-requisitos na VPS

### **1. Docker e Docker Compose instalados**
```bash
# Verificar se estão instalados
docker --version
docker-compose --version
```

### **2. Git instalado**
```bash
git --version
```

### **3. Nginx configurado (conforme instrucao.md)**
- Arquivo `/etc/nginx/sites-available/multiprojetos` configurado
- Link ativo em `/etc/nginx/sites-enabled/`

---

## 🚀 Deploy Step-by-Step

### **Passo 1: Clonar o Repositório**
```bash
# Navegar para diretório de projetos
cd /home/usuario/

# Clonar o repositório
git clone https://github.com/seu-usuario/dunamys.git
cd dunamys
```

### **Passo 2: Configurar Variáveis de Ambiente**
```bash
# Copiar arquivo de exemplo
cp .env.example .env.production

# Editar variáveis de produção
nano .env.production
```

**Configurações importantes no `.env.production`:**
```env
NODE_ENV=production
PORT=5000

# Database
DATABASE_URL="postgresql://usuario:senha@postgres:5432/dunamys_prod"

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=sua_chave_super_secreta_aqui

# Admin Master
MASTER_ADMIN_EMAIL=mathauscarvalho@gmail.com

# Frontend URL (para CORS)
FRONTEND_URL=http://69.62.90.202
```

### **Passo 3: Configurar Docker Compose para Produção**
```bash
# Editar docker-compose.yml se necessário
nano docker-compose.yml
```

**Verificar portas no docker-compose.yml:**
```yaml
services:
  nginx:
    ports:
      - "8080:80"  # ← Esta deve ser a porta 8080 para o Nginx do VPS
```

### **Passo 4: Build e Deploy**
```bash
# Fazer build e subir containers
docker compose -f docker-compose.yml --env-file .env.production up --build -d

# Verificar se containers subiram
docker compose ps
```

### **Passo 5: Configurar Database (CRÍTICO)**

#### **5.1 Executar Migrações do Prisma:**
```bash
# Executar migrações (cria tabelas)
docker compose exec backend npx prisma migrate reset --force
docker compose exec backend npx prisma migrate deploy
```

#### **5.2 Gerar Cliente Prisma (se necessário):**
```bash
docker compose exec backend npx prisma generate
```

#### **5.3 Popular Database (Seed):**
```bash
# Executar seed (cria dados iniciais: admin, funções, etc.)
docker compose exec backend npm run seed
```

### **Passo 6: Verificar Logs**
```bash
# Ver logs de todos os containers
docker compose logs

# Ver logs específicos do backend
docker compose logs backend -f

# Ver logs do frontend
docker compose logs frontend -f
```

### **Passo 7: Testar Aplicação**
```bash
# Testar se aplicação responde
curl http://localhost:8080/health

# Verificar se Nginx está proxiando
curl http://69.62.90.202/dunamys
```

---

## 🔒 Configurações de Segurança

### **1. Configurar Firewall (se necessário)**
```bash
# Permitir apenas portas necessárias
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### **2. SSL com Certbot (Opcional)**
```bash
# Instalar certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado (se usar domínio)
sudo certbot --nginx -d voluntarios.mathaus.dev
```

---

## 📊 Estrutura Final na VPS

```
/home/usuario/
└── dunamys/
    ├── backend/
    ├── frontend/
    ├── docker-compose.yml
    ├── .env.production
    └── nginx-final.conf

Portas:
- Aplicação: 8080 (mapeada pelo Docker)
- Nginx VPS: 80/443 (acesso externo)
- PostgreSQL: 5435 (interna)
- Redis: 6381 (interna)
```

---

## ✅ Checklist de Verificação

### **Antes do Deploy:**
- [ ] VPS com Docker e Docker Compose instalados
- [ ] Nginx configurado com arquivo `multiprojetos`
- [ ] DNS do domínio (se usar) apontando para VPS
- [ ] Firewall configurado

### **Durante o Deploy:**
- [ ] Repositório clonado
- [ ] `.env.production` configurado
- [ ] Containers buildados e rodando
- [ ] Database migrado e populado
- [ ] Logs sem erros críticos

### **Após o Deploy:**
- [ ] Aplicação acessível via browser
- [ ] Login funcionando
- [ ] WhatsApp conectando (se testado)
- [ ] SSL configurado (se usando domínio)

---

## 🚨 Troubleshooting Comum

### **Erro de Database Connection:**
```bash
# Verificar se PostgreSQL está rodando
docker compose logs postgres

# Verificar variáveis de ambiente
docker compose exec backend printenv | grep DATABASE
```

### **Erro de Porta em Uso:**
```bash
# Verificar qual processo usa a porta
sudo netstat -tulpn | grep :8080

# Parar containers se necessário
docker compose down
```

### **Erro de Permissão no WhatsApp:**
```bash
# Verificar diretório de sessão
docker compose exec backend ls -la /app/whatsapp-session

# Recriar se necessário
docker compose exec backend rm -rf /app/whatsapp-session
docker compose restart backend
```

### **Nginx não está proxiando:**
```bash
# Testar configuração do Nginx
sudo nginx -t

# Verificar logs do Nginx
sudo tail -f /var/log/nginx/error.log

# Recarregar configuração
sudo systemctl reload nginx
```

---

## 🔄 Updates e Manutenção

### **Para atualizar o projeto:**
```bash
# Navegar para diretório
cd /home/usuario/dunamys

# Fazer pull das mudanças
git pull origin main

# Rebuild containers se necessário
docker compose up --build -d

# Executar migrações se houver
docker compose exec backend npx prisma migrate deploy
```

### **Para fazer backup:**
```bash
# Backup do banco de dados
docker compose exec postgres pg_dump -U usuario dunamys_prod > backup_$(date +%Y%m%d).sql

# Backup de arquivos de upload (se houver)
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

---

## 📞 Comandos Úteis

```bash
# Ver status dos containers
docker compose ps

# Ver logs em tempo real
docker compose logs -f

# Entrar no container do backend
docker compose exec backend sh

# Reiniciar apenas um serviço
docker compose restart backend

# Ver recursos utilizados
docker stats

# Limpar containers parados e imagens não utilizadas
docker system prune
```

---

## ⚠️ Notas Importantes

1. **Database**: SEMPRE execute migrações e seed após primeiro deploy
2. **SSL**: Configure HTTPS se usar domínio próprio
3. **Backups**: Implemente rotina de backup do database
4. **Monitoramento**: Configure logs e alertas de monitoramento
5. **Updates**: Teste updates em ambiente local primeiro
6. **Secrets**: NUNCA commite arquivos `.env` no Git

---

## 🎯 Resultado Final

Após seguir todos os passos:
- ✅ **http://69.62.90.202/dunamys** - Aplicação acessível
- ✅ **Dashboard administrativo** funcionando
- ✅ **WhatsApp integration** disponível
- ✅ **Database** populado com dados iniciais
- ✅ **SSL** configurado (se usando domínio)