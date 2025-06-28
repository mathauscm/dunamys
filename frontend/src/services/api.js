import axios from 'axios';
import { toast } from 'react-toastify';

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

// Interceptor para lidar com erros de resposta
api.interceptors.response.use(
    (response) => {
        console.log('Resposta recebida:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('Erro na resposta:', error);

        // Token expirado ou inválido
        if (error.response?.status === 401) {
            console.log('Token inválido/expirado, removendo do localStorage');
            
            const token = localStorage.getItem('@igreja:token');
            if (token) {
                localStorage.removeItem('@igreja:token');
                
                // Só redirecionar e mostrar toast se não estiver já na página de login
                const currentPath = window.location.pathname;
                if (currentPath !== '/login' && currentPath !== '/register') {
                    toast.error('Sessão expirada. Faça login novamente.');
                    
                    // Aguardar um pouco antes de redirecionar para permitir que o toast apareça
                    setTimeout(() => {
                        window.location.href = '/login';
                    }, 1000);
                }
            }
            
            return Promise.reject(error);
        }

        // Erro de servidor (5xx)
        if (error.response?.status >= 500) {
            console.error('Erro do servidor:', error.response.status, error.response.data);
            toast.error('Erro interno do servidor. Tente novamente mais tarde.');
        }

        // Erro de cliente (4xx - exceto 401 que já foi tratado)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 401) {
            console.error('Erro do cliente:', error.response.status, error.response.data);
            
            // Não mostrar toast para erros 404 automaticamente
            if (error.response.status !== 404) {
                const errorMessage = error.response.data?.error || 'Erro na requisição';
                // Não mostrar toast aqui, deixar os componentes decidirem
                console.log('Erro 4xx:', errorMessage);
            }
        }

        // Erro de rede (sem resposta do servidor)
        if (!error.response) {
            console.error('Erro de rede:', error.message);
            toast.error('Erro de conexão. Verifique sua internet e se o servidor está rodando.');
        }

        return Promise.reject(error);
    }
);

// Função auxiliar para debug
export const debugApi = {
    logRequest: (method, url, data) => {
        console.group(`🔍 API ${method.toUpperCase()} ${url}`);
        if (data) console.log('Data:', data);
        console.groupEnd();
    },
    
    logResponse: (method, url, response) => {
        console.group(`✅ API ${method.toUpperCase()} ${url} - ${response.status}`);
        console.log('Response:', response.data);
        console.groupEnd();
    },
    
    logError: (method, url, error) => {
        console.group(`❌ API ${method.toUpperCase()} ${url} - ${error.response?.status || 'Network Error'}`);
        console.error('Error:', error.response?.data || error.message);
        console.groupEnd();
    }
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

// Função para limpar autenticação
export const clearAuth = () => {
    localStorage.removeItem('@igreja:token');
    delete api.defaults.headers.Authorization;
};

export default api;