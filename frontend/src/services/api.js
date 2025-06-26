import axios from 'axios';
import { toast } from 'react-toastify';

// Configuração base do axios
export const api = axios.create({
    baseURL: '/api',
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
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para lidar com erros de resposta
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Token expirado ou inválido
        if (error.response?.status === 401) {
            localStorage.removeItem('@igreja:token');
            window.location.href = '/login';
            toast.error('Sessão expirada. Faça login novamente.');
            return Promise.reject(error);
        }

        // Erro de servidor
        if (error.response?.status >= 500) {
            toast.error('Erro interno do servidor. Tente novamente mais tarde.');
        }

        // Erro de rede
        if (!error.response) {
            toast.error('Erro de conexão. Verifique sua internet.');
        }

        return Promise.reject(error);
    }
);
