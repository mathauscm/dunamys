import React, { useState } from 'react';
import { Search, Filter, UserCheck, UserX, Eye, Mail, Phone } from 'lucide-react';
import { useApi, useMutation } from '../../hooks/useApi';
import { adminService } from '../../services/members';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminMembers = () => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedMember, setSelectedMember] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const { data: membersData, loading, refresh } = useApi('/admin/members', {
        immediate: true,
        dependencies: [search, statusFilter]
    });

    const { mutate: approveMember } = useMutation(
        adminService.approveMember,
        {
            onSuccess: refresh,
            successMessage: 'Membro aprovado com sucesso'
        }
    );

    const { mutate: rejectMember } = useMutation(
        adminService.rejectMember,
        {
            onSuccess: () => {
                refresh();
                setSelectedMember(null);
                setRejectReason('');
            },
            successMessage: 'Membro rejeitado'
        }
    );

    const handleApprove = async (memberId) => {
        if (window.confirm('Tem certeza que deseja aprovar este membro?')) {
            await approveMember(memberId);
        }
    };

    const handleReject = async (member) => {
        setSelectedMember(member);
        // Modal de rejeição seria implementado aqui
        const reason = window.prompt('Motivo da rejeição (opcional):');
        if (reason !== null) {
            await rejectMember(member.id, reason);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            ACTIVE: 'badge badge-success',
            PENDING: 'badge badge-warning',
            INACTIVE: 'badge badge-gray',
            REJECTED: 'badge badge-danger'
        };

        const labels = {
            ACTIVE: 'Ativo',
            PENDING: 'Pendente',
            INACTIVE: 'Inativo',
            REJECTED: 'Rejeitado'
        };

        return (
            <span className={badges[status] || 'badge badge-gray'}>
                {labels[status] || status}
            </span>
        );
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    const members = membersData?.members || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Gerenciar Membros</h1>
                <p className="text-gray-600">Aprovar, rejeitar e gerenciar membros do sistema</p>
            </div>

            {/* Filters */}
            <div className="card">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    className="input pl-10"
                                    placeholder="Buscar por nome ou email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <select
                                className="input w-48"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">Todos os status</option>
                                <option value="PENDING">Pendentes</option>
                                <option value="ACTIVE">Ativos</option>
                                <option value="INACTIVE">Inativos</option>
                                <option value="REJECTED">Rejeitados</option>
                            </select>

                            <button
                                onClick={refresh}
                                className="btn btn-secondary"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                Atualizar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Members Table */}
            <div className="card">
                <div className="card-body p-0">
                    {members.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Nenhum membro encontrado
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Tente ajustar os filtros de busca.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead className="table-header">
                                    <tr>
                                        <th>Membro</th>
                                        <th>Contato</th>
                                        <th>Status</th>
                                        <th>Cadastro</th>
                                        <th>Escalas</th>
                                        <th>Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="table-body">
                                    {members.map((member) => (
                                        <tr key={member.id}>
                                            <td>
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                                                            <span className="text-sm font-medium text-white">
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {member.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                                    <span className="flex items-center">
                                                        <Mail className="h-4 w-4 mr-1" />
                                                        {member.email}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Phone className="h-4 w-4 mr-1" />
                                                        {member.phone}
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                {getStatusBadge(member.status)}
                                            </td>
                                            <td className="text-sm text-gray-600">
                                                {format(new Date(member.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                            </td>
                                            <td className="text-sm text-gray-600">
                                                {member._count?.schedules || 0}
                                            </td>
                                            <td>
                                                <div className="flex items-center space-x-2">
                                                    {member.status === 'PENDING' && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(member.id)}
                                                                className="p-1 text-success-600 hover:bg-success-50 rounded"
                                                                title="Aprovar"
                                                            >
                                                                <UserCheck className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(member)}
                                                                className="p-1 text-danger-600 hover:bg-danger-50 rounded"
                                                                title="Rejeitar"
                                                            >
                                                                <UserX className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setShowMemberModal(true);
                                                        }}
                                                        className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                                        title="Ver detalhes"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Member Details Modal */}
            <Modal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                title="Detalhes do Membro"
                size="lg"
            >
                {selectedMember && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="font-medium text-gray-900 mb-4">Informações Pessoais</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Nome</dt>
                                        <dd className="text-sm text-gray-900">{selectedMember.name}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Email</dt>
                                        <dd className="text-sm text-gray-900">{selectedMember.email}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Telefone</dt>
                                        <dd className="text-sm text-gray-900">{selectedMember.phone}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Status</dt>
                                        <dd className="text-sm">{getStatusBadge(selectedMember.status)}</dd>
                                    </div>
                                </dl>
                            </div>

                            <div>
                                <h3 className="font-medium text-gray-900 mb-4">Estatísticas</h3>
                                <dl className="space-y-3">
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Data de Cadastro</dt>
                                        <dd className="text-sm text-gray-900">
                                            {format(new Date(selectedMember.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Último Acesso</dt>
                                        <dd className="text-sm text-gray-900">
                                            {selectedMember.lastLogin
                                                ? format(new Date(selectedMember.lastLogin), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                                                : 'Nunca acessou'
                                            }
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500">Total de Escalas</dt>
                                        <dd className="text-sm text-gray-900">{selectedMember._count?.schedules || 0}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>

                        {selectedMember.status === 'PENDING' && (
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => handleReject(selectedMember)}
                                    className="btn btn-danger"
                                >
                                    Rejeitar
                                </button>
                                <button
                                    onClick={() => handleApprove(selectedMember.id)}
                                    className="btn btn-success"
                                >
                                    Aprovar
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default AdminMembers;
