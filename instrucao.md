# 📖 Instrução: Como Adicionar Novos Domínios à VPS

## 🎯 Recomendação: Arquivo Separado por Domínio

Para cada novo domínio (como `maressacookier.com`), crie um arquivo separado no Nginx. Esta é a **melhor prática** para organização e manutenção.

---

## 🚀 Passo a Passo Completo

### **1. Criar Arquivo de Configuração**

```bash
sudo nano /etc/nginx/sites-available/maressacookier.com
```

### **2. Colar Configuração Base**

```nginx
server {
    listen 80;
    server_name maressacookier.com www.maressacookier.com;

    # Logs específicos do domínio
    access_log /var/log/nginx/maressacookier.access.log;
    error_log /var/log/nginx/maressacookier.error.log;

    # Headers de segurança
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # =============================================================
    # SITE PRINCIPAL - PORTA 8081 (escolha uma porta livre)
    # =============================================================
    location / {
        proxy_pass http://127.0.0.1:8081;
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
    }

    # =============================================================
    # API (se o projeto tiver)
    # =============================================================
    location /api {
        proxy_pass http://127.0.0.1:8081/api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts para API
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # =============================================================
    # CACHE PARA ARQUIVOS ESTÁTICOS
    # =============================================================
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header Host $host;

        # Cache longo para assets estáticos
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary Accept-Encoding;

        # Compressão
        gzip on;
        gzip_vary on;
        gzip_comp_level 6;
        gzip_types text/css application/javascript text/javascript application/json;
    }

    # =============================================================
    # CONFIGURAÇÕES DE SEGURANÇA
    # =============================================================
    # Bloquear acesso a arquivos sensíveis
    location ~ /\.(?!well-known).* {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Bloquear acesso a arquivos de configuração
    location ~ /\.(env|git|svn|htaccess|htpasswd) {
        deny all;
        access_log off;
        log_not_found off;
    }

    # Health check
    location /health {
        return 200 '{"status":"ok","domain":"maressacookier.com"}';
        add_header Content-Type application/json;
        access_log off;
    }
}
```

### **3. Ativar o Site**

```bash
# Criar link simbólico
sudo ln -s /etc/nginx/sites-available/maressacookier.com /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Se passou no teste, recarregar
sudo systemctl reload nginx
```

### **4. Verificar Status**

```bash
# Ver todos os sites ativos
ls -la /etc/nginx/sites-enabled/

# Ver logs específicos do domínio
sudo tail -f /var/log/nginx/maressacookier.access.log
```

---

## 🔧 Configurações Importantes

### **📍 Portas Utilizadas (controle interno):**
- **8080**: Dunamys (voluntários da igreja)
- **8700**: Zolpia (análise de receitas)
- **8081**: maressacookier.com (NOVA)
- **8082**: Próximo projeto disponível
- **8083**: Próximo projeto disponível

### **🌐 Estrutura de Domínios:**
```
69.62.90.202/              → Dashboard de projetos
69.62.90.202/dunamys       → Sistema Dunamys
69.62.90.202/zolpia        → Sistema Zolpia
maressacookier.com         → Site específico (porta 8081)
voluntarios.mathaus.dev    → Dunamys (configuração já existente)
```

### **📁 Arquivos de Configuração:**
```
/etc/nginx/sites-available/
├── multiprojetos           # VPS projetos (IP + subdomínios)
├── maressacookier.com     # Domínio específico
└── futuro-dominio.com     # Próximos domínios

/etc/nginx/sites-enabled/
├── multiprojetos          # Link ativo
├── maressacookier.com     # Link ativo
└── futuro-dominio.com     # Link ativo
```

---

## 🔒 Configurar SSL (Opcional - Recomendado)

### **1. Instalar Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx
```

### **2. Obter Certificado:**
```bash
sudo certbot --nginx -d maressacookier.com -d www.maressacookier.com
```

### **3. Renovação Automática:**
```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar cron para renovação automática (já vem configurado)
sudo systemctl status certbot.timer
```

---

## ✅ Vantagens desta Abordagem

1. **📂 Organização**: Cada domínio tem seu próprio arquivo
2. **📊 Logs Específicos**: Fácil debugging por domínio
3. **🔒 SSL Individual**: Certificados independentes
4. **🛠️ Manutenção**: Fácil editar/desativar domínios específicos
5. **📈 Escalabilidade**: Adicionar novos domínios sem afetar existentes
6. **🔄 Flexibilidade**: Cada domínio pode ter configurações únicas

---

## 🚀 Para Adicionar Mais Domínios

Repita o processo para cada novo domínio:

1. **Escolha uma porta livre** (8082, 8083, etc.)
2. **Crie arquivo** `/etc/nginx/sites-available/novo-dominio.com`
3. **Adapte a configuração** mudando porta e server_name
4. **Ative com link simbólico**
5. **Configure SSL se necessário**

---

## ⚠️ Notas Importantes

- **DNS**: Certifique-se que o domínio aponta para o IP da VPS (69.62.90.202)
- **Firewall**: Garanta que as portas 80 e 443 estejam abertas
- **Aplicação**: Configure sua aplicação para rodar na porta especificada
- **Docker**: Se usar Docker, mapeie a porta correta no docker-compose.yml

---

## 📞 Troubleshooting

### **Erro de DNS:**
```bash
# Verificar se domínio resolve para seu IP
dig maressacookier.com
nslookup maressacookier.com
```

### **Erro de Nginx:**
```bash
# Verificar sintaxe
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

### **Erro de Conexão:**
```bash
# Verificar se aplicação está rodando na porta
sudo netstat -tulpn | grep :8081
```