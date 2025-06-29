// backend/src/controllers/CampusController.js
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

    // Rotas administrativas
    static async getCampuses(req, res, next) {
        try {
            const { search, active, page = 1, limit = 20 } = req.query;
            
            const result = await CampusService.getCampusesForAdmin({
                search,
                active: active !== undefined ? active === 'true' : undefined,
                page: parseInt(page),
                limit: parseInt(limit)
            });
            
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getCampusById(req, res, next) {
        try {
            const { id } = req.params;
            
            const campus = await CampusService.getCampusById(parseInt(id));
            
            res.json(campus);
        } catch (error) {
            next(error);
        }
    }

    static async createCampus(req, res, next) {
        try {
            const { name, city } = req.body;
            
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
            next(error);
        }
    }

    static async updateCampus(req, res, next) {
        try {
            const { id } = req.params;
            const { name, city, active } = req.body;
            
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
            next(error);
        }
    }

    static async deleteCampus(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await CampusService.deleteCampus(parseInt(id));
            
            logger.info(`Campus removido ID: ${id} por admin ID: ${req.user.id}`);
            
            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    static async getCampusStats(req, res, next) {
        try {
            const { id } = req.params;
            
            const stats = await CampusService.getCampusStats(parseInt(id));
            
            res.json(stats);
        } catch (error) {
            next(error);
        }
    }

    static async transferUser(req, res, next) {
        try {
            const { userId, newCampusId } = req.body;
            
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
            next(error);
        }
    }
}

module.exports = CampusController;