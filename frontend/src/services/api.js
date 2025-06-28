import axios from 'axios';
import { toast } from 'react-toastify';

// Rate limiting para toasts
let lastToastTime = 0;
const TOAST_COOLDOWN = 3000; // 3 segundos entre toasts

const showToast = (message, type = 'error') => {
    const now = Date.now();
    if (now - lastToastTime > TOAST_COOLDOWN) {
        if (type === 'error') {
            toast.error(message);
        } else {
            toast.success(message);
        }
        lastToastTime = now;
    }
};

// Configuração base do axios
export const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para adicionar token de autorização
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('@igreja:token');

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Token adicionado à requisição:', token.substring(0, 20) + '...');
        }

        console.log('Fazendo requisição:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Erro no interceptor de request:', error);
        return Promise.reject(error);
    }
);

// Interceptor para lidar com erros de resposta - MELHORADO
api.interceptors.response.use(
    (response) => {
        console.log('Resposta recebida:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('Erro na resposta:', error);

        // Rate Limiting (429)
        if (error.response?.status === 429) {
            console.error('Rate Limiting atingido:', error.response.data);
            showToast('Muitas tentativas. Aguarde um momento e tente novamente.');
            return Promise.reject(error);
        }

        // Token expirado ou inválido (401)
        if (error.response?.status === 401) {
            console.log('Token inválido/expirado');
            
            const token = localStorage.getItem('@igreja:token');
            if (token) {
                localStorage.removeItem('@igreja:token');
                
                // Só redirecionar se não estiver já na página de login
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    showToast('Sessão expirada. Faça login novamente.');
                    
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                }
            }
            
            return Promise.reject(error);
        }

        // Forbidden (403)
        if (error.response?.status === 403) {
            console.error('Acesso negado:', error.response.data);
            showToast('Você não tem permissão para realizar esta ação.');
            return Promise.reject(error);
        }

        // Not Found (404)
        if (error.response?.status === 404) {
            console.error('Recurso não encontrado:', error.response.data);
            // Não mostrar toast para 404, deixar componentes tratarem
            return Promise.reject(error);
        }

        // Erro de servidor (5xx)
        if (error.response?.status >= 500) {
            console.error('Erro do servidor:', error.response.status, error.response.data);
            showToast('Erro interno do servidor. Tente novamente mais tarde.');
            return Promise.reject(error);
        }

        // Outros erros de cliente (4xx)
        if (error.response?.status >= 400 && error.response?.status < 500) {
            console.error('Erro do cliente:', error.response.status, error.response.data);
            const errorMessage = error.response.data?.error || 'Erro na requisição';
            console.log('Erro 4xx:', errorMessage);
            return Promise.reject(error);
        }

        // Erro de rede (sem resposta do servidor)
        if (!error.response) {
            console.error('Erro de rede:', error.message);
            showToast('Erro de conexão. Verifique sua internet e se o servidor está rodando.');
            return Promise.reject(error);
        }

        return Promise.reject(error);
    }
);

// Função para limpar autenticação
export const clearAuth = () => {
    localStorage.removeItem('@igreja:token');
    delete api.defaults.headers.Authorization;
    console.log('Auth limpa');
};

// Função para verificar conectividade com o backend
export const checkBackendConnection = async () => {
    try {
        const response = await api.get('/health');
        console.log('✅ Backend conectado:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Backend não está respondendo:', error.message);
        return false;
    }
};

export default api;