const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const logger = require('../utils/logger');

// Detectar se estamos em ambiente de desenvolvimento sem dependências do sistema
const isDevelopmentMode = process.env.NODE_ENV === 'development' || process.env.WHATSAPP_DEV_MODE === 'true';

class WhatsAppService {
    constructor() {
        this.client = null;
        this.isReady = false;
        this.qrCode = null;

        // Não fazer limpeza inicial no constructor
        // Deixar para o método initialize
    }

    async initialize() {
        try {
            console.log('🔄 Inicializando WhatsApp Service...');
            logger.info('Inicializando WhatsApp Service...');

            // Verificar e preparar diretório de sessão
            await this.ensureSessionDirectory();

            const sessionPath = './whatsapp-session';

            this.client = new Client({
                authStrategy: new LocalAuth({
                    dataPath: sessionPath
                }),
                puppeteer: {
                    headless: true,
                    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser',
                    args: [
                        '--no-sandbox',
                        '--disable-setuid-sandbox',
                        '--disable-gpu',
                        '--disable-extensions',
                        '--disable-dev-shm-usage',
                        '--disable-web-security',
                        '--disable-features=VizDisplayCompositor',
                        '--disable-background-timer-throttling',
                        '--disable-backgrounding-occluded-windows',
                        '--disable-renderer-backgrounding',
                        `--user-data-dir=${sessionPath}`
                    ],
                    timeout: 60000
                }
            });

            this.client.on('qr', (qr) => {
                console.log('📱 QR Code recebido, escaneie para conectar');
                logger.info('QR Code recebido, escaneie para conectar');
                qrcode.toDataURL(qr, (err, url) => {
                    if (!err) {
                        this.qrCode = url;
                        console.log('✅ QR Code convertido para base64 com sucesso');
                        logger.info('QR Code convertido para base64 com sucesso');
                    } else {
                        console.error('❌ Erro ao converter QR Code:', err);
                        logger.error('Erro ao converter QR Code:', err);
                    }
                });
            });

            this.client.on('loading_screen', (percent, message) => {
                console.log(`⏳ WhatsApp loading: ${percent}% - ${message}`);
                logger.info(`WhatsApp loading: ${percent}% - ${message}`);
            });

            this.client.on('authenticated', () => {
                console.log('🔐 WhatsApp Web autenticado com sucesso');
                logger.info('WhatsApp Web autenticado com sucesso');
            });

            this.client.on('ready', () => {
                console.log('🎉 WhatsApp Web conectado e pronto para uso');
                logger.info('WhatsApp Web conectado e pronto para uso');
                this.isReady = true;
                this.qrCode = null;
            });

            this.client.on('auth_failure', (msg) => {
                console.error('❌ Falha na autenticação WhatsApp:', msg);
                logger.error('Falha na autenticação WhatsApp:', msg);
            });

            this.client.on('disconnected', (reason) => {
                console.warn('⚠️ WhatsApp Web desconectado:', reason);
                logger.warn('WhatsApp Web desconectado:', reason);
                this.isReady = false;
            });

            console.log('🚀 Inicializando cliente WhatsApp...');
            await this.client.initialize();
        } catch (error) {
            console.error('❌ Erro ao inicializar WhatsApp:', error);
            logger.error('Erro ao inicializar WhatsApp:', error);

            // Se falhou, tentar limpar sessão corrompida
            if (error.message.includes('Session') || error.message.includes('Chrome') || error.message.includes('profile')) {
                console.log('🔄 Tentando limpar sessão corrompida...');
                await this.clearCorruptedSession();
            }

            throw error;
        }
    }

    async sendMessage(phone, message) {
        if (!this.isReady) {
            throw new Error('WhatsApp não está conectado');
        }

        try {
            console.log(`🚀 INICIANDO envio para: ${phone}`);
            
            // PRIMEIRO: Tentar com o número exato como está no banco
            const originalFormatted = this.formatPhoneNumber(phone);
            console.log(`📱 Formato original: ${originalFormatted}`);
            
            // SEGUNDO: Verificar se está registrado
            const isRegistered = await this.client.isRegisteredUser(originalFormatted);
            console.log(`✅ Registrado: ${isRegistered}`);
            
            if (!isRegistered) {
                // TERCEIRO: Tentar versão alternativa (com/sem 9º dígito)
                const alternativeNumber = this.getAlternativeFormat(phone);
                console.log(`🔄 Testando formato alternativo: ${alternativeNumber}`);
                
                const altRegistered = await this.client.isRegisteredUser(alternativeNumber);
                console.log(`✅ Alternativo registrado: ${altRegistered}`);
                
                if (altRegistered) {
                    console.log(`✅ Usando formato alternativo: ${alternativeNumber}`);
                    const result = await this.client.sendMessage(alternativeNumber, message);
                    return result;
                } else {
                    throw new Error(`Número ${phone} não encontrado no WhatsApp (testados: ${originalFormatted}, ${alternativeNumber})`);
                }
            }
            
            // QUARTO: Usar getNumberId para garantir o ID correto
            const cleanPhone = phone.replace(/\D/g, '');
            const numberId = await this.client.getNumberId(`55${cleanPhone.startsWith('55') ? cleanPhone.substring(2) : cleanPhone}`);
            
            if (numberId) {
                console.log(`✅ NumberId encontrado: ${numberId._serialized}`);
                const result = await this.client.sendMessage(numberId._serialized, message);
                console.log(`✅ Mensagem enviada via NumberId!`);
                return result;
            }
            
            // QUINTO: Usar formato original mesmo assim
            console.log(`📤 Enviando com formato original: ${originalFormatted}`);
            const result = await this.client.sendMessage(originalFormatted, message);
            
            console.log(`✅ Mensagem enviada com sucesso!`);
            return result;
            
        } catch (error) {
            console.error(`❌ Erro ao enviar mensagem para ${phone}:`, error);
            
            // ÚLTIMO RECURSO: Tentar método de debug/manual
            try {
                console.log(`🔧 Tentando método de recuperação...`);
                return await this.debugAndSendMessage(phone, message);
            } catch (debugError) {
                console.error(`❌ Método de recuperação também falhou:`, debugError);
            }
            
            throw error;
        }
    }

