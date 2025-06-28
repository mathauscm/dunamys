import { api } from './api';

export const authService = {
    async login(email, password) {
        console.log('authService.login chamado com:', email);
        
        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            console.log('Resposta do login:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro no authService.login:', error);
            throw error;
        }
    },

    async register(userData) {
        console.log('authService.register chamado com:', userData.email);
        
        try {
            const response = await api.post('/auth/register', userData);
            console.log('Resposta do registro:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro no authService.register:', error);
            throw error;
        }
    },

    async verifyToken(token) {
        console.log('authService.verifyToken chamado');
        
        try {
            // Criar uma instância temporária do axios com o token
            const tempApi = api.create ? api.create() : api;
            tempApi.defaults.headers.Authorization = `Bearer ${token}`;

            const response = await tempApi.get('/members/profile');
            console.log('Token verificado, usuário:', response.data);
            
            return response.data;
        } catch (error) {
            console.error('Erro na verificação do token:', error);
            
            // Se o token é inválido, remover do localStorage
            if (error.response?.status === 401) {
                localStorage.removeItem('@igreja:token');
            }
            
            throw error;
        }
    },

    async changePassword(currentPassword, newPassword) {
        console.log('authService.changePassword chamado');
        
        try {
            const response = await api.post('/auth/change-password', {
                currentPassword,
                newPassword
            });

            return response.data;
        } catch (error) {
            console.error('Erro ao alterar senha:', error);
            throw error;
        }
    },

    async forgotPassword(email) {
        console.log('authService.forgotPassword chamado para:', email);
        
        try {
            const response = await api.post('/auth/forgot-password', {
                email
            });

            return response.data;
        } catch (error) {
            console.error('Erro ao solicitar recuperação de senha:', error);
            throw error;
        }
    },

    async refreshToken() {
        console.log('authService.refreshToken chamado');
        
        try {
            const response = await api.post('/auth/refresh');
            return response.data;
        } catch (error) {
            console.error('Erro ao renovar token:', error);
            throw error;
        }
    }
};