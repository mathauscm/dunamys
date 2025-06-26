import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
    Calendar,
    Clock,
    User,
    Home,
    Menu,
    X
} from 'lucide-react';
import Header from '../common/Header';

const MemberLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/member', icon: Home, exact: true },
        { name: 'Minhas Escalas', href: '/member/schedules', icon: Calendar },
        { name: 'Disponibilidade', href: '/member/availability', icon: Clock },
    ];

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                    <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <h1 className="ml-3 text-lg font-semibold text-gray-900">
                            Área de Membros
                        </h1>
                    </div>
                    <button
                        onClick={toggleSidebar}
                        className="lg:hidden p-1 rounded-md hover:bg-gray-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="mt-6 px-3">
                    <div className="space-y-1">
                        {navigation.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.href}
                                end={item.exact}
                                className={({ isActive }) => `
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
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
                    title="Área de Membros"
                    onToggleSidebar={toggleSidebar}
                />

                <main className="flex-1 overflow-y-auto">
                    <div className="py-6 px-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MemberLayout;
