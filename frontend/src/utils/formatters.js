/**
 * @deprecated Este arquivo será removido. Use os utilitários específicos:
 * - Para formatação de data: import from './formatters/dateFormatter'
 * - Para formatação de telefone: import from './validators/phoneValidator'
 */

// Re-exports para compatibilidade temporária
export { formatDate, formatDateTime, formatTime } from './formatters/dateFormatter';
export { formatPhone } from './validators/phoneValidator';

export const formatCurrency = (value) => {
    if (typeof value !== 'number') return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

export const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};