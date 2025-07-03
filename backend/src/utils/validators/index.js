/**
 * Barrel export para todos os validadores
 * Centraliza as importações de validadores
 */

const phoneValidator = require('./phoneValidator');
const emailValidator = require('./emailValidator');

module.exports = {
  // Phone validation
  ...phoneValidator,
  
  // Email validation
  ...emailValidator,
  
  // Grouped exports for cleaner imports
  phone: phoneValidator,
  email: emailValidator
};