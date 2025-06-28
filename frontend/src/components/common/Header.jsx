import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
    User,
    LogOut,
    Settings,
    Bell,
    Menu,
    ChevronDown
} from 'lucide-react';

// Modal de confirmação customizado
const ConfirmModal = ({ show, onConfirm, onCancel }) => {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
            <div className="bg-white rounded-lg shadow-lg p-6 w-80 animate-fade-in">
                <h2 className="text-lg font-semibold mb-4">Confirmação</h2>
                <p className="mb-6">Tem certeza que deseja sair do sistema?</p>
                <div className="flex justify-end space-x-2">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 hover:bg-gray-300"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </div>
    );
};

const Header = ({ title, onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const profileMenuRefDesktop = useRef(null);
    const profileMenuRefMobile = useRef(null);

    // FUNÇÃO DE LOGOUT
    const handleLogout = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        // Abre o modal de confirmação
        setShowLogoutModal(true);
    };

    // Confirmação final do logout
    const confirmLogout = () => {
        setShowProfileMenu(false);
        setShowLogoutModal(false);
        try {
            localStorage.removeItem('@igreja:token');
            if (logout) logout();
            window.location.href = '/login';
        } catch (error) {
            localStorage.clear();
            window.location.href = '/login';
        }
    };

    // Cancela o logout
    const cancelLogout = () => {
        setShowLogoutModal(false);
    };

    // FUNÇÃO PARA IR AO PERFIL
    const handleProfile = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowProfileMenu(false);
        try {
            if (user?.role === 'ADMIN') {
                navigate('/admin');
            } else {
                navigate('/member');
            }
        } catch (error) {
            window.location.href = user?.role === 'ADMIN' ? '/admin' : '/member';
        }
    };

    // FUNÇÃO PARA CONFIGURAÇÕES
    const handleSettings = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        setShowProfileMenu(false);
        alert('Configurações em desenvolvimento');
    };

    // Fechar menu ao clicar fora (para ambos os refs)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                (profileMenuRefDesktop.current && !profileMenuRefDesktop.current.contains(event.target)) &&
                (profileMenuRefMobile.current && !profileMenuRefMobile.current.contains(event.target))
            ) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
            <ConfirmModal
                show={showLogoutModal}
                onConfirm={confirmLogout}
                onCancel={cancelLogout}
            />
            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Left side */}
                    <div className="flex items-center space-x-4">
                        {onToggleSidebar && (
                            <button
                                onClick={onToggleSidebar}
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                        </div>
                    </div>

                    {/* Right side */}
                    <div className="flex items-center space-x-4">
                        {/* Notificações */}
                        <div className="relative">
                            <button
                                onClick={() => alert('Notificações em desenvolvimento')}
                                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                title="Notificações"
                            >
                                <Bell className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Logout Button Mobile */}
                        <button
                            onClick={handleLogout}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-danger-600"
                            title="Sair"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>

                        {/* Profile Menu Desktop */}
                        <div className="hidden md:block relative" ref={profileMenuRefDesktop}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowProfileMenu((v) => !v);
                                }}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                                    <p className="text-xs text-gray-500 capitalize">
                                        {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                                    </p>
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="py-1">
                                        <button
                                            onClick={handleProfile}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <User className="w-4 h-4 mr-3" />
                                            Perfil
                                        </button>
                                        <button
                                            onClick={handleSettings}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <Settings className="w-4 h-4 mr-3" />
                                            Configurações
                                        </button>
                                        <hr className="my-1" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors text-left"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Profile Menu Mobile */}
                        <div className="md:hidden relative" ref={profileMenuRefMobile}>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowProfileMenu((v) => !v);
                                }}
                                className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center"
                            >
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                            </button>
                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-3 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
                                        <p className="text-xs text-gray-500">
                                            {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={handleProfile}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                                        >
                                            <User className="w-4 h-4 mr-3" />
                                            Perfil
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 text-left"
                                        >
                                            <LogOut className="w-4 h-4 mr-3" />
                                            Sair
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;