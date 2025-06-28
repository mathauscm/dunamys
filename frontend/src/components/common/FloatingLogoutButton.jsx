// frontend/src/components/common/FloatingLogoutButton.jsx
import React, { useState } from 'react';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const FloatingLogoutButton = ({ 
    position = 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    showOnMobile = true,
    showOnDesktop = false 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (window.confirm('Tem certeza que deseja sair do sistema?')) {
            logout();
            navigate('/login');
        }
    };

    // Determinar as classes de posição
    const getPositionClasses = () => {
        const base = 'fixed z-50';
        switch (position) {
            case 'bottom-right':
                return `${base} bottom-6 right-6`;
            case 'bottom-left':
                return `${base} bottom-6 left-6`;
            case 'top-right':
                return `${base} top-6 right-6`;
            case 'top-left':
                return `${base} top-6 left-6`;
            default:
                return `${base} bottom-6 right-6`;
        }
    };

    // Determinar quando mostrar o botão
    const getVisibilityClasses = () => {
        if (showOnMobile && showOnDesktop) {
            return 'block';
        } else if (showOnMobile && !showOnDesktop) {
            return 'block md:hidden';
        } else if (!showOnMobile && showOnDesktop) {
            return 'hidden md:block';
        } else {
            return 'hidden';
        }
    };

    return (
        <div className={`${getPositionClasses()} ${getVisibilityClasses()}`}>
            {/* Botão principal */}
            <div className="relative">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-14 h-14 bg-danger-600 hover:bg-danger-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
                >
                    {isExpanded ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <LogOut className="w-6 h-6" />
                    )}
                </button>

                {/* Menu expandido */}
                {isExpanded && (
                    <div className="absolute bottom-16 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-[200px] transform transition-all duration-200">
                        {/* Info do usuário */}
                        <div className="flex items-center mb-3 pb-3 border-b border-gray-200">
                            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900 truncate max-w-[120px]">
                                    {user?.name}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                                </p>
                            </div>
                        </div>

                        {/* Botão de logout */}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair do Sistema
                        </button>
                    </div>
                )}
            </div>

            {/* Overlay para fechar quando clicar fora */}
            {isExpanded && (
                <div
                    className="fixed inset-0 z-[-1]"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </div>
    );
};

export default FloatingLogoutButton;