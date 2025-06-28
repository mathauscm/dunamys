import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../context/NotificationContext';
import {
    User,
    LogOut,
    Settings,
    Bell,
    Menu,
    X,
    ChevronDown
} from 'lucide-react';

const Header = ({ title, onToggleSidebar }) => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, markAllAsRead } = useNotification();
    const navigate = useNavigate();

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    
    // Refs para detectar cliques fora dos menus
    const profileMenuRef = useRef(null);
    const notificationMenuRef = useRef(null);

    // FUNÇÃO DE LOGOUT CORRIGIDA
    const handleLogout = () => {
        console.log('Logout clicado!'); // Debug
        setShowProfileMenu(false);
        
        // Confirmar logout
        if (window.confirm('Tem certeza que deseja sair do sistema?')) {
            try {
                // Limpar tudo
                localStorage.removeItem('@igreja:token');
                
                // Chamar logout do contexto
                logout();
                
                // Redirecionar forçadamente
                setTimeout(() => {
                    window.location.href = '/login';
                }, 100);
                
                console.log('Logout realizado com sucesso');
            } catch (error) {
                console.error('Erro no logout:', error);
                // Fallback: forçar redirecionamento
                window.location.href = '/login';
            }
        }
    };

    const handleMarkAllAsRead = () => {
        markAllAsRead();
        setShowNotifications(false);
    };

    // Fechar menus ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
            if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <header className="bg-white shadow-sm border-b border-gray-200">
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
                        {/* Notifications */}
                        <div className="relative" ref={notificationMenuRef}>
                            <button
                                onClick={() => {
                                    setShowNotifications(!showNotifications);
                                    setShowProfileMenu(false); // Fechar menu de perfil
                                }}
                                className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <Bell className="w-5 h-5 text-gray-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-4 border-b border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-gray-900">Notificações</h3>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllAsRead}
                                                    className="text-sm text-primary-600 hover:text-primary-700"
                                                >
                                                    Marcar todas como lidas
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                Nenhuma notificação
                                            </div>
                                        ) : (
                                            notifications.slice(0, 10).map((notification) => (
                                                <div
                                                    key={notification.id}
                                                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {new Date(notification.timestamp).toLocaleString('pt-BR')}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Logout Button (Mobile) - CORRIGIDO */}
                        <button
                            onClick={handleLogout}
                            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-danger-600"
                            title="Sair"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>

                        {/* Profile Menu (Desktop) - CORRIGIDO */}
                        <div className="hidden md:block relative" ref={profileMenuRef}>
                            <button
                                onClick={() => {
                                    setShowProfileMenu(!showProfileMenu);
                                    setShowNotifications(false); // Fechar menu de notificações
                                }}
                                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.name?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-medium text-gray-900">{user?.name}</p>
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
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                navigate(`/${user?.role?.toLowerCase()}`);
                                            }}
                                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
                                        >
                                            <User className="w-4 h-4 mr-3" />
                                            Perfil
                                        </button>
                                        
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                alert('Configurações em desenvolvimento');
                                            }}
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

                        {/* Profile Menu (Mobile) - CORRIGIDO */}
                        <div className="md:hidden relative" ref={profileMenuRef}>
                            <button
                                onClick={() => {
                                    setShowProfileMenu(!showProfileMenu);
                                    setShowNotifications(false);
                                }}
                                className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center"
                            >
                                <span className="text-white text-sm font-medium">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                            </button>

                            {showProfileMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                    <div className="p-3 border-b border-gray-200">
                                        <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
                                        </p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                navigate(`/${user?.role?.toLowerCase()}`);
                                            }}
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

// import React, { useState, useRef, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../../hooks/useAuth';
// import {
//     User,
//     LogOut,
//     Settings,
//     Bell,
//     Menu,
//     X,
//     ChevronDown
// } from 'lucide-react';

// const Header = ({ title, onToggleSidebar }) => {
//     const { user, logout } = useAuth();
//     const navigate = useNavigate();

//     const [showProfileMenu, setShowProfileMenu] = useState(false);
    
//     // Ref para detectar cliques fora do menu
//     const profileMenuRef = useRef(null);

//     // FUNÇÃO DE LOGOUT SIMPLIFICADA E ROBUSTA
//     const handleLogout = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
        
//         console.log('🔴 Logout clicado!');
        
//         setShowProfileMenu(false);
        
//         try {
//             // Confirmar logout
//             if (window.confirm('Tem certeza que deseja sair do sistema?')) {
//                 console.log('🔴 Confirmado logout');
                
//                 // Limpar localStorage
//                 localStorage.removeItem('@igreja:token');
//                 console.log('🔴 Token removido');
                
//                 // Chamar função de logout
//                 if (logout) {
//                     logout();
//                     console.log('🔴 Logout context chamado');
//                 }
                
//                 // Redirecionar
//                 console.log('🔴 Redirecionando...');
//                 window.location.href = '/login';
//             }
//         } catch (error) {
//             console.error('🔴 Erro no logout:', error);
//             // Fallback: forçar logout
//             localStorage.clear();
//             window.location.href = '/login';
//         }
//     };

//     // FUNÇÃO PARA IR AO PERFIL
//     const handleProfile = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
        
//         console.log('👤 Perfil clicado!');
//         setShowProfileMenu(false);
        
//         try {
//             if (user?.role === 'ADMIN') {
//                 navigate('/admin');
//             } else {
//                 navigate('/member');
//             }
//         } catch (error) {
//             console.error('Erro ao navegar:', error);
//             window.location.href = user?.role === 'ADMIN' ? '/admin' : '/member';
//         }
//     };

//     // FUNÇÃO PARA CONFIGURAÇÕES
//     const handleSettings = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
        
//         console.log('⚙️ Configurações clicado!');
//         setShowProfileMenu(false);
        
//         alert('Configurações em desenvolvimento');
//     };

//     // Fechar menu ao clicar fora
//     useEffect(() => {
//         const handleClickOutside = (event) => {
//             if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
//                 setShowProfileMenu(false);
//             }
//         };

//         document.addEventListener('mousedown', handleClickOutside);
//         return () => {
//             document.removeEventListener('mousedown', handleClickOutside);
//         };
//     }, []);

//     return (
//         <header className="bg-white shadow-sm border-b border-gray-200">
//             <div className="px-6 py-4">
//                 <div className="flex items-center justify-between">
//                     {/* Left side */}
//                     <div className="flex items-center space-x-4">
//                         {onToggleSidebar && (
//                             <button
//                                 onClick={onToggleSidebar}
//                                 className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                             >
//                                 <Menu className="w-5 h-5" />
//                             </button>
//                         )}
//                         <div>
//                             <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
//                         </div>
//                     </div>

//                     {/* Right side */}
//                     <div className="flex items-center space-x-4">
//                         {/* Notificações - Simplificadas */}
//                         <div className="relative">
//                             <button
//                                 onClick={() => alert('Notificações em desenvolvimento')}
//                                 className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                                 title="Notificações"
//                             >
//                                 <Bell className="w-5 h-5 text-gray-600" />
//                             </button>
//                         </div>

//                         {/* Logout Button Mobile */}
//                         <button
//                             onClick={handleLogout}
//                             className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600 hover:text-danger-600"
//                             title="Sair"
//                         >
//                             <LogOut className="w-5 h-5" />
//                         </button>

//                         {/* Profile Menu Desktop */}
//                         <div className="hidden md:block relative" ref={profileMenuRef}>
//                             <button
//                                 onClick={(e) => {
//                                     e.preventDefault();
//                                     e.stopPropagation();
//                                     console.log('🔵 Menu perfil clicado');
//                                     setShowProfileMenu(!showProfileMenu);
//                                 }}
//                                 className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
//                             >
//                                 <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
//                                     <span className="text-white text-sm font-medium">
//                                         {user?.name?.charAt(0).toUpperCase() || 'U'}
//                                     </span>
//                                 </div>
//                                 <div className="text-left">
//                                     <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
//                                     <p className="text-xs text-gray-500 capitalize">
//                                         {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
//                                     </p>
//                                 </div>
//                                 <ChevronDown className="w-4 h-4 text-gray-500" />
//                             </button>

//                             {showProfileMenu && (
//                                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
//                                     <div className="py-1">
//                                         {/* Perfil */}
//                                         <button
//                                             onClick={handleProfile}
//                                             className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
//                                         >
//                                             <User className="w-4 h-4 mr-3" />
//                                             Perfil
//                                         </button>
                                        
//                                         {/* Configurações */}
//                                         <button
//                                             onClick={handleSettings}
//                                             className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
//                                         >
//                                             <Settings className="w-4 h-4 mr-3" />
//                                             Configurações
//                                         </button>
                                        
//                                         <hr className="my-1" />
                                        
//                                         {/* Sair */}
//                                         <button
//                                             onClick={handleLogout}
//                                             className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors text-left"
//                                         >
//                                             <LogOut className="w-4 h-4 mr-3" />
//                                             Sair
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>

//                         {/* Profile Menu Mobile */}
//                         <div className="md:hidden relative" ref={profileMenuRef}>
//                             <button
//                                 onClick={(e) => {
//                                     e.preventDefault();
//                                     e.stopPropagation();
//                                     setShowProfileMenu(!showProfileMenu);
//                                 }}
//                                 className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center"
//                             >
//                                 <span className="text-white text-sm font-medium">
//                                     {user?.name?.charAt(0).toUpperCase() || 'U'}
//                                 </span>
//                             </button>

//                             {showProfileMenu && (
//                                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
//                                     <div className="p-3 border-b border-gray-200">
//                                         <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuário'}</p>
//                                         <p className="text-xs text-gray-500">
//                                             {user?.role === 'ADMIN' ? 'Administrador' : 'Membro'}
//                                         </p>
//                                     </div>
//                                     <div className="py-1">
//                                         <button
//                                             onClick={handleProfile}
//                                             className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
//                                         >
//                                             <User className="w-4 h-4 mr-3" />
//                                             Perfil
//                                         </button>
//                                         <button
//                                             onClick={handleLogout}
//                                             className="flex items-center w-full px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 text-left"
//                                         >
//                                             <LogOut className="w-4 h-4 mr-3" />
//                                             Sair
//                                         </button>
//                                     </div>
//                                 </div>
//                             )}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </header>
//     );
// };

// export default Header;