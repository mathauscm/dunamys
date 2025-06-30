// frontend/src/services/ministries.js
import { api } from './api';

export const ministryService = {
    // Listar ministérios públicos (para formulários)
    async getPublicMinistries() {
        const response = await api.get('/ministries/public');
        return response.data;
    },

    // Admin: Listar todos os ministérios
    async getMinistries(params = {}) {
        const response = await api.get('/ministries', { params });
        return response.data;
    },

    // Admin: Obter ministério por ID
    async getMinistryById(id) {
        const response = await api.get(`/ministries/${id}`);
        return response.data;
    },

    // Admin: Criar novo ministério
    async createMinistry(data) {
        const response = await api.post('/ministries', data);
        return response.data;
    },

    // Admin: Atualizar ministério
    async updateMinistry(id, data) {
        const response = await api.put(`/ministries/${id}`, data);
        return response.data;
    },

    // Admin: Excluir ministério
    async deleteMinistry(id) {
        const response = await api.delete(`/ministries/${id}`);
        return response.data;
    },

    // Admin: Obter estatísticas do ministério
    async getMinistryStats(id) {
        const response = await api.get(`/ministries/${id}/stats`);
        return response.data;
    },

    // Admin: Transferir usuário para outro ministério
    async transferUser(userId, newMinistryId) {
        const response = await api.post('/ministries/transfer-user', {
            userId,
            newMinistryId
        });
        return response.data;
    },

    // Admin: Atualizar ministério de um usuário específico
    async updateUserMinistry(userId, ministryId) {
        const response = await api.put(`/ministries/user/${userId}/ministry`, {
            ministryId
        });
        return response.data;
    }
};