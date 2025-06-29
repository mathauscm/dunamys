// backend/src/controllers/CampusController.js - CORRIGIDO
const CampusService = require('../services/CampusService');
const logger = require('../utils/logger');

class CampusController {
    // Rota pública para listar campus (para formulário de registro)
    static async getPublicCampuses(req, res, next) {
        try {
            const campuses = await CampusService.getAllCampuses();
            
            res.json(campuses);
        } catch (error) {
            next(error);
        }
    }

    // Rotas administrativas - CORRIGIDA
    static async getCampuses(req, res, next) {
        try {
            const { search, active, page = 1, limit = 20 } = req.query;
            
            console.log('🔍 Buscando campus com filtros:', { search, active, page, limit });
            
            const result = await CampusService.getCampusesForAdmin({
                search,
                active: active !== undefined ? active === 'true' : undefined,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            
            console.log('📊 Resultado da busca:', {
                totalCampuses: result.campuses.length,
                pagination: result.pagination
            });
            
            // ADICIONADO: Log detalhado para debug
            result.campuses.forEach(campus => {
                console.log(`Campus: ${campus.name} - Membros: ${campus._count?.users || 0}`);
            });
            
            res.json(result);
        } catch (error) {
            console.error('❌ Erro ao buscar campus:', error);
            next(error);
        }
    }

    static async getCampusById(req, res, next) {
        try {
            const { id } = req.params;
            
            console.log('📋 Buscando campus por ID:', id);
            
            const campus = await CampusService.getCampusById(parseInt(id));
            
            res.json(campus);
        } catch (error) {
            next(error);
        }
    }

    static async createCampus(req, res, next) {
        try {
            const { name, city } = req.body;
            
            console.log('➕ Criando campus:', { name, city });
            
            const campus = await CampusService.createCampus({
                name,
                city
            });
            
            logger.info(`Campus criado ID: ${campus.id} por admin ID: ${req.user.id}`);
            
            res.status(201).json({
                message: 'Campus criado com sucesso',
                campus
            });
        } catch (error) {
            console.error('❌ Erro ao criar campus:', error);
            next(error);
        }
    }

    static async updateCampus(req, res, next) {
        try {
            const { id } = req.params;
            const { name, city, active } = req.body;
            
            console.log('✏️ Atualizando campus:', { id, name, city, active });
            
            const campus = await CampusService.updateCampus(parseInt(id), {
                name,
                city,
                active
            });
            
            logger.info(`Campus atualizado ID: ${id} por admin ID: ${req.user.id}`);
            
            res.json({
                message: 'Campus atualizado com sucesso',
                campus
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar campus:', error);
            next(error);
        }
    }

    static async deleteCampus(req, res, next) {
        try {
            const { id } = req.params;
            
            console.log('🗑️ Deletando campus:', id);
            
            const result = await CampusService.deleteCampus(parseInt(id));
            
            logger.info(`Campus removido ID: ${id} por admin ID: ${req.user.id}`);
            
            res.json(result);
        } catch (error) {
            console.error('❌ Erro ao deletar campus:', error);
            next(error);
        }
    }

    static async getCampusStats(req, res, next) {
        try {
            const { id } = req.params;
            
            console.log('📊 Buscando estatísticas do campus:', id);
            
            const stats = await CampusService.getCampusStats(parseInt(id));
            
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    static async transferUser(req, res, next) {
        try {
            const { userId, newCampusId } = req.body;
            
            console.log('🔄 Transferindo usuário:', { userId, newCampusId });
            
            const user = await CampusService.transferUserToCampus(
                parseInt(userId),
                parseInt(newCampusId)
            );
            
            logger.info(`Usuário ID: ${userId} transferido para campus ID: ${newCampusId} por admin ID: ${req.user.id}`);
            
            res.json({
                message: 'Usuário transferido com sucesso',
                user
            });
        } catch (error) {
            console.error('❌ Erro ao transferir usuário:', error);
            next(error);
        }
    }

    // NOVO: Endpoint para debug/refresh das estatísticas
    static async refreshStats(req, res, next) {
        try {
            console.log('🔄 Refreshing campus stats...');
            
            const campuses = await CampusService.refreshCampusStats();
            
            res.json({
                message: 'Estatísticas atualizadas',
                campuses: campuses.map(c => ({
                    id: c.id,
                    name: c.name,
                    userCount: c._count.users,
                    users: c.users.map(u => ({ id: u.id, name: u.name, status: u.status }))
                }))
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar estatísticas:', error);
            next(error);
        }
    }
}

module.exports = CampusController;