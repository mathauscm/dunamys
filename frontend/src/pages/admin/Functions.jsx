import React, { useState, useEffect } from 'react';
import {
    Plus,
    Edit,
    Trash2,
    Users,
    Briefcase,
    Car,
    Heart,
    Coffee,
    Utensils,
    DollarSign,
    Camera,
    Video,
    Radio,
    Instagram,
    Projector,
    AlertTriangle,
    Shield,
    UserPlus
} from 'lucide-react';
import { api } from '../../services/api';
import { functionGroupAdminService } from '../../services/functionGroupAdmin';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { toast } from 'react-hot-toast';

// Mapeamento de ícones
const iconMap = {
    'car': Car,
    'heart': Heart,
    'users': Users,
    'dollar-sign': DollarSign,
    'coffee': Coffee,
    'utensils': Utensils,
    'instagram': Instagram,
    'projector': Projector,
    'camera': Camera,
    'video': Video,
    'radio': Radio,
    'briefcase': Briefcase
};

const Functions = () => {
    const [groups, setGroups] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [showFunctionModal, setShowFunctionModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [editingFunction, setEditingFunction] = useState(null);
    const [selectedGroupForFunction, setSelectedGroupForFunction] = useState(null);
    const [selectedGroupForAdmin, setSelectedGroupForAdmin] = useState(null);
    const [groupAdmins, setGroupAdmins] = useState([]);

    // Estados dos formulários
    const [groupForm, setGroupForm] = useState({ name: '', description: '' });
    const [functionForm, setFunctionForm] = useState({ 
        name: '', 
        description: '', 
        icon: 'briefcase', 
        groupId: null 
    });
    const [adminForm, setAdminForm] = useState({ userId: '' });

    // Carregar dados
    useEffect(() => {
        loadGroups();
        loadUsers();
    }, []);

    const loadGroups = async () => {
        try {
            setLoading(true);
            const response = await api.get('/functions/groups');
            setGroups(response.data.data || []);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
            toast.error('Erro ao carregar grupos de funções');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            console.log('Carregando usuários...');
            const response = await api.get('/admin/members?limit=100');
            console.log('Resposta completa da API de membros:', response);
            console.log('Dados dos membros:', response.data);
            
            if (response.data && response.data.members) {
                setUsers(response.data.members);
                console.log('Usuários carregados:', response.data.members.length);
            } else if (response.data && response.data.data) {
                setUsers(response.data.data);
                console.log('Usuários carregados:', response.data.data.length);
            } else {
                console.log('Estrutura de dados inesperada:', response.data);
                setUsers([]);
            }
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            console.error('Detalhes do erro:', error.response);
            toast.error('Erro ao carregar lista de usuários: ' + (error.response?.data?.message || error.message));
        }
    };

    const loadGroupAdmins = async (groupId) => {
        try {
            const response = await functionGroupAdminService.getGroupAdmins(groupId);
            setGroupAdmins(response.admins || []);
        } catch (error) {
            console.error('Erro ao carregar administradores do grupo:', error);
            setGroupAdmins([]);
        }
    };

    // ==================== GRUPOS ====================

    const handleCreateGroup = () => {
        setEditingGroup(null);
        setGroupForm({ name: '', description: '' });
        setShowGroupModal(true);
    };

    const handleEditGroup = (group) => {
        setEditingGroup(group);
        setGroupForm({ name: group.name, description: group.description || '' });
        setShowGroupModal(true);
    };

    const handleSaveGroup = async () => {
        try {
            if (!groupForm.name.trim()) {
                toast.error('Nome do grupo é obrigatório');
                return;
            }

            if (editingGroup) {
                await api.put(`/functions/groups/${editingGroup.id}`, groupForm);
                toast.success('Grupo atualizado com sucesso');
            } else {
                await api.post('/functions/groups', groupForm);
                toast.success('Grupo criado com sucesso');
            }

            setShowGroupModal(false);
            loadGroups();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar grupo');
        }
    };

    const handleDeleteGroup = async (group) => {
        if (!window.confirm(`Tem certeza que deseja excluir o grupo "${group.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/functions/groups/${group.id}`);
            toast.success('Grupo excluído com sucesso');
            loadGroups();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao excluir grupo');
        }
    };

    // ==================== FUNÇÕES ====================

    const handleCreateFunction = (groupId = null) => {
        setEditingFunction(null);
        setSelectedGroupForFunction(groupId);
        setFunctionForm({ 
            name: '', 
            description: '', 
            icon: 'briefcase', 
            groupId: groupId 
        });
        setShowFunctionModal(true);
    };

    const handleEditFunction = (func) => {
        setEditingFunction(func);
        setSelectedGroupForFunction(func.groupId);
        setFunctionForm({
            name: func.name,
            description: func.description || '',
            icon: func.icon || 'briefcase',
            groupId: func.groupId
        });
        setShowFunctionModal(true);
    };

    const handleSaveFunction = async () => {
        try {
            if (!functionForm.name.trim()) {
                toast.error('Nome da função é obrigatório');
                return;
            }

            if (!functionForm.groupId) {
                toast.error('Grupo é obrigatório');
                return;
            }

            if (editingFunction) {
                await api.put(`/functions/${editingFunction.id}`, functionForm);
                toast.success('Função atualizada com sucesso');
            } else {
                await api.post('/functions', functionForm);
                toast.success('Função criada com sucesso');
            }

            setShowFunctionModal(false);
            loadGroups();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao salvar função');
        }
    };

    const handleDeleteFunction = async (func) => {
        if (!window.confirm(`Tem certeza que deseja excluir a função "${func.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/functions/${func.id}`);
            toast.success('Função excluída com sucesso');
            loadGroups();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao excluir função');
        }
    };

    // ==================== ADMINISTRADORES ====================

    const handleManageAdmins = async (group) => {
        setSelectedGroupForAdmin(group);
        setAdminForm({ userId: '' });
        await loadGroupAdmins(group.id);
        setShowAdminModal(true);
    };

    const handleAddAdmin = async () => {
        try {
            if (!adminForm.userId) {
                toast.error('Selecione um usuário');
                return;
            }

            await functionGroupAdminService.assignUser(
                parseInt(adminForm.userId),
                selectedGroupForAdmin.id
            );

            toast.success('Administrador adicionado com sucesso');
            setAdminForm({ userId: '' });
            await loadGroupAdmins(selectedGroupForAdmin.id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao adicionar administrador');
        }
    };

    const handleRemoveAdmin = async (userId) => {
        if (!window.confirm('Tem certeza que deseja remover este administrador?')) {
            return;
        }

        try {
            await functionGroupAdminService.removeUser(userId, selectedGroupForAdmin.id);
            toast.success('Administrador removido com sucesso');
            await loadGroupAdmins(selectedGroupForAdmin.id);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Erro ao remover administrador');
        }
    };

    // Renderizar ícone
    const renderIcon = (iconName, className = "w-5 h-5") => {
        const IconComponent = iconMap[iconName] || Briefcase;
        return <IconComponent className={className} />;
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gerenciar Funções</h1>
                    <p className="text-gray-600">Organize as funções e serviços por grupos</p>
                </div>
                <button
                    onClick={handleCreateGroup}
                    className="btn btn-primary"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Grupo
                </button>
            </div>

            {/* Lista de Grupos e Funções */}
            <div className="space-y-6">
                {groups.length === 0 ? (
                    <div className="text-center py-12">
                        <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum grupo encontrado</h3>
                        <p className="mt-1 text-sm text-gray-500">Comece criando um grupo de funções.</p>
                        <div className="mt-6">
                            <button
                                onClick={handleCreateGroup}
                                className="btn btn-primary"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Criar Primeiro Grupo
                            </button>
                        </div>
                    </div>
                ) : (
                    groups.map((group) => (
                        <div key={group.id} className="card">
                            <div className="card-header">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{group.name}</h3>
                                        {group.description && (
                                            <p className="text-sm text-gray-500">{group.description}</p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => handleManageAdmins(group)}
                                            className="btn btn-sm btn-info"
                                            title="Gerenciar Administradores"
                                        >
                                            <Shield className="w-4 h-4 mr-1" />
                                            Admins
                                        </button>
                                        <button
                                            onClick={() => handleCreateFunction(group.id)}
                                            className="btn btn-sm btn-secondary"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Função
                                        </button>
                                        <button
                                            onClick={() => handleEditGroup(group)}
                                            className="btn btn-sm btn-outline"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteGroup(group)}
                                            className="btn btn-sm btn-danger"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="card-body">
                                {group.functions && group.functions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {group.functions.map((func) => (
                                            <div
                                                key={func.id}
                                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                            >
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 mr-3">
                                                        {renderIcon(func.icon, "w-5 h-5 text-gray-600")}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {func.name}
                                                        </div>
                                                        {func.description && (
                                                            <div className="text-xs text-gray-500">
                                                                {func.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-1">
                                                    <button
                                                        onClick={() => handleEditFunction(func)}
                                                        className="p-1 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteFunction(func)}
                                                        className="p-1 text-gray-400 hover:text-red-600"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 text-gray-500">
                                        <AlertTriangle className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                        <p className="text-sm">Nenhuma função neste grupo</p>
                                        <button
                                            onClick={() => handleCreateFunction(group.id)}
                                            className="text-primary-600 hover:text-primary-500 text-sm mt-1"
                                        >
                                            Adicionar primeira função
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal para Grupo */}
            <Modal
                isOpen={showGroupModal}
                onClose={() => setShowGroupModal(false)}
                title={editingGroup ? 'Editar Grupo' : 'Novo Grupo'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome do Grupo *
                        </label>
                        <input
                            type="text"
                            value={groupForm.name}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            className="input w-full"
                            placeholder="Ex: Voluntariado Geral"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            value={groupForm.description}
                            onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                            className="input w-full"
                            rows="3"
                            placeholder="Descrição opcional do grupo"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowGroupModal(false)}
                            className="btn btn-outline"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveGroup}
                            className="btn btn-primary"
                        >
                            {editingGroup ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal para Função */}
            <Modal
                isOpen={showFunctionModal}
                onClose={() => setShowFunctionModal(false)}
                title={editingFunction ? 'Editar Função' : 'Nova Função'}
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nome da Função *
                        </label>
                        <input
                            type="text"
                            value={functionForm.name}
                            onChange={(e) => setFunctionForm({ ...functionForm, name: e.target.value })}
                            className="input w-full"
                            placeholder="Ex: Estacionamento"
                            required
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Grupo *
                        </label>
                        <select
                            value={functionForm.groupId || ''}
                            onChange={(e) => setFunctionForm({ ...functionForm, groupId: parseInt(e.target.value) })}
                            className="input w-full"
                            required
                        >
                            <option value="">Selecione um grupo</option>
                            {groups.map((group) => (
                                <option key={group.id} value={group.id}>
                                    {group.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Ícone
                        </label>
                        <select
                            value={functionForm.icon}
                            onChange={(e) => setFunctionForm({ ...functionForm, icon: e.target.value })}
                            className="input w-full"
                        >
                            <option value="briefcase">📋 Geral</option>
                            <option value="car">🚗 Carro</option>
                            <option value="heart">❤️ Coração</option>
                            <option value="users">👥 Pessoas</option>
                            <option value="dollar-sign">💰 Dinheiro</option>
                            <option value="coffee">☕ Café</option>
                            <option value="utensils">🍽️ Utensílios</option>
                            <option value="camera">📷 Câmera</option>
                            <option value="video">🎥 Vídeo</option>
                            <option value="radio">📻 Rádio</option>
                            <option value="instagram">📱 Instagram</option>
                            <option value="projector">📽️ Projetor</option>
                        </select>
                        <div className="flex items-center mt-2 text-sm text-gray-500">
                            <span className="mr-2">Preview:</span>
                            {renderIcon(functionForm.icon, "w-4 h-4")}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descrição
                        </label>
                        <textarea
                            value={functionForm.description}
                            onChange={(e) => setFunctionForm({ ...functionForm, description: e.target.value })}
                            className="input w-full"
                            rows="3"
                            placeholder="Descrição opcional da função"
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            onClick={() => setShowFunctionModal(false)}
                            className="btn btn-outline"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSaveFunction}
                            className="btn btn-primary"
                        >
                            {editingFunction ? 'Atualizar' : 'Criar'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal para Administradores */}
            <Modal
                isOpen={showAdminModal}
                onClose={() => setShowAdminModal(false)}
                title={`Administradores - ${selectedGroupForAdmin?.name}`}
                size="lg"
            >
                <div className="space-y-6">
                    {/* Adicionar novo administrador */}
                    <div className="border-b border-gray-200 pb-4">
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                            Adicionar Administrador
                        </h4>
                        <div className="flex space-x-3">
                            <select
                                value={adminForm.userId}
                                onChange={(e) => setAdminForm({ userId: e.target.value })}
                                className="flex-1 input"
                            >
                                <option value="">Selecione um usuário ({users.length} usuários carregados)</option>
                                {users.length > 0 ? users
                                    .filter(user => user.status === 'ACTIVE')
                                    .map((user) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} ({user.email}) - {user.role}
                                        </option>
                                    )) : (
                                        <option disabled>Nenhum usuário encontrado</option>
                                    )
                                }
                            </select>
                            <button
                                onClick={handleAddAdmin}
                                className="btn btn-primary"
                                disabled={!adminForm.userId}
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Adicionar
                            </button>
                        </div>
                    </div>

                    {/* Lista de administradores */}
                    <div>
                        <h4 className="text-lg font-medium text-gray-900 mb-3">
                            Administradores Atuais
                        </h4>
                        {groupAdmins.length === 0 ? (
                            <div className="text-center py-6 text-gray-500">
                                <Shield className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm">Nenhum administrador designado para este grupo</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {groupAdmins.map((admin) => (
                                    <div
                                        key={admin.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-medium">
                                                    {admin.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {admin.name}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {admin.email}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveAdmin(admin.id)}
                                            className="text-red-600 hover:text-red-700 transition-colors"
                                            title="Remover administrador"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Functions;