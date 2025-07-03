const Joi = require('joi');

const schemas = {
  // Validação de usuário - ATUALIZADA
  user: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    phone: Joi.string().pattern(/^\d{10,11}$/).required(), // Apenas números
    campusId: Joi.number().integer().positive().optional(),
  }),

  // Validação de login
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  // Validação de esqueceu senha
  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  // Validação de escala
  schedule: Joi.object({
    title: Joi.string().min(3).max(200).required(),
    description: Joi.string().max(500).optional(),
    date: Joi.date().iso().required(),
    time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    location: Joi.string().max(200).required(),
    memberIds: Joi.array().items(Joi.number().integer().positive()).required(),
    memberFunctions: Joi.object().pattern(
      Joi.number().integer().positive(),
      Joi.array().items(Joi.number().integer().positive())
    ).optional(),
  }),

  // Validação de indisponibilidade
  unavailability: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
    reason: Joi.string().max(200).optional(),
  }),

  // Validações de campus
  campus: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    city: Joi.string().max(100).optional().allow('', null),
  }),

  updateCampus: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    city: Joi.string().max(100).optional().allow('', null),
    active: Joi.boolean().optional(),
  }),

  transferUser: Joi.object({
    userId: Joi.number().integer().positive().required(),
    newCampusId: Joi.number().integer().positive().required(),
  }),
};

module.exports = schemas;