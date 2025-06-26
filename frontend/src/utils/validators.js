
export const validators = {
    required: (value) => {
        if (!value || (typeof value === 'string' && !value.trim())) {
            return 'Este campo é obrigatório';
        }
        return true;
    },

    email: (value) => {
        if (!value) return true; // Let required validator handle empty values

        const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
        if (!emailRegex.test(value)) {
            return 'Email inválido';
        }
        return true;
    },

    phone: (value) => {
        if (!value) return true;

        const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        if (!phoneRegex.test(value)) {
            return 'Formato: (11) 99999-9999';
        }
        return true;
    },

    minLength: (min) => (value) => {
        if (!value) return true;

        if (value.length < min) {
            return `Deve ter pelo menos ${min} caracteres`;
        }
        return true;
    },

    maxLength: (max) => (value) => {
        if (!value) return true;

        if (value.length > max) {
            return `Deve ter no máximo ${max} caracteres`;
        }
        return true;
    },

    password: (value) => {
        if (!value) return true;

        if (value.length < 6) {
            return 'Senha deve ter pelo menos 6 caracteres';
        }
        return true;
    },

    confirmPassword: (originalPassword) => (value) => {
        if (!value) return 'Confirmação de senha é obrigatória';

        if (value !== originalPassword) {
            return 'Senhas não coincidem';
        }
        return true;
    },

    date: (value) => {
        if (!value) return true;

        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return 'Data inválida';
        }
        return true;
    },

    futureDate: (value) => {
        if (!value) return true;

        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (date < today) {
            return 'Data deve ser futura';
        }
        return true;
    }
};
