import api from './api';

const whatsappService = {
  /**
   * Inicializa o WhatsApp Service
   * @returns {Promise<Object>} Resultado da inicialização
   */
  initialize: async () => {
    try {
      const response = await api.post('/whatsapp/initialize');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtém o QR Code para conexão do WhatsApp
   * @returns {Promise<Object>} Dados do QR Code e status
   */
  getQRCode: async () => {
    try {
      const response = await api.get('/whatsapp/qr');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Obtém o status da conexão do WhatsApp
   * @returns {Promise<Object>} Status da conexão
   */
  getStatus: async () => {
    try {
      const response = await api.get('/whatsapp/status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Desconecta o WhatsApp Web
   * @returns {Promise<Object>} Resultado da operação
   */
  disconnect: async () => {
    try {
      const response = await api.post('/whatsapp/disconnect');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * Reconecta o WhatsApp Web
   * @returns {Promise<Object>} Resultado da operação
   */
  reconnect: async () => {
    try {
      const response = await api.post('/whatsapp/reconnect');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default whatsappService;