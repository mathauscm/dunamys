import React, { useState } from 'react';
import {
   Church,
   Plus,
   Edit2,
   Trash2,
   Search,
   Users,
   Eye,
   ToggleLeft,
   ToggleRight,
   Heart,
   RefreshCw
} from 'lucide-react';
import { useApi, useMutation } from '../../hooks/useApi';
import { ministryService } from '../../services/ministries';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminMinistries = () => {
   const [search, setSearch] = useState('');
   const [activeFilter, setActiveFilter] = useState('');
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showDetailsModal, setShowDetailsModal] = useState(false);
   const [selectedMinistry, setSelectedMinistry] = useState(null);

   const { data: ministryData, loading, refresh } = useApi('/ministries', {
       immediate: true,
       onSuccess: (data) => {
           console.log('✅ Dados dos ministérios recebidos:', data);
           if (data.ministries) {
               data.ministries.forEach(ministry => {
                   console.log(`Ministério: ${ministry.name} - Membros: ${ministry._count?.users || 0}`);
               });
           }
       },
       onError: (error) => {
           console.error('❌ Erro ao carregar ministérios:', error);
       }
   });

   const { mutate: createMinistry, loading: creating } = useMutation(
       ministryService.createMinistry,
       {
           onSuccess: () => {
               setShowCreateModal(false);
               refresh();
           }
       }
   );

   const { mutate: updateMinistry, loading: updating } = useMutation(
       (data) => ministryService.updateMinistry(selectedMinistry.id, data),
       {
           onSuccess: () => {
               setShowEditModal(false);
               setSelectedMinistry(null);
               refresh();
           }
       }
   );

   const { mutate: deleteMinistry } = useMutation(
       ministryService.deleteMinistry,
       {
           onSuccess: refresh,
           successMessage: 'Ministério excluído com sucesso'
       }
   );

   const { mutate: toggleMinistryStatus } = useMutation(
       ({ id, active }) => ministryService.updateMinistry(id, { active }),
       {
           onSuccess: refresh
       }
   );

   const handleCreateSubmit = async (data) => {
       await createMinistry(data);
   };

   const handleEditSubmit = async (data) => {
       await updateMinistry(data);
   };

   const handleDelete = async (ministry) => {
       if (window.confirm(`Tem certeza que deseja excluir o ministério "${ministry.name}"?`)) {
           await deleteMinistry(ministry.id);
       }
   };

   const handleEdit = (ministry) => {
       setSelectedMinistry(ministry);
       setShowEditModal(true);
   };

   const handleViewDetails = async (ministry) => {
       try {
           const fullMinistry = await ministryService.getMinistryById(ministry.id);
           setSelectedMinistry(fullMinistry);
           setShowDetailsModal(true);
       } catch (error) {
           console.error('Erro ao carregar detalhes do ministério:', error);
       }
   };

   const handleToggleStatus = async (ministry) => {
       const newStatus = !ministry.active;
       const action = newStatus ? 'ativar' : 'desativar';
       
       if (window.confirm(`Tem certeza que deseja ${action} o ministério "${ministry.name}"?`)) {
           await toggleMinistryStatus({ id: ministry.id, active: newStatus });
       }
   };

   if (loading) {
       return <Loading fullScreen />;
   }

   const ministries = ministryData?.ministries || [];

   return (
       <div className="space-y-6">
           {/* Header */}
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
               <div>
                   <h1 className="text-2xl font-bold text-gray-900">Gerenciar Ministérios</h1>
                   <p className="text-gray-600">Criar, editar e gerenciar ministérios da igreja</p>
               </div>

               <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                   <button
                       onClick={() => setShowCreateModal(true)}
                       className="btn btn-primary flex items-center"
                   >
                       <Plus className="h-4 w-4 mr-2" />
                       Novo Ministério
                   </button>
               </div>
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
                                   placeholder="Buscar por nome ou descrição..."
                                   value={search}
                                   onChange={(e) => setSearch(e.target.value)}
                               />
                           </div>
                       </div>

                       <div className="flex items-center space-x-4">
                           <select
                               className="input w-48"
                               value={activeFilter}
                               onChange={(e) => setActiveFilter(e.target.value)}
                           >
                               <option value="">Todos os status</option>
                               <option value="true">Ativos</option>
                               <option value="false">Inativos</option>
                           </select>

                           <button
                               onClick={refresh}
                               className="btn btn-secondary"
                           >
                               Atualizar
                           </button>
                       </div>
                   </div>
               </div>
           </div>

           {/* Ministries Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {ministries.length === 0 ? (
                   <div className="col-span-full">
                       <div className="card">
                           <div className="card-body text-center py-12">
                               <Heart className="mx-auto h-12 w-12 text-gray-400" />
                               <h3 className="mt-2 text-sm font-medium text-gray-900">
                                   Nenhum ministério encontrado
                               </h3>
                               <p className="mt-1 text-sm text-gray-500">
                                   {search
                                       ? 'Nenhum ministério corresponde aos critérios de busca.'
                                       : 'Nenhum ministério cadastrado ainda.'
                                   }
                               </p>
                               <button
                                   onClick={() => setShowCreateModal(true)}
                                   className="btn btn-primary mt-4"
                               >
                                   <Plus className="h-4 w-4 mr-2" />
                                   Criar primeiro ministério
                               </button>
                           </div>
                       </div>
                   </div>
               ) : (
                   ministries.map((ministry) => (
                       <div key={ministry.id} className="card hover:shadow-lg transition-shadow">
                           <div className="card-header">
                               <div className="flex items-start justify-between">
                                   <div className="flex items-center space-x-3">
                                       <div className={`w-3 h-3 rounded-full ${ministry.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                                       <div>
                                           <h3 className="font-medium text-gray-900">
                                               {ministry.name}
                                           </h3>
                                           {ministry.description && (
                                               <p className="text-sm text-gray-500 line-clamp-2">{ministry.description}</p>
                                           )}
                                       </div>
                                   </div>
                                   <div className="flex items-center space-x-1">
                                       <button
                                           onClick={() => handleViewDetails(ministry)}
                                           className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                           title="Ver detalhes"
                                       >
                                           <Eye className="h-4 w-4" />
                                       </button>
                                       <button
                                           onClick={() => handleEdit(ministry)}
                                           className="p-1 text-blue-400 hover:text-blue-600 rounded"
                                           title="Editar"
                                       >
                                           <Edit2 className="h-4 w-4" />
                                       </button>
                                       <button
                                           onClick={() => handleToggleStatus(ministry)}
                                           className="p-1 hover:text-gray-600 rounded"
                                           title={ministry.active ? 'Desativar' : 'Ativar'}
                                       >
                                           {ministry.active ? (
                                               <ToggleRight className="h-4 w-4 text-green-500" />
                                           ) : (
                                               <ToggleLeft className="h-4 w-4 text-gray-400" />
                                           )}
                                       </button>
                                       <button
                                           onClick={() => handleDelete(ministry)}
                                           className="p-1 text-red-400 hover:text-red-600 rounded"
                                           title="Excluir"
                                       >
                                           <Trash2 className="h-4 w-4" />
                                       </button>
                                   </div>
                               </div>
                           </div>

                           <div className="card-body">
                               <div className="space-y-3">
                                   <div className="flex items-center text-sm text-gray-600">
                                       <Users className="h-4 w-4 mr-2 text-gray-400" />
                                       {ministry._count?.users || 0} membro{(ministry._count?.users || 0) !== 1 ? 's' : ''}
                                   </div>
                                   <div className="flex items-center text-sm text-gray-600">
                                       <Church className="h-4 w-4 mr-2 text-gray-400" />
                                       {ministry.active ? 'Ativo' : 'Inativo'}
                                   </div>
                                   <div className="text-xs text-gray-500">
                                       Criado em {format(new Date(ministry.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))
               )}
           </div>

           {/* Create Ministry Modal */}
           <Modal
               isOpen={showCreateModal}
               onClose={() => setShowCreateModal(false)}
               title="Novo Ministério"
               size="md"
           >
               <MinistryForm
                   onSubmit={handleCreateSubmit}
                   loading={creating}
                   onCancel={() => setShowCreateModal(false)}
               />
           </Modal>

           {/* Edit Ministry Modal */}
           <Modal
               isOpen={showEditModal}
               onClose={() => {
                   setShowEditModal(false);
                   setSelectedMinistry(null);
               }}
               title="Editar Ministério"
               size="md"
           >
               {selectedMinistry && (
                   <MinistryForm
                       ministry={selectedMinistry}
                       onSubmit={handleEditSubmit}
                       loading={updating}
                       onCancel={() => {
                           setShowEditModal(false);
                           setSelectedMinistry(null);
                       }}
                   />
               )}
           </Modal>

           {/* Ministry Details Modal */}
           <Modal
               isOpen={showDetailsModal}
               onClose={() => {
                   setShowDetailsModal(false);
                   setSelectedMinistry(null);
               }}
               title="Detalhes do Ministério"
               size="lg"
           >
               {selectedMinistry && (
                   <MinistryDetails ministry={selectedMinistry} />
               )}
           </Modal>
       </div>
   );
};

