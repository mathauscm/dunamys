import { api } from './api';

export const authService = {
    async login(email, password) {
        const response = await api.post('/auth/login', {
            email,
            password
        });

        return response.data;
    },

    async register(userData) {
        const response = await api.post('/auth/register', userData);

        return response.data;
    },

    async verifyToken(token) {
        // Temporariamente usar o token no header
        const originalAuth = api.defaults.headers.Authorization;
        api.defaults.headers.Authorization = `Bearer ${token}`;

        try {
            const response = await api.get('/members/profile');
            return response.data;
        } finally {
            api.defaults.headers.Authorization = originalAuth;
        }
    },

    async changePassword(currentPassword, newPassword) {
        const response = await api.post('/auth/change-password', {
            currentPassword,
            newPassword
        });

        return response.data;
    },

    async forgotPassword(email) {
        const response = await api.post('/auth/forgot-password', {
            email
        });

        return response.data;
    },

    async refreshToken() {
        const response = await api.post('/auth/refresh');

        return response.data;
    }
};