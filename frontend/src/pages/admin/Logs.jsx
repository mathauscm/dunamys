import React, { useState } from 'react';
import {
    FileText,
    Search,
    Filter,
    Calendar,
    User,
    Clock,
    ChevronLeft,
    ChevronRight,
    Download,
    RefreshCw,
    Eye,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info
} from 'lucide-react';
import { useApi, useMutation } from '../../hooks/useApi';
import { adminService } from '../../services/members';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminLogs = () => {
    const [search, setSearch] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [userFilter, setUserFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const limit = 20;

    const { data: logsData, loading, refresh } = useApi('/admin/logs', {
        immediate: true,
        dependencies: [search, actionFilter, userFilter, dateFilter, page]
    });

    const handleSearch = (value) => {
        setSearch(value);
        setPage(1);
    };

    const handleFilterChange = (filter, value) => {
        switch (filter) {
            case 'action':
                setActionFilter(value);
                break;
            case 'user':
                setUserFilter(value);
                break;
            case 'date':
                setDateFilter(value);
                break;
        }
        setPage(1);
    };

    const handleViewDetails = (log) => {
        setSelectedLog(log);
        setShowDetailsModal(true);
    };

    const handleExport = () => {
        // Implementar exportação de logs
        alert('Funcionalidade de exportação em desenvolvimento');
    };

    const getActionIcon = (action) => {
        const icons = {
            'MEMBER_APPROVED': <CheckCircle className="h-5 w-5 text-success-500" />,
            'MEMBER_REJECTED': <XCircle className="h-5 w-5 text-danger-500" />,
            'SCHEDULE_CREATED': <Calendar className="h-5 w-5 text-primary-500" />,
            'SCHEDULE_UPDATED': <FileText className="h-5 w-5 text-warning-500" />,
            'SCHEDULE_DELETED': <XCircle className="h-5 w-5 text-danger-500" />,
            'USER_LOGIN': <User className="h-5 w-5 text-info-500" />,
            'USER_LOGOUT': <User className="h-5 w-5 text-gray-500" />,
            'NOTIFICATION_SENT': <Info className="h-5 w-5 text-blue-500" />
        };

        return icons[action] || <AlertTriangle className="h-5 w-5 text-gray-500" />;
    };

    const getActionLabel = (action) => {
        const labels = {
            'MEMBER_APPROVED': 'Membro Aprovado',
            'MEMBER_REJECTED': 'Membro Rejeitado',
            'MEMBER_CREATED': 'Membro Cadastrado',
            'SCHEDULE_CREATED': 'Escala Criada',
            'SCHEDULE_UPDATED': 'Escala Atualizada',
            'SCHEDULE_DELETED': 'Escala Removida',
            'USER_LOGIN': 'Login Realizado',
            'USER_LOGOUT': 'Logout Realizado',
            'NOTIFICATION_SENT': 'Notificação Enviada',
            'PASSWORD_CHANGED': 'Senha Alterada',
            'PROFILE_UPDATED': 'Perfil Atualizado'
        };

        return labels[action] || action;
    };

    const getActionBadge = (action) => {
        const badges = {
            'MEMBER_APPROVED': 'badge badge-success',
            'MEMBER_REJECTED': 'badge badge-danger',
            'MEMBER_CREATED': 'badge badge-primary',
            'SCHEDULE_CREATED': 'badge badge-success',
            'SCHEDULE_UPDATED': 'badge badge-warning',
            'SCHEDULE_DELETED': 'badge badge-danger',
            'USER_LOGIN': 'badge badge-primary',
            'USER_LOGOUT': 'badge badge-gray',
            'NOTIFICATION_SENT': 'badge badge-primary',
            'PASSWORD_CHANGED': 'badge badge-warning',
            'PROFILE_UPDATED': 'badge badge-primary'
        };

        return badges[action] || 'badge badge-gray';
    };

    if (loading && page === 1) {
        return <Loading fullScreen />;
    }

    const logs = logsData?.logs || [];
    const pagination = logsData?.pagination || {};

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Logs de Auditoria</h1>
                    <p className="text-gray-600">Histórico completo de ações no sistema</p>
                </div>

                <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                    <button
                        onClick={handleExport}
                        className="btn btn-secondary flex items-center"
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                    </button>
                    <button
                        onClick={refresh}
                        className="btn btn-primary flex items-center"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                className="input pl-10"
                                placeholder="Buscar logs..."
                                value={search}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>

                        {/* Action Filter */}
                        <select
                            className="input"
                            value={actionFilter}
                            onChange={(e) => handleFilterChange('action', e.target.value)}
                        >
                            <option value="">Todas as ações</option>
                            <option value="MEMBER_APPROVED">Membro Aprovado</option>
                            <option value="MEMBER_REJECTED">Membro Rejeitado</option>
                            <option value="SCHEDULE_CREATED">Escala Criada</option>
                            <option value="SCHEDULE_UPDATED">Escala Atualizada</option>
                            <option value="SCHEDULE_DELETED">Escala Removida</option>
                            <option value="USER_LOGIN">Login</option>
                            <option value="NOTIFICATION_SENT">Notificação Enviada</option>
                        </select>

                        {/* User Filter */}
                        <input
                            type="text"
                            className="input"
                            placeholder="Filtrar por usuário..."
                            value={userFilter}
                            onChange={(e) => handleFilterChange('user', e.target.value)}
                        />

                        {/* Date Filter */}
                        <select
                            className="input"
                            value={dateFilter}
                            onChange={(e) => handleFilterChange('date', e.target.value)}
                        >
                            <option value="">Todos os períodos</option>
                            <option value="today">Hoje</option>
                            <option value="yesterday">Ontem</option>
                            <option value="week">Últimos 7 dias</option>
                            <option value="month">Último mês</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <FileText className="h-8 w-8 text-primary-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {pagination.total || 0}
                                </div>
                                <div className="text-sm text-gray-600">Total de Logs</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-8 w-8 text-success-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {logs.filter(log => log.action.includes('APPROVED')).length}
                                </div>
                                <div className="text-sm text-gray-600">Aprovações</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {logs.filter(log => log.action.includes('SCHEDULE')).length}
                                </div>
                                <div className="text-sm text-gray-600">Ações em Escalas</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <User className="h-8 w-8 text-purple-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {logs.filter(log => log.action.includes('USER')).length}
                                </div>
                                <div className="text-sm text-gray-600">Ações de Usuário</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            <div className="card">
                <div className="card-body p-0">
                    {logs.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Nenhum log encontrado
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Nenhum registro corresponde aos filtros aplicados.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th>Ação</th>
                                        <th>Usuário</th>
                                        <th>Descrição</th>
                                        <th>Data/Hora</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50">
                                            <td>
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        {getActionIcon(log.action)}
                                                    </div>
                                                    <div>
                                                        <span className={getActionBadge(log.action)}>
                                                            {getActionLabel(log.action)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center">
                                                    {log.user ? (
                                                        <>
                                                            <div className="flex-shrink-0 h-8 w-8">
                                                                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                                                                    <span className="text-xs font-medium text-white">
                                                                        {log.user.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="ml-3">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {log.user.name}
                                                                </div>
                                                                <div className="text-xs text-gray-500">
                                                                    {log.user.email}
                                                                </div>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm text-gray-500">Sistema</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm text-gray-900 max-w-md">
                                                    <p className="line-clamp-2">{log.description}</p>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="text-sm text-gray-600">
                                                    <div className="flex items-center">
                                                        <Clock className="h-4 w-4 mr-1" />
                                                        {format(new Date(log.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleViewDetails(log)}
                                                    className="p-1 text-primary-600 hover:text-primary-800 rounded"
                                                    title="Ver detalhes"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Mostrando {((page - 1) * limit) + 1} até {Math.min(page * limit, pagination.total)} de {pagination.total} registros
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setPage(page - 1)}
                                    disabled={page === 1}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                                        const pageNum = Math.max(1, Math.min(pagination.pages - 4, page - 2)) + i;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setPage(pageNum)}
                                                className={`px-3 py-1 rounded-lg text-sm ${pageNum === page
                                                        ? 'bg-primary-600 text-white'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setPage(page + 1)}
                                    disabled={page === pagination.pages}
                                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Log Details Modal */}
            <Modal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedLog(null);
                }}
                title="Detalhes do Log"
                size="lg"
            >
                {selectedLog && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-4">Informações da Ação</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Tipo de Ação</dt>
                                        <dd className="text-sm">
                                            <span className={getActionBadge(selectedLog.action)}>
                                                {getActionLabel(selectedLog.action)}
                                            </span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">ID do Log</dt>
                                        <dd className="text-sm text-gray-900 font-mono">{selectedLog.id}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Target ID</dt>
                                        <dd className="text-sm text-gray-900 font-mono">
                                            {selectedLog.targetId || 'N/A'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Data/Hora</dt>
                                        <dd className="text-sm text-gray-900">
                                            {format(new Date(selectedLog.createdAt), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                        </dd>
                                    </div>
                                </dl>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-4">Usuário Responsável</h3>
                                {selectedLog.user ? (
                                    <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-shrink-0 h-12 w-12">
                                            <div className="h-12 w-12 bg-primary-600 rounded-full flex items-center justify-center">
                                                <span className="text-sm font-medium text-white">
                                                    {selectedLog.user.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {selectedLog.user.name}
                                            </div>
                                            <div className="text-sm text-gray-500">
                                                {selectedLog.user.email}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">
                                                ID: {selectedLog.user.id}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-sm text-gray-600">Ação realizada pelo sistema</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Descrição Completa</h3>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-900">{selectedLog.description}</p>
                            </div>
                        </div>

                        {/* Additional technical details */}
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">Detalhes Técnicos</h3>
                            <div className="bg-gray-900 rounded-lg p-4">
                                <pre className="text-xs text-gray-300 overflow-x-auto">
                                    {JSON.stringify({
                                        id: selectedLog.id,
                                        action: selectedLog.action,
                                        targetId: selectedLog.targetId,
                                        userId: selectedLog.userId,
                                        timestamp: selectedLog.createdAt,
                                        description: selectedLog.description
                                    }, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminLogs;