import { format, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Utilitários centralizados para formatação de data
 * Consolida todas as formatações de data do projeto
 */

/**
 * Formata uma data para exibição
 * @param {Date|string} date - Data para formatar
 * @param {string} pattern - Padrão de formatação (default: dd/MM/yyyy)
 * @returns {string} - Data formatada
 */
export const formatDate = (date, pattern = 'dd/MM/yyyy') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      console.warn('Data inválida fornecida para formatação:', date);
      return '';
    }
    
    return format(dateObj, pattern, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return '';
  }
};

/**
 * Formata uma data com hora para exibição
 * @param {Date|string} date - Data para formatar
 * @param {string} pattern - Padrão de formatação (default: dd/MM/yyyy 'às' HH:mm)
 * @returns {string} - Data e hora formatadas
 */
export const formatDateTime = (date, pattern = "dd/MM/yyyy 'às' HH:mm") => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      console.warn('Data inválida fornecida para formatação:', date);
      return '';
    }
    
    return format(dateObj, pattern, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data e hora:', error);
    return '';
  }
};

/**
 * Formata uma data de forma relativa (ex: "há 2 dias")
 * @param {Date|string} date - Data para formatar
 * @returns {string} - Data relativa formatada
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    const now = new Date();
    const diffInHours = (now - dateObj) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `Há ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (diffInHours < 24 * 7) {
      const days = Math.floor(diffInHours / 24);
      return `Há ${days} dia${days > 1 ? 's' : ''}`;
    } else {
      return formatDate(dateObj);
    }
  } catch (error) {
    console.error('Erro ao formatar data relativa:', error);
    return '';
  }
};

/**
 * Formata apenas a hora
 * @param {Date|string} date - Data para extrair a hora
 * @param {string} pattern - Padrão de formatação (default: HH:mm)
 * @returns {string} - Hora formatada
 */
export const formatTime = (date, pattern = 'HH:mm') => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, pattern, { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar hora:', error);
    return '';
  }
};

/**
 * Formata data para input type="date"
 * @param {Date|string} date - Data para formatar
 * @returns {string} - Data no formato YYYY-MM-DD
 */
export const formatDateForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, 'yyyy-MM-dd');
  } catch (error) {
    console.error('Erro ao formatar data para input:', error);
    return '';
  }
};

/**
 * Formata data para input type="datetime-local"
 * @param {Date|string} date - Data para formatar
 * @returns {string} - Data no formato YYYY-MM-DDTHH:mm
 */
export const formatDateTimeForInput = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return '';
    }
    
    return format(dateObj, "yyyy-MM-dd'T'HH:mm");
  } catch (error) {
    console.error('Erro ao formatar data e hora para input:', error);
    return '';
  }
};

/**
 * Formata data por extenso
 * @param {Date|string} date - Data para formatar
 * @returns {string} - Data por extenso (ex: "Terça-feira, 15 de março de 2023")
 */
export const formatDateLong = (date) => {
  return formatDate(date, "EEEE, dd 'de' MMMM 'de' yyyy");
};

/**
 * Formata apenas o mês e ano
 * @param {Date|string} date - Data para formatar
 * @returns {string} - Mês e ano (ex: "Março 2023")
 */
export const formatMonthYear = (date) => {
  return formatDate(date, 'MMMM yyyy');
};

/**
 * Verifica se uma data é hoje
 * @param {Date|string} date - Data para verificar
 * @returns {boolean} - True se a data é hoje
 */
export const isToday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Verifica se uma data é no futuro
 * @param {Date|string} date - Data para verificar
 * @returns {boolean} - True se a data é no futuro
 */
export const isFuture = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const now = new Date();
    
    return dateObj > now;
  } catch (error) {
    return false;
  }
};

/**
 * Obtém o início do dia para uma data
 * @param {Date|string} date - Data
 * @returns {Date} - Data com hora 00:00:00
 */
export const startOfDay = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const start = new Date(dateObj);
    start.setHours(0, 0, 0, 0);
    return start;
  } catch (error) {
    return null;
  }
};

/**
 * Obtém o fim do dia para uma data
 * @param {Date|string} date - Data
 * @returns {Date} - Data com hora 23:59:59
 */
export const endOfDay = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const end = new Date(dateObj);
    end.setHours(23, 59, 59, 999);
    return end;
  } catch (error) {
    return null;
  }
};