// Ministry Form Component
const MinistryForm = ({ ministry, onSubmit, loading, onCancel }) => {
   const [formData, setFormData] = useState({
       name: ministry?.name || '',
       description: ministry?.description || '',
       active: ministry?.active ?? true
   });

   const handleSubmit = (e) => {
       e.preventDefault();
       if (!formData.name.trim()) {
           alert('Nome do ministério é obrigatório');
           return;
       }
       // Remover "active" do payload ao criar
       const dataToSend = { ...formData };
       if (!ministry) {
           delete dataToSend.active;
       }
       onSubmit(dataToSend);
   };

   return (
       <form onSubmit={handleSubmit} className="space-y-6">
           <div>
               <label className="label">Nome do Ministério *</label>
               <input
                   type="text"
                   className="input"
                   placeholder="Ex: Ministério de Mídia, Ministério de Louvor"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   required
               />
           </div>

           <div>
               <label className="label">Descrição (Opcional)</label>
               <textarea
                   className="input min-h-[100px] resize-vertical"
                   placeholder="Descreva as responsabilidades e atividades do ministério..."
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
               />
           </div>

           {ministry && (
               <div>
                   <label className="flex items-center space-x-2">
                       <input
                           type="checkbox"
                           className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                           checked={formData.active}
                           onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                       />
                       <span className="text-sm font-medium text-gray-900">Ministério ativo</span>
                   </label>
                   <p className="text-xs text-gray-500 mt-1">
                       Ministérios inativos não aparecerão na seleção para novos membros
                   </p>
               </div>
           )}

           <div className="flex justify-end space-x-3">
               <button
                   type="button"
                   onClick={onCancel}
                   className="btn btn-secondary"
               >
                   Cancelar
               </button>
               <button
                   type="submit"
                   disabled={loading}
                   className="btn btn-primary"
               >
                   {loading ? 'Salvando...' : (ministry ? 'Atualizar' : 'Criar Ministério')}
               </button>
           </div>
       </form>
   );
};

// Ministry Details Component
const MinistryDetails = ({ ministry }) => {
   return (
       <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                   <h3 className="font-medium text-gray-900 mb-4">Informações Gerais</h3>
                   <dl className="space-y-3">
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Nome</dt>
                           <dd className="text-sm text-gray-900">{ministry.name}</dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                           <dd className="text-sm text-gray-900">{ministry.description || 'Não informado'}</dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Status</dt>
                           <dd className="text-sm">
                               <span className={`badge ${ministry.active ? 'badge-success' : 'badge-gray'}`}>
                                   {ministry.active ? 'Ativo' : 'Inativo'}
                               </span>
                           </dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Criado em</dt>
                           <dd className="text-sm text-gray-900">
                               {format(new Date(ministry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                           </dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Última atualização</dt>
                           <dd className="text-sm text-gray-900">
                               {format(new Date(ministry.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                           </dd>
                       </div>
                   </dl>
               </div>

               <div>
                   <h3 className="font-medium text-gray-900 mb-4">
                       Membros ({ministry.users?.length || 0})
                   </h3>
                   {ministry.users && ministry.users.length > 0 ? (
                       <div className="space-y-2 max-h-60 overflow-y-auto">
                           {ministry.users.map((user) => (
                               <div
                                   key={user.id}
                                   className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                               >
                                   <div className="flex items-center">
                                       <div className="flex-shrink-0 h-8 w-8">
                                           <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                                               <span className="text-xs font-medium text-white">
                                                   {user.name.charAt(0).toUpperCase()}
                                               </span>
                                           </div>
                                       </div>
                                       <div className="ml-3">
                                           <div className="text-sm font-medium text-gray-900">
                                               {user.name}
                                           </div>
                                           <div className="text-xs text-gray-500">
                                               {user.email}
                                           </div>
                                           {user.campus && (
                                               <div className="text-xs text-blue-600">
                                                   {user.campus.name}
                                               </div>
                                           )}
                                       </div>
                                   </div>
                                   <div className="flex items-center space-x-2">
                                       <span className={`badge badge-sm ${
                                           user.status === 'ACTIVE' ? 'badge-success' :
                                           user.status === 'PENDING' ? 'badge-warning' :
                                           'badge-gray'
                                       }`}>
                                           {user.status === 'ACTIVE' ? 'Ativo' :
                                            user.status === 'PENDING' ? 'Pendente' :
                                            user.status === 'REJECTED' ? 'Rejeitado' : 'Inativo'}
                                       </span>
                                       <span className={`badge badge-sm ${
                                           user.role === 'ADMIN' ? 'badge-primary' : 'badge-gray'
                                       }`}>
                                           {user.role === 'ADMIN' ? 'Admin' : 'Membro'}
                                       </span>
                                   </div>
                               </div>
                           ))}
                       </div>
                   ) : (
                       <p className="text-sm text-gray-500">Nenhum membro neste ministério</p>
                   )}
               </div>
           </div>

           {/* Statistics */}
           <div>
               <h3 className="font-medium text-gray-900 mb-4">Estatísticas</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-blue-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-blue-600">
                           {ministry.users?.length || 0}
                       </div>
                       <div className="text-xs text-blue-600">Total de Membros</div>
                   </div>
                   <div className="bg-green-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-green-600">
                           {ministry.users?.filter(u => u.status === 'ACTIVE').length || 0}
                       </div>
                       <div className="text-xs text-green-600">Ativos</div>
                   </div>
                   <div className="bg-yellow-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-yellow-600">
                           {ministry.users?.filter(u => u.status === 'PENDING').length || 0}
                       </div>
                       <div className="text-xs text-yellow-600">Pendentes</div>
                   </div>
                   <div className="bg-purple-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-purple-600">
                           {ministry.users?.filter(u => u.role === 'ADMIN').length || 0}
                       </div>
                       <div className="text-xs text-purple-600">Administradores</div>
                   </div>
               </div>
           </div>
       </div>
   );
};

export default AdminMinistries;