// frontend/src/components/layout/AdminLayout.jsx - ATUALIZADO

import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    Settings,
    Users,
    Calendar,
    FileText,
    Home,
    Menu,
    X,
    MapPin,
    Heart,
    Briefcase,  // NOVO ÍCONE PARA FUNÇÕES
    MessageSquare  // NOVO ÍCONE PARA WHATSAPP
} from 'lucide-react';
import Header from '../common/Header';
import { useAuth, usePermission } from '../../hooks/useAuth';

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();

    // Verificar permissões
    const canManageMembers = usePermission('MANAGE_MEMBERS');
    const canManageFunctions = usePermission('MANAGE_FUNCTIONS');
    const canManageCampus = usePermission('MANAGE_CAMPUS');
    const canManageMinistries = usePermission('MANAGE_MINISTRIES');
    const canViewLogs = usePermission('VIEW_LOGS');
    
    // Verificar se é admin master
    const isMasterAdmin = user?.email === 'admin@igreja.com' || user?.email === import.meta.env.VITE_MASTER_ADMIN_EMAIL;

    const allNavigation = [
        { name: 'Dashboard', href: '/admin', icon: Home, exact: true, permission: 'VIEW_DASHBOARD' },
        { name: 'Membros', href: '/admin/members', icon: Users, permission: 'MANAGE_MEMBERS' },
        { name: 'Escalas', href: '/admin/schedules', icon: Calendar, permission: 'MANAGE_SCHEDULES' },
        { name: 'Campus', href: '/admin/campus', icon: MapPin, permission: 'MANAGE_CAMPUS' },
        { name: 'Ministérios', href: '/admin/ministries', icon: Heart, permission: 'MANAGE_MINISTRIES' },
        { name: 'Funções', href: '/admin/functions', icon: Briefcase, permission: 'MANAGE_FUNCTIONS' },
        { name: 'Logs', href: '/admin/logs', icon: FileText, permission: 'VIEW_LOGS' },
        { name: 'Conexão WhatsApp', href: '/admin/whatsapp', icon: MessageSquare, permission: 'MASTER_ADMIN' },
    ];

    // Filtrar navegação baseada nas permissões
    const navigation = allNavigation.filter(item => {
        if (item.permission === 'MASTER_ADMIN') {
            return isMasterAdmin;
        }
        return usePermission(item.permission);
    });

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
                w-full max-w-sm sm:w-64
                lg:translate-x-0 lg:static lg:inset-0 lg:w-64
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex items-center justify-between h-16 px-4 sm:px-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <Settings className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="ml-3 text-base sm:text-lg font-semibold text-gray-900">
                            Administração
                        </h1>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-2 rounded-md hover:bg-gray-100 touch-target"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-4 px-3 flex-1 sm:mt-6">
                    <div className="space-y-1">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                end={item.exact}
                                className={({ isActive }) => `
                  group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px]
                  ${isActive
                                        ? 'bg-primary-100 text-primary-700 border-r-2 border-primary-600'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }
                `}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.name}
                            </NavLink>
                        ))}
                    </div>
                </nav>

            </div>

            {/* Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={toggleSidebar}
                />
            )}

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header
                    title="Painel Administrativo"
                    onToggleSidebar={toggleSidebar}
                />

                <main className="flex-1 overflow-y-auto scroll-container">
                    <div className="py-4 px-4 sm:py-6 sm:px-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;