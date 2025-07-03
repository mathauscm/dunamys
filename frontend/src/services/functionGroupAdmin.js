import { api } from './api';

export const functionGroupAdminService = {
    async assignUser(userId, functionGroupId) {
        console.log('functionGroupAdminService.assignUser chamado:', { userId, functionGroupId });
        
        try {
            const response = await api.post('/function-group-admins', {
                userId,
                functionGroupId
            });

            console.log('Usuário designado como admin de grupo:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao designar usuário como admin de grupo:', error);
            throw error;
        }
    },

    async removeUser(userId, functionGroupId) {
        console.log('functionGroupAdminService.removeUser chamado:', { userId, functionGroupId });
        
        try {
            const response = await api.delete(`/function-group-admins/${userId}/${functionGroupId}`);

            console.log('Usuário removido como admin de grupo:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao remover usuário como admin de grupo:', error);
            throw error;
        }
    },

    async getUserGroups(userId) {
        console.log('functionGroupAdminService.getUserGroups chamado para userId:', userId);
        
        try {
            const response = await api.get(`/function-group-admins/user/${userId}/groups`);

            console.log('Grupos do usuário:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar grupos do usuário:', error);
            throw error;
        }
    },

    async getMyGroups() {
        console.log('functionGroupAdminService.getMyGroups chamado');
        
        try {
            const response = await api.get('/function-group-admins/my-groups');

            console.log('Meus grupos:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar meus grupos:', error);
            throw error;
        }
    },

    async getGroupAdmins(functionGroupId) {
        console.log('functionGroupAdminService.getGroupAdmins chamado para groupId:', functionGroupId);
        
        try {
            const response = await api.get(`/function-group-admins/group/${functionGroupId}/admins`);

            console.log('Admins do grupo:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar admins do grupo:', error);
            throw error;
        }
    },

    async getAllGroupAdmins() {
        console.log('functionGroupAdminService.getAllGroupAdmins chamado');
        
        try {
            const response = await api.get('/function-group-admins');

            console.log('Todos os admins de grupo:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar todos os admins de grupo:', error);
            throw error;
        }
    },

    async getMyFunctions() {
        console.log('functionGroupAdminService.getMyFunctions chamado');
        
        try {
            const response = await api.get('/function-group-admins/my-functions');

            console.log('Minhas funções disponíveis:', response.data);
            return response.data;
        } catch (error) {
            console.error('Erro ao buscar minhas funções:', error);
            throw error;
        }
    }
};