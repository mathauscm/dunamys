# 🤖 Instruções para LLM - Deploy do Projeto Dunamys

**CONTEXTO**: Você está operando em um **ambiente de servidor Linux** com acesso root. Sua tarefa é fazer o deploy do sistema Dunamys (gestão de membros de igreja) no domínio `voluntarios.mathaus.dev`.

## 📋 INFORMAÇÕES DO AMBIENTE

**Servidor**: Ubuntu/Debian Linux (acesso root)
**Domínio**: voluntarios.mathaus.dev
**IP**: 69.62.90.202
**SSL**: Já configurado com Let's Encrypt
**Docker**: Instalado e funcionando

## 🎯 OBJETIVO

Colocar o sistema Dunamys online no domínio `voluntarios.mathaus.dev` usando Docker e nginx como proxy reverso.

---

## 📝 PASSO A PASSO DETALHADO

### PASSO 1: Verificar Ambiente
```bash
# Verificar se você está no servidor correto
hostname
whoami

# Verificar se Docker está funcionando
docker --version
docker-compose --version

# Verificar nginx
nginx -v
systemctl status nginx
```

### PASSO 2: Navegar para o Projeto
```bash
# Ir para o diretório do projeto (ajuste o caminho se necessário)
cd /var/www/dunamys
# OU
cd /home/usuario/dunamys
# OU onde estiver o projeto

# Verificar se está no diretório correto
ls -la
# Deve mostrar: docker-compose.yml, frontend/, backend/, etc.
```

### PASSO 3: Configurar Variáveis de Ambiente
```bash
# Copiar arquivo de produção
cp .env.production .env

# Verificar o conteúdo
cat .env

# Se necessário, editar (o arquivo já está configurado para voluntarios.mathaus.dev)
nano .env
```

### PASSO 4: Configurar Nginx (CRÍTICO)
```bash
# Backup da configuração atual
cp /etc/nginx/sites-available/voluntarios.mathaus.dev /etc/nginx/sites-available/voluntarios.mathaus.dev.backup

# Abrir arquivo para edição
nano /etc/nginx/sites-available/voluntarios.mathaus.dev
```

**SUBSTITUA TODO O CONTEÚDO** pelo seguinte:

```nginx
# Redirecionamento HTTP para HTTPS
server {
    listen 80;
    server_name voluntarios.mathaus.dev;
    return 301 https://$server_name$request_uri;
}

# Configuração HTTPS
server {
    listen 443 ssl http2;
    server_name voluntarios.mathaus.dev;

    # Certificados SSL (já configurados)
    ssl_certificate /etc/letsencrypt/live/voluntarios.mathaus.dev/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/voluntarios.mathaus.dev/privkey.pem;

    # Configurações SSL de segurança
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_session_timeout 10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;
    ssl_stapling on;
    ssl_stapling_verify on;

    # Headers de segurança
    add_header Strict-Transport-Security "max-age=63072000" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Logs específicos
    access_log /var/log/nginx/dunamys.access.log;
    error_log /var/log/nginx/dunamys.error.log;

    # IMPORTANTE: Proxy para API (Backend) - porta 4001
    location /api {
        # Remove o /api do path para o backend
        rewrite ^/api/?(.*)$ /$1 break;

        proxy_pass http://127.0.0.1:4001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://voluntarios.mathaus.dev' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
    }

    # Health check da API
    location /api/health {
        proxy_pass http://127.0.0.1:4001/health;
        proxy_set_header Host $host;
        access_log off;
    }

    # Proxy para Frontend - porta 4002
    location / {
        proxy_pass http://127.0.0.1:4002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # Cache para arquivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:4002;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
        gzip on;
        gzip_vary on;
        gzip_comp_level 6;
    }

    # Health check do frontend
    location /health {
        proxy_pass http://127.0.0.1:4002/health;
        proxy_set_header Host $host;
        access_log off;
    }
}
```

### PASSO 5: Testar Configuração Nginx
```bash
# Testar configuração
nginx -t

# Se deu erro, verificar e corrigir
# Se deu OK, recarregar
systemctl reload nginx
```

### PASSO 6: Parar Containers Existentes (se houver)
```bash
# Parar qualquer container que possa estar rodando nas portas
docker-compose down

# Verificar se as portas estão livres
netstat -tuln | grep -E ':4001|:4002'

# Se houver processos nas portas, mate-os
# lsof -ti:4001 | xargs kill -9
# lsof -ti:4002 | xargs kill -9
```

### PASSO 7: Build e Subir os Containers
```bash
# Build das imagens (pode demorar alguns minutos)
docker-compose build

# Subir os containers em background
docker-compose up -d

# Verificar se subiram corretamente
docker-compose ps
```

**SAÍDA ESPERADA:**
```
         Name                       Command               State           Ports
-------------------------------------------------------------------------------------
dunamys-backend    npm start                     Up      0.0.0.0:4001->5000/tcp
dunamys-frontend   nginx -g daemon off;          Up      0.0.0.0:4002->80/tcp
dunamys-postgres   docker-entrypoint.sh postgres Up      0.0.0.0:5435->5432/tcp
dunamys-redis      docker-entrypoint.sh redis ... Up      0.0.0.0:6380->6379/tcp
```

### PASSO 8: Aguardar Inicialização
```bash
# Aguardar containers ficarem saudáveis (30-60 segundos)
sleep 30

# Verificar logs se houver problemas
docker-compose logs backend
docker-compose logs frontend
```

### PASSO 9: Executar Migrações do Banco
```bash
# Executar migrações (criar tabelas)
docker-compose exec backend npm run migrate

# Executar seed (dados iniciais + admin)
docker-compose exec backend npm run seed
```

### PASSO 10: Testes de Funcionamento
```bash
# Testar se backend está respondendo
curl -I http://localhost:4001/health
# Deve retornar HTTP 200

# Testar se frontend está respondendo
curl -I http://localhost:4002/health
# Deve retornar HTTP 200

# Testar via nginx (externo)
curl -I https://voluntarios.mathaus.dev/api/health
curl -I https://voluntarios.mathaus.dev/health
```

---

## 🎯 VERIFICAÇÕES FINAIS

### Status Esperado:
✅ Nginx reload sem erros
✅ 4 containers rodando (backend, frontend, postgres, redis)
✅ Backend respondendo na porta 4001
✅ Frontend respondendo na porta 4002
✅ Site acessível via https://voluntarios.mathaus.dev

### Login de Teste:
- **URL**: https://voluntarios.mathaus.dev
- **Email**: mathauscarvalho@gmail.com
- **Senha**: kenbuk-gerjih-dyKve9

### Login Backup (se necessário):
- **Email**: admin@igreja.com
- **Senha**: admin123

---

## 🆘 TROUBLESHOOTING

### Se containers não subirem:
```bash
# Ver logs detalhados
docker-compose logs

# Verificar recursos
df -h
free -m

# Rebuild forçado
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Se nginx der erro:
```bash
# Verificar sintaxe
nginx -t

# Ver logs de erro
tail -f /var/log/nginx/error.log

# Restaurar backup se necessário
cp /etc/nginx/sites-available/voluntarios.mathaus.dev.backup /etc/nginx/sites-available/voluntarios.mathaus.dev
```

### Se banco não conectar:
```bash
# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U postgres

# Ver logs
docker-compose logs postgres
```

---

## ✅ CONCLUSÃO

Após seguir todos os passos:

1. **Site estará online**: https://voluntarios.mathaus.dev
2. **API funcionando**: https://voluntarios.mathaus.dev/api/health
3. **Admin disponível**: Login com mathauscarvalho@gmail.com / kenbuk-gerjih-dyKve9
4. **Logs disponíveis**: `docker-compose logs -f`

**LOGIN MASTER**: mathauscarvalho@gmail.com / kenbuk-gerjih-dyKve9
**LOGIN BACKUP**: admin@igreja.com / admin123

**IMPORTANTE**: O admin master (Mathaus) já está configurado com suas credenciais!