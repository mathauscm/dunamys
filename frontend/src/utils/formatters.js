import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const formatDate = (date, formatString = 'dd/MM/yyyy') => {
    if (!date) return '';
    return format(new Date(date), formatString, { locale: ptBR });
};

export const formatDateTime = (date) => {
    if (!date) return '';
    return format(new Date(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
};

export const formatTime = (time) => {
    if (!time) return '';
    return time.slice(0, 5); // Remove seconds if present
};

export const formatPhone = (phone) => {
    if (!phone) return '';

    const cleaned = phone.replace(/\D/g, '');

    if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    return phone;
};

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