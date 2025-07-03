import React, { useState, useEffect } from 'react';
import { Plus, Search, X, Users, Shield, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { api } from '../../services/api';
import { functionGroupAdminService } from '../../services/functionGroupAdmin';
import { useAuth } from '../../hooks/useAuth';
import Modal from '../../components/common/Modal';

const GroupAdmins = () => {
    const [groupAdmins, setGroupAdmins] = useState([]);
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        userId: '',
        functionGroupId: ''
    });
    const { user } = useAuth();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [adminsResponse, groupsResponse, usersResponse] = await Promise.all([
                functionGroupAdminService.getAllGroupAdmins(),
                api.get('/functions/groups'),
                api.get('/admin/members')
            ]);

            setGroupAdmins(adminsResponse.admins || []);
            setGroups(groupsResponse.data.data || []);
            setUsers(usersResponse.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async () => {
        try {
            if (!newAssignment.userId || !newAssignment.functionGroupId) {
                toast.error('Selecione um usuário e um grupo');
                return;
            }

            await functionGroupAdminService.assignUser(
                parseInt(newAssignment.userId),
                parseInt(newAssignment.functionGroupId)
            );

            toast.success('Usuário designado como administrador do grupo com sucesso');
            setShowModal(false);
            setNewAssignment({ userId: '', functionGroupId: '' });
            loadData();
        } catch (error) {
            console.error('Erro ao designar usuário:', error);
            toast.error(error.response?.data?.message || 'Erro ao designar usuário');
        }
    };

    const handleRemove = async (userId, functionGroupId) => {
        if (!window.confirm('Tem certeza que deseja remover este administrador do grupo?')) {
            return;
        }

        try {
            await functionGroupAdminService.removeUser(userId, functionGroupId);
            toast.success('Administrador removido do grupo com sucesso');
            loadData();
        } catch (error) {
            console.error('Erro ao remover administrador:', error);
            toast.error(error.response?.data?.message || 'Erro ao remover administrador');
        }
    };

    const filteredAdmins = groupAdmins.filter(admin =>
        admin.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.functionGroup.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const availableUsers = users.filter(u => 
        u.status === 'ACTIVE' && u.role === 'MEMBER'
    );

    const getGroupName = (groupId) => {
        const group = groups.find(g => g.id === groupId);
        return group ? group.name : 'Grupo não encontrado';
    };

    const getUserName = (userId) => {
        const user = users.find(u => u.id === userId);
        return user ? user.name : 'Usuário não encontrado';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Carregando...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Administradores de Grupo
                    </h1>
                    <p className="mt-1 text-gray-500">
                        Gerencie os administradores dos grupos de funções
                    </p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Designar Administrador
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou grupo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Lista de Administradores */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {filteredAdmins.length === 0 ? (
                    <div className="p-8 text-center">
                        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            Nenhum administrador encontrado
                        </h3>
                        <p className="text-gray-500">
                            {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece designando um administrador para um grupo.'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Usuário
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Grupo de Funções
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Data de Designação
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredAdmins.map((admin) => (
                                    <tr key={`${admin.user.id}-${admin.functionGroup.id}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                                                    <span className="text-white font-medium">
                                                        {admin.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {admin.user.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {admin.user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Users className="w-4 h-4 text-gray-400 mr-2" />
                                                <span className="text-sm text-gray-900">
                                                    {admin.functionGroup.name}
                                                </span>
                                            </div>
                                            {admin.functionGroup.description && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {admin.functionGroup.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(admin.createdAt).toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleRemove(admin.user.id, admin.functionGroup.id)}
                                                className="text-danger-600 hover:text-danger-700 transition-colors"
                                                title="Remover administrador"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal para designar administrador */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Designar Administrador de Grupo"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Usuário
                        </label>
                        <select
                            value={newAssignment.userId}
                            onChange={(e) => setNewAssignment({ ...newAssignment, userId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Selecione um usuário</option>
                            {availableUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Grupo de Funções
                        </label>
                        <select
                            value={newAssignment.functionGroupId}
                            onChange={(e) => setNewAssignment({ ...newAssignment, functionGroupId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Selecione um grupo</option>
                            {groups.filter(g => g.active).map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAssign}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                            Designar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default GroupAdmins;