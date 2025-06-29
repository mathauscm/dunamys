// frontend/src/utils/phoneFormatter.js - CORRIGIDO
import { useState } from 'react';

export const formatPhoneNumber = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limitedNumbers = numbers.slice(0, 11);
    
    // Aplica formatação baseada no tamanho
    if (limitedNumbers.length <= 2) {
        return limitedNumbers;
    } else if (limitedNumbers.length <= 6) {
        // (11) 9999
        return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`;
    } else if (limitedNumbers.length <= 10) {
        // (11) 9999-9999
        return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`;
    } else {
        // (11) 99999-9999
        return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`;
    }
};

export const cleanPhoneNumber = (formattedPhone) => {
    return formattedPhone.replace(/\D/g, '');
};

export const validatePhoneNumber = (phone) => {
    const numbers = cleanPhoneNumber(phone);
    
    // Deve ter 10 ou 11 dígitos
    if (numbers.length < 10 || numbers.length > 11) {
        return false;
    }
    
    // DDD deve ser válido (11-99)
    const ddd = parseInt(numbers.slice(0, 2));
    if (ddd < 11 || ddd > 99) {
        return false;
    }
    
    // Se tem 11 dígitos, o primeiro dígito do número deve ser 9 (celular)
    if (numbers.length === 11) {
        const firstDigit = numbers[2];
        if (firstDigit !== '9') {
            return false;
        }
    }
    
    return true;
};

// Hook personalizado para input de telefone - CORRIGIDO
export const usePhoneInput = (initialValue = '') => {
    const [value, setValue] = useState(formatPhoneNumber(initialValue));
    
    const handleChange = (inputValue) => {
        const formatted = formatPhoneNumber(inputValue);
        setValue(formatted);
        return formatted;
    };
    
    const getRawValue = () => {
        return cleanPhoneNumber(value);
    };
    
    const isValid = () => {
        return validatePhoneNumber(value);
    };
    
    return {
        value,
        onChange: handleChange,
        getRawValue,
        isValid
    };
};