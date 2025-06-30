const MinistryService = require('../services/MinistryService');
const logger = require('../utils/logger');

class MinistryController {
    // Rota pública para listar ministérios (para formulários)
    static async getPublicMinistries(req, res, next) {
        try {
            const ministries = await MinistryService.getAllMinistries();
            
            res.json(ministries);
        } catch (error) {
            next(error);
        }
    }

    // Rotas administrativas
    static async getMinistries(req, res, next) {
        try {
            const { search, active, page = 1, limit = 20 } = req.query;
            
            console.log('🔍 Buscando ministérios com filtros:', { search, active, page, limit });
            
            const result = await MinistryService.getMinistriesForAdmin({
                search,
                active: active !== undefined ? active === 'true' : undefined,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            
            console.log('📊 Resultado da busca de ministérios:', {
                totalMinistries: result.ministries.length,
                pagination: result.pagination
            });
            
            result.ministries.forEach(ministry => {
                console.log(`Ministério: ${ministry.name} - Membros: ${ministry._count?.users || 0}`);
            });
            
            res.json(result);
        } catch (error) {
            console.error('❌ Erro ao buscar ministérios:', error);
            next(error);
        }
    }

    static async getMinistryById(req, res, next) {
        try {
            const { id } = req.params;
            
            console.log('📋 Buscando ministério por ID:', id);
            
            const ministry = await MinistryService.getMinistryById(parseInt(id));
            
            res.json(ministry);
        } catch (error) {
            next(error);
        }
    }

    static async createMinistry(req, res, next) {
        try {
            const { name, description } = req.body;
            
            console.log('➕ Criando ministério:', { name, description });
            
            const ministry = await MinistryService.createMinistry({
                name,
                description
            });
            
            logger.info(`Ministério criado ID: ${ministry.id} por admin ID: ${req.user.id}`);
            
            res.status(201).json({
                message: 'Ministério criado com sucesso',
                ministry
            });
        } catch (error) {
            console.error('❌ Erro ao criar ministério:', error);
            next(error);
        }
    }

    static async updateMinistry(req, res, next) {
        try {
            const { id } = req.params;
            const { name, description, active } = req.body;
            
            console.log('✏️ Atualizando ministério:', { id, name, description, active });
            
            const ministry = await MinistryService.updateMinistry(parseInt(id), {
                name,
                description,
                active
            });
            
            logger.info(`Ministério atualizado ID: ${id} por admin ID: ${req.user.id}`);
            
            res.json({
                message: 'Ministério atualizado com sucesso',
                ministry
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar ministério:', error);
            next(error);
        }
    }

    static async deleteMinistry(req, res, next) {
        try {
            const { id } = req.params;
            
            console.log('🗑️ Deletando ministério:', id);
            
            const result = await MinistryService.deleteMinistry(parseInt(id));
            
            logger.info(`Ministério removido ID: ${id} por admin ID: ${req.user.id}`);
            
            res.json(result);
        } catch (error) {
            console.error('❌ Erro ao deletar ministério:', error);
            next(error);
        }
    }

    static async getMinistryStats(req, res, next) {
        try {
            const { id } = req.params;
            
            console.log('📊 Buscando estatísticas do ministério:', id);
            
            const stats = await MinistryService.getMinistryStats(parseInt(id));
            
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    static async transferUser(req, res, next) {
        try {
            const { userId, newMinistryId } = req.body;
            
            console.log('🔄 Transferindo usuário para ministério:', { userId, newMinistryId });
            
            const user = await MinistryService.transferUserToMinistry(
                parseInt(userId),
                newMinistryId ? parseInt(newMinistryId) : null
            );
            
            logger.info(`Usuário ID: ${userId} transferido para ministério ID: ${newMinistryId || 'null'} por admin ID: ${req.user.id}`);
            
            res.json({
                message: 'Usuário transferido com sucesso',
                user
            });
        } catch (error) {
            console.error('❌ Erro ao transferir usuário:', error);
            next(error);
        }
    }

    // Endpoint específico para atualizar ministério de um usuário
    static async updateUserMinistry(req, res, next) {
        try {
            const { userId } = req.params;
            const { ministryId } = req.body;
            
            console.log('🔄 Atualizando ministério do usuário:', { userId, ministryId });
            
            const user = await MinistryService.updateUserMinistry(
                parseInt(userId),
                ministryId ? parseInt(ministryId) : null
            );
            
            logger.info(`Ministério do usuário ID: ${userId} atualizado para ministério ID: ${ministryId || 'null'} por admin ID: ${req.user.id}`);
            
            res.json({
                message: 'Ministério do usuário atualizado com sucesso',
                user
            });
        } catch (error) {
            console.error('❌ Erro ao atualizar ministério do usuário:', error);
            next(error);
        }
    }
}

module.exports = MinistryController;