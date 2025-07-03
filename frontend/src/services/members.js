import { api } from './api';

export const memberService = {
    async getProfile() {
        const response = await api.get('/members/profile');
        return response.data;
    },

    async updateProfile(data) {
        const response = await api.put('/members/profile', data);
        return response.data;
    },

    async getSchedules(params = {}) {
        const response = await api.get('/members/schedules', { params });
        return response.data;
    },

    async setUnavailability(data) {
        const response = await api.post('/members/unavailability', data);
        return response.data;
    },

    async getUnavailabilities() {
        const response = await api.get('/members/unavailability');
        return response.data;
    },

    async removeUnavailability(id) {
        const response = await api.delete(`/members/unavailability/${id}`);
        return response.data;
    }
};

export const scheduleService = {
    async getSchedules(params = {}) {
        const response = await api.get('/schedules', { params });
        return response.data;
    },

    async getScheduleById(id) {
        const response = await api.get(`/schedules/${id}`);
        return response.data;
    }
};

export const adminService = {
    async getDashboard() {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    async getMembers(params = {}) {
        const response = await api.get('/admin/members', { params });
        return response.data;
    },

    async approveMember(id) {
        const response = await api.post(`/admin/members/${id}/approve`);
        return response.data;
    },

    async rejectMember(id, reason) {
        const response = await api.post(`/admin/members/${id}/reject`, { reason });
        return response.data;
    },

    // ✅ NOVO MÉTODO: Excluir membro
    async deleteMember(id) {
        const response = await api.delete(`/admin/members/${id}`);
        return response.data;
    },

    async createSchedule(data) {
        const response = await api.post('/admin/schedules', data);
        return response.data;
    },

    async updateSchedule(id, data) {
        const response = await api.put(`/admin/schedules/${id}`, data);
        return response.data;
    },

    async deleteSchedule(id) {
        const response = await api.delete(`/admin/schedules/${id}`);
        return response.data;
    },

    async sendNotification(scheduleId, type, message) {
        const response = await api.post(`/admin/schedules/${scheduleId}/notify`, {
            type,
            message
        });
        return response.data;
    },

    async getLogs(params = {}) {
        const response = await api.get('/admin/logs', { params });
        return response.data;
    },

    async getAvailableMembers(date, filters = {}) {
        const params = { date, ...filters };
        const response = await api.get('/admin/members/available', { params });
        return response.data;
    },

    async getMemberUnavailabilities(date) {
        const response = await api.get('/admin/members/unavailabilities', { params: { date } });
        return response.data;
    }
};