    formatPhoneNumber(phone) {
        if (!phone) {
            throw new Error('Número de telefone é obrigatório');
        }
        
        // Limpar o número - remover tudo que não é dígito
        let cleanPhone = phone.replace(/\D/g, '');
        
        // Remover código do país 55 se já existir
        if (cleanPhone.startsWith('55')) {
            cleanPhone = cleanPhone.substring(2);
        }
        
        // Validar se é um número brasileiro válido
        if (cleanPhone.length < 10 || cleanPhone.length > 11) {
            throw new Error(`Número inválido: ${cleanPhone} (deve ter 10 ou 11 dígitos)`);
        }
        
        // Se tem 11 dígitos, já está no formato correto (DDD + 9 + número)
        // Se tem 10 dígitos, adicionar o 9º dígito
        if (cleanPhone.length === 10) {
            const areaCode = cleanPhone.substring(0, 2);
            const number = cleanPhone.substring(2);
            cleanPhone = `${areaCode}9${number}`;
        }
        
        // Formato final para whatsapp-web.js: 55 + DDD + 9 + número + @c.us
        const finalNumber = `55${cleanPhone}@c.us`;
        
        console.log(`📱 Formatação: ${phone} -> ${finalNumber}`);
        return finalNumber;
    }

    async sendMessageAlternative(phone, message) {
        try {
            // Limpar número
            let cleanPhone = phone.replace(/\D/g, '');
            
            if (cleanPhone.startsWith('55')) {
                cleanPhone = cleanPhone.substring(2);
            }
            
            // Adicionar 9 se necessário
            if (cleanPhone.length === 10) {
                const areaCode = cleanPhone.substring(0, 2);
                const number = cleanPhone.substring(2);
                cleanPhone = `${areaCode}9${number}`;
            }
            
            // Usar getNumberId para obter o ID correto
            const numberId = await this.client.getNumberId(`55${cleanPhone}`);
            
            if (!numberId) {
                throw new Error(`Número ${phone} não foi encontrado no WhatsApp`);
            }
            
            console.log(`📱 NumberId encontrado: ${numberId._serialized}`);
            
            // Enviar usando o ID correto
            const result = await this.client.sendMessage(numberId._serialized, message);
            
            console.log(`✅ Mensagem enviada via NumberId!`);
            return result;
            
        } catch (error) {
            console.error(`❌ Erro no método alternativo:`, error);
            throw error;
        }
    }

    async debugPhoneNumber(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        
        console.log(`🔍 DEBUG do número: ${phone}`);
        console.log(`   Limpo: ${cleanPhone}`);
        
        // Testar diferentes formatos
        const formats = [
            `55${cleanPhone}@c.us`,
            `${cleanPhone}@c.us`,
            `55${cleanPhone.substring(2)}@c.us` // Remove 55 se já tiver
        ];
        
        for (const format of formats) {
            try {
                const isRegistered = await this.client.isRegisteredUser(format);
                console.log(`   ${format} -> Registrado: ${isRegistered}`);
                
                if (isRegistered) {
                    try {
                        const chat = await this.client.getChatById(format);
                        console.log(`   ${format} -> Chat existe: ${chat.name || 'Sem nome'}`);
                    } catch (chatError) {
                        console.log(`   ${format} -> Chat não encontrado`);
                    }
                }
            } catch (error) {
                console.log(`   ${format} -> Erro: ${error.message}`);
            }
        }
        
        // Testar getNumberId
        try {
            const numberId = await this.client.getNumberId(`55${cleanPhone}`);
            console.log(`   getNumberId: ${numberId ? numberId._serialized : 'null'}`);
        } catch (error) {
            console.log(`   getNumberId erro: ${error.message}`);
        }
    }

    getQRCode() {
        return this.qrCode;
    }

    isConnected() {
        return this.isReady;
    }

    getConnectionStatus() {
        if (this.isReady) {
            return 'connected';
        } else if (this.qrCode) {
            return 'awaiting_qr';
        } else {
            return 'disconnected';
        }
    }

    async disconnect() {
        try {
            console.log('🔄 Iniciando processo de desconexão...');

            if (this.client) {
                try {
                    // Primeiro tenta o logout
                    await this.client.logout();
                    console.log('✅ Logout do cliente realizado');
                } catch (logoutError) {
                    console.warn('⚠️ Erro no logout:', logoutError.message);
                }

                try {
                    // Depois destroi o cliente
                    await this.client.destroy();
                    console.log('✅ Cliente destruído');
                } catch (destroyError) {
                    console.warn('⚠️ Erro ao destruir cliente:', destroyError.message);
                }

                this.client = null;
                logger.info('WhatsApp Web desconectado');
            }

            // Limpar processos Chrome orfãos
            await this.killOrphanedChrome();

        } catch (error) {
            console.error('❌ Erro ao desconectar WhatsApp:', error);
            logger.error('Erro ao desconectar WhatsApp:', error);
            // Forçar reset do client mesmo com erro
            this.client = null;
        } finally {
            // Sempre resetar o estado
            this.isReady = false;
            this.qrCode = null;
            console.log('✅ Estado do WhatsApp resetado');
        }
    }

    async killOrphanedChrome() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            console.log('🔄 Limpando processos Chrome orfãos...');

            // Matar processos Chrome defunct
            await execAsync('pkill -f "chrome|chromium" || true');

            // Aguardar um pouco
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('✅ Processos Chrome limpos');
        } catch (error) {
            console.warn('⚠️ Erro ao limpar processos Chrome:', error.message);
        }
    }

    async ensureSessionDirectory() {
        const fs = require('fs').promises;
        const path = require('path');

        try {
            const sessionPath = path.resolve('./whatsapp-session');

            // Verificar se o diretório existe
            try {
                await fs.access(sessionPath);
            } catch {
                // Criar se não existir
                await fs.mkdir(sessionPath, { recursive: true, mode: 0o755 });
                console.log('📁 Diretório de sessão criado:', sessionPath);
            }

            console.log('✅ Diretório de sessão verificado');
        } catch (error) {
            console.warn('⚠️ Erro ao verificar diretório de sessão:', error.message);
        }
    }

    async clearCorruptedSession() {
        const fs = require('fs').promises;
        const path = require('path');

        try {
            const sessionPath = path.resolve('./whatsapp-session');
            const backupPath = path.resolve(`./whatsapp-session-backup-${Date.now()}`);

            console.log('🧹 Limpando sessão corrompida...');

            // Fazer backup antes de limpar
            try {
                await fs.rename(sessionPath, backupPath);
                console.log('💾 Backup da sessão criado:', backupPath);
            } catch (renameError) {
                // Se não conseguir renomear, tentar remover diretamente
                try {
                    await fs.rmdir(sessionPath, { recursive: true });
                    console.log('🗑️ Diretório de sessão removido');
                } catch (removeError) {
                    console.warn('⚠️ Não foi possível remover diretório:', removeError.message);
                }
            }

            // Recriar diretório
            await this.ensureSessionDirectory();
            console.log('✅ Sessão corrompida limpa');

        } catch (error) {
            console.warn('⚠️ Erro ao limpar sessão corrompida:', error.message);
        }
    }

    async cleanOldSession() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            console.log('🧹 Limpando sessões antigas...');

            // Limpeza mais agressiva de processos Chrome
            await execAsync('pkill -9 -f "chrome|chromium|puppeteer" || true');

            // Aguardar um pouco para os processos morrerem
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Limpar diretórios temporários do Chrome (mais agressivo)
            await execAsync('rm -rf /tmp/chrome-* || true');
            await execAsync('rm -rf /tmp/.org.chromium.* || true');

            // Limpar sessões antigas do WhatsApp
            await execAsync('rm -rf ./whatsapp-session* || true');

            // Limpar arquivos de lock do Chrome
            await execAsync('rm -rf /tmp/*/SingletonLock || true');

            console.log('✅ Sessões antigas limpas de forma agressiva');
        } catch (error) {
            console.warn('⚠️ Erro ao limpar sessões antigas:', error.message);
        }
    }

    async reconnect() {
        try {
            console.log('🔄 Iniciando processo de reconexão...');
            logger.info('Iniciando processo de reconexão WhatsApp');

            // Primeiro: desconectar completamente
            await this.disconnect();
            console.log('✅ Desconexão concluída');

            // Aguardar para garantir limpeza completa
            console.log('⏳ Aguardando limpeza completa...');
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Reinicializar
            await this.initialize();
            console.log('✅ Reconexão concluída');
            logger.info('Reconexão WhatsApp concluída com sucesso');

        } catch (error) {
            console.error('❌ Erro durante reconexão:', error);
            logger.error('Erro durante reconexão WhatsApp:', error);

            // Em caso de erro, forçar limpeza completa
            try {
                await this.killOrphanedChrome();
                this.client = null;
                this.isReady = false;
                this.qrCode = null;
            } catch (cleanupError) {
                console.error('❌ Erro na limpeza de emergência:', cleanupError);
            }

            throw error;
        }
    }
}

// Singleton instance
const whatsappService = new WhatsAppService();

module.exports = whatsappService;