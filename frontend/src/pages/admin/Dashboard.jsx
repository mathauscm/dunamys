import React from 'react';
import { Users, Calendar, Clock, CheckCircle, AlertTriangle, UserCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Loading from '../../components/common/Loading';

const AdminDashboard = () => {
    const { data: dashboardData, loading } = useApi('/admin/dashboard');

    if (loading) {
        return <Loading fullScreen />;
    }

    const stats = dashboardData || {};

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
                <p className="text-gray-600">Visão geral do sistema de membros</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats.totalMembers || 0}
                                </div>
                                <div className="text-sm text-gray-600">Total de Membros</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <UserCheck className="h-8 w-8 text-success-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats.activeMembers || 0}
                                </div>
                                <div className="text-sm text-gray-600">Membros Ativos</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <AlertTriangle className="h-8 w-8 text-warning-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats.pendingMembers || 0}
                                </div>
                                <div className="text-sm text-gray-600">Aguardando Aprovação</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-8 w-8 text-primary-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {stats.upcomingSchedules || 0}
                                </div>
                                <div className="text-sm text-gray-600">Próximas Escalas</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                    <div className="card-header">
                        <h2 className="text-lg font-medium text-gray-900">Ações Rápidas</h2>
                    </div>
                    <div className="card-body space-y-4">
                        <a
                            href="/admin/members"
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                <Users className="h-8 w-8 text-primary-600 mr-3" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Gerenciar Membros</h3>
                                    <p className="text-sm text-gray-600">Aprovar, rejeitar e editar membros</p>
                                </div>
                            </div>
                            {stats.pendingMembers > 0 && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800">
                                    {stats.pendingMembers} pendente{stats.pendingMembers !== 1 ? 's' : ''}
                                </span>
                            )}
                        </a>

                        <a
                            href="/admin/schedules"
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                <Calendar className="h-8 w-8 text-success-600 mr-3" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Criar Escala</h3>
                                    <p className="text-sm text-gray-600">Organizar escalas de serviço</p>
                                </div>
                            </div>
                        </a>

                        <a
                            href="/admin/logs"
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex items-center">
                                <Clock className="h-8 w-8 text-gray-600 mr-3" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Ver Logs</h3>
                                    <p className="text-sm text-gray-600">Histórico de ações do sistema</p>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="text-lg font-medium text-gray-900">Resumo do Sistema</h2>
                    </div>
                    <div className="card-body">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total de Escalas</span>
                                <span className="font-medium">{stats.totalSchedules || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Escalas Próximas</span>
                                <span className="font-medium">{stats.upcomingSchedules || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Taxa de Aprovação</span>
                                <span className="font-medium">
                                    {stats.totalMembers > 0
                                        ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
                                        : 0
                                    }%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-medium text-gray-900">Atividade Recente</h2>
                </div>
                <div className="card-body">
                    <div className="text-center py-8 text-gray-500">
                        <Clock className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-2">Implementar feed de atividades recentes</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
