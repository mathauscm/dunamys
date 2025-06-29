// frontend/src/services/campus.js
import { api } from './api';

export const campusService = {
    // Listar campus públicos (para registro)
    async getPublicCampuses() {
        const response = await api.get('/campus/public');
        return response.data;
    },

    // Admin: Listar todos os campus
    async getCampuses(params = {}) {
        const response = await api.get('/campus', { params });
        return response.data;
    },

    // Admin: Obter campus por ID
    async getCampusById(id) {
        const response = await api.get(`/campus/${id}`);
        return response.data;
    },

    // Admin: Criar novo campus
    async createCampus(data) {
        const response = await api.post('/campus', data);
        return response.data;
    },

    // Admin: Atualizar campus
    async updateCampus(id, data) {
        const response = await api.put(`/campus/${id}`, data);
        return response.data;
    },

    // Admin: Excluir campus
    async deleteCampus(id) {
        const response = await api.delete(`/campus/${id}`);
        return response.data;
    },

    // Admin: Obter estatísticas do campus
    async getCampusStats(id) {
        const response = await api.get(`/campus/${id}/stats`);
        return response.data;
    },

    // Admin: Transferir usuário para outro campus
    async transferUser(userId, newCampusId) {
        const response = await api.post('/campus/transfer-user', {
            userId,
            newCampusId
        });
        return response.data;
    }
};