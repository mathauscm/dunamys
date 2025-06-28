import React from 'react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const LogoutButton = ({ 
    variant = 'button', // 'button', 'icon', 'text'
    size = 'md', // 'sm', 'md', 'lg'
    showConfirm = true,
    className = '',
    children = null
}) => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (showConfirm) {
            if (window.confirm('Tem certeza que deseja sair do sistema?')) {
                logout();
                navigate('/login');
            }
        } else {
            logout();
            navigate('/login');
        }
    };

    // Tamanhos dos ícones
    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6'
    };

    // Variante botão completo
    if (variant === 'button') {
        const buttonSizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg'
        };

        return (
            <button
                onClick={handleLogout}
                className={`
                    btn btn-danger flex items-center justify-center
                    ${buttonSizes[size]}
                    ${className}
                `}
            >
                <LogOut className={`${iconSizes[size]} mr-2`} />
                {children || 'Sair'}
            </button>
        );
    }

    // Variante apenas ícone
    if (variant === 'icon') {
        const iconButtonSizes = {
            sm: 'p-1.5',
            md: 'p-2',
            lg: 'p-3'
        };

        return (
            <button
                onClick={handleLogout}
                className={`
                    rounded-lg hover:bg-gray-100 transition-colors
                    text-gray-600 hover:text-danger-600
                    ${iconButtonSizes[size]}
                    ${className}
                `}
                title="Sair do sistema"
            >
                <LogOut className={iconSizes[size]} />
            </button>
        );
    }

    // Variante apenas texto
    if (variant === 'text') {
        return (
            <button
                onClick={handleLogout}
                className={`
                    text-danger-600 hover:text-danger-700 
                    hover:underline transition-colors
                    ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}
                    ${className}
                `}
            >
                {children || 'Sair'}
            </button>
        );
    }

    return null;
};

export default LogoutButton;