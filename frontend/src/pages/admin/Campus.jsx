// frontend/src/pages/admin/Campus.jsx - VERSÃO COMPLETA
import React, { useState } from 'react';
import {
   MapPin,
   Plus,
   Edit2,
   Trash2,
   Search,
   Users,
   Eye,
   ToggleLeft,
   ToggleRight,
   Building,
   RefreshCw
} from 'lucide-react';
import { useApi, useMutation } from '../../hooks/useApi';
import { campusService } from '../../services/campus';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminCampus = () => {
   const [search, setSearch] = useState('');
   const [activeFilter, setActiveFilter] = useState('');
   const [showCreateModal, setShowCreateModal] = useState(false);
   const [showEditModal, setShowEditModal] = useState(false);
   const [showDetailsModal, setShowDetailsModal] = useState(false);
   const [selectedCampus, setSelectedCampus] = useState(null);

   // CORREÇÃO: Hook useApi corrigido com dependências corretas
   const { data: campusData, loading, refresh } = useApi('/campus', {
       immediate: true,
       onSuccess: (data) => {
           console.log('✅ Dados dos campus recebidos:', data);
           if (data.campuses) {
               data.campuses.forEach(campus => {
                   console.log(`Campus: ${campus.name} - Contagem: ${campus._count?.users || 0}`);
               });
           }
       },
       onError: (error) => {
           console.error('❌ Erro ao carregar campus:', error);
       }
   });

   const { mutate: createCampus, loading: creating } = useMutation(
       campusService.createCampus,
       {
           onSuccess: () => {
               setShowCreateModal(false);
               refresh();
           }
       }
   );

   const { mutate: updateCampus, loading: updating } = useMutation(
       (data) => campusService.updateCampus(selectedCampus.id, data),
       {
           onSuccess: () => {
               setShowEditModal(false);
               setSelectedCampus(null);
               refresh();
           }
       }
   );

   const { mutate: deleteCampus } = useMutation(
       campusService.deleteCampus,
       {
           onSuccess: refresh,
           successMessage: 'Campus excluído com sucesso'
       }
   );

   const { mutate: toggleCampusStatus } = useMutation(
       ({ id, active }) => campusService.updateCampus(id, { active }),
       {
           onSuccess: refresh
       }
   );

   // NOVO: Mutação para debug das estatísticas
   const { mutate: debugStats, loading: debugLoading } = useMutation(
       async () => {
           const response = await fetch('http://localhost:5000/api/campus/debug/stats', {
               method: 'GET',
               headers: {
                   'Authorization': `Bearer ${localStorage.getItem('@igreja:token')}`,
                   'Content-Type': 'application/json'
               }
           });
           return response.json();
       },
       {
           onSuccess: (data) => {
               console.log('🔍 Debug Stats:', data);
               refresh();
           },
           successMessage: 'Estatísticas atualizadas'
       }
   );

   const handleCreateSubmit = async (data) => {
       await createCampus(data);
   };

   const handleEditSubmit = async (data) => {
       await updateCampus(data);
   };

   const handleDelete = async (campus) => {
       if (window.confirm(`Tem certeza que deseja excluir o campus "${campus.name}"?`)) {
           await deleteCampus(campus.id);
       }
   };

   const handleEdit = (campus) => {
       setSelectedCampus(campus);
       setShowEditModal(true);
   };

   const handleViewDetails = async (campus) => {
       try {
           const fullCampus = await campusService.getCampusById(campus.id);
           setSelectedCampus(fullCampus);
           setShowDetailsModal(true);
       } catch (error) {
           console.error('Erro ao carregar detalhes do campus:', error);
       }
   };

   const handleToggleStatus = async (campus) => {
       const newStatus = !campus.active;
       const action = newStatus ? 'ativar' : 'desativar';
       
       if (window.confirm(`Tem certeza que deseja ${action} o campus "${campus.name}"?`)) {
           await toggleCampusStatus({ id: campus.id, active: newStatus });
       }
   };

   const handleDebugStats = () => {
       console.log('🔍 Executando debug das estatísticas...');
       debugStats();
   };

   if (loading) {
       return <Loading fullScreen />;
   }

   const campuses = campusData?.campuses || [];

   return (
       <div className="space-y-6">
           {/* Header */}
           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
               <div>
                   <h1 className="text-2xl font-bold text-gray-900">Gerenciar Campus</h1>
                   <p className="text-gray-600">Criar, editar e gerenciar campus da igreja</p>
               </div>

               <div className="flex items-center space-x-3 mt-4 lg:mt-0">
                   {/* NOVO: Botão de Debug */}
                   <button
                       onClick={handleDebugStats}
                       disabled={debugLoading}
                       className="btn btn-secondary flex items-center"
                       title="Debug: Verificar contagem de usuários"
                   >
                       <RefreshCw className={`h-4 w-4 mr-2 ${debugLoading ? 'animate-spin' : ''}`} />
                       Debug Stats
                   </button>
                   
                   <button
                       onClick={() => setShowCreateModal(true)}
                       className="btn btn-primary flex items-center"
                   >
                       <Plus className="h-4 w-4 mr-2" />
                       Novo Campus
                   </button>
               </div>
           </div>

           {/* Debug Info - Remover em produção */}
           {process.env.NODE_ENV === 'development' && (
               <div className="card bg-blue-50 border-blue-200">
                   <div className="card-body">
                       <h3 className="text-sm font-medium text-blue-800 mb-2">Debug Info</h3>
                       <div className="text-xs text-blue-700">
                           <p>Total de campus carregados: {campuses.length}</p>
                           <p>Dados dos campus:</p>
                           <pre className="mt-2 p-2 bg-blue-100 rounded text-xs overflow-auto">
                               {JSON.stringify(
                                   campuses.map(c => ({
                                       id: c.id,
                                       name: c.name,
                                       userCount: c._count?.users,
                                       hasCount: !!c._count
                                   })),
                                   null,
                                   2
                               )}
                           </pre>
                       </div>
                   </div>
               </div>
           )}

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
                                   placeholder="Buscar por nome ou cidade..."
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

           {/* Campus Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {campuses.length === 0 ? (
                   <div className="col-span-full">
                       <div className="card">
                           <div className="card-body text-center py-12">
                               <Building className="mx-auto h-12 w-12 text-gray-400" />
                               <h3 className="mt-2 text-sm font-medium text-gray-900">
                                   Nenhum campus encontrado
                               </h3>
                               <p className="mt-1 text-sm text-gray-500">
                                   {search
                                       ? 'Nenhum campus corresponde aos critérios de busca.'
                                       : 'Nenhum campus cadastrado ainda.'
                                   }
                               </p>
                               <button
                                   onClick={() => setShowCreateModal(true)}
                                   className="btn btn-primary mt-4"
                               >
                                   <Plus className="h-4 w-4 mr-2" />
                                   Criar primeiro campus
                               </button>
                           </div>
                       </div>
                   </div>
               ) : (
                   campuses.map((campus) => (
                       <div key={campus.id} className="card hover:shadow-lg transition-shadow">
                           <div className="card-header">
                               <div className="flex items-start justify-between">
                                   <div className="flex items-center space-x-3">
                                       <div className={`w-3 h-3 rounded-full ${campus.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                                       <div>
                                           <h3 className="font-medium text-gray-900">
                                               {campus.name}
                                           </h3>
                                           {campus.city && (
                                               <p className="text-sm text-gray-500">{campus.city}</p>
                                           )}
                                       </div>
                                   </div>
                                   <div className="flex items-center space-x-1">
                                       <button
                                           onClick={() => handleViewDetails(campus)}
                                           className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                           title="Ver detalhes"
                                       >
                                           <Eye className="h-4 w-4" />
                                       </button>
                                       <button
                                           onClick={() => handleEdit(campus)}
                                           className="p-1 text-blue-400 hover:text-blue-600 rounded"
                                           title="Editar"
                                       >
                                           <Edit2 className="h-4 w-4" />
                                       </button>
                                       <button
                                           onClick={() => handleToggleStatus(campus)}
                                           className="p-1 hover:text-gray-600 rounded"
                                           title={campus.active ? 'Desativar' : 'Ativar'}
                                       >
                                           {campus.active ? (
                                               <ToggleRight className="h-4 w-4 text-green-500" />
                                           ) : (
                                               <ToggleLeft className="h-4 w-4 text-gray-400" />
                                           )}
                                       </button>
                                       <button
                                           onClick={() => handleDelete(campus)}
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
                                       {campus._count?.users || 0} membro{(campus._count?.users || 0) !== 1 ? 's' : ''}
                                       {/* Debug info */}
                                       {process.env.NODE_ENV === 'development' && (
                                           <span className="ml-2 text-xs text-blue-500">
                                               (debug: {campus._count ? 'hasCount' : 'noCount'})
                                           </span>
                                       )}
                                   </div>
                                   <div className="flex items-center text-sm text-gray-600">
                                       <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                       {campus.active ? 'Ativo' : 'Inativo'}
                                   </div>
                                   <div className="text-xs text-gray-500">
                                       Criado em {format(new Date(campus.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                   </div>
                               </div>
                           </div>
                       </div>
                   ))
               )}
           </div>

           {/* Create Campus Modal */}
           <Modal
               isOpen={showCreateModal}
               onClose={() => setShowCreateModal(false)}
               title="Novo Campus"
               size="md"
           >
               <CampusForm
                   onSubmit={handleCreateSubmit}
                   loading={creating}
                   onCancel={() => setShowCreateModal(false)}
               />
           </Modal>

           {/* Edit Campus Modal */}
           <Modal
               isOpen={showEditModal}
               onClose={() => {
                   setShowEditModal(false);
                   setSelectedCampus(null);
               }}
               title="Editar Campus"
               size="md"
           >
               {selectedCampus && (
                   <CampusForm
                       campus={selectedCampus}
                       onSubmit={handleEditSubmit}
                       loading={updating}
                       onCancel={() => {
                           setShowEditModal(false);
                           setSelectedCampus(null);
                       }}
                   />
               )}
           </Modal>

           {/* Campus Details Modal */}
           <Modal
               isOpen={showDetailsModal}
               onClose={() => {
                   setShowDetailsModal(false);
                   setSelectedCampus(null);
               }}
               title="Detalhes do Campus"
               size="lg"
           >
               {selectedCampus && (
                   <CampusDetails campus={selectedCampus} />
               )}
           </Modal>
       </div>
   );
};

// Campus Form Component
const CampusForm = ({ campus, onSubmit, loading, onCancel }) => {
   const [formData, setFormData] = useState({
       name: campus?.name || '',
       city: campus?.city || '',
       active: campus?.active ?? true
   });

   const handleSubmit = (e) => {
       e.preventDefault();
       if (!formData.name.trim()) {
           alert('Nome do campus é obrigatório');
           return;
       }
       onSubmit(formData);
   };

   return (
       <form onSubmit={handleSubmit} className="space-y-6">
           <div>
               <label className="label">Nome do Campus *</label>
               <input
                   type="text"
                   className="input"
                   placeholder="Ex: Ubajara, Tianguá"
                   value={formData.name}
                   onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                   required
               />
           </div>

           <div>
               <label className="label">Cidade (Opcional)</label>
               <input
                   type="text"
                   className="input"
                   placeholder="Nome da cidade"
                   value={formData.city}
                   onChange={(e) => setFormData({ ...formData, city: e.target.value })}
               />
           </div>

           {campus && (
               <div>
                   <label className="flex items-center space-x-2">
                       <input
                           type="checkbox"
                           className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                           checked={formData.active}
                           onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                       />
                       <span className="text-sm font-medium text-gray-900">Campus ativo</span>
                   </label>
                   <p className="text-xs text-gray-500 mt-1">
                       Campus inativos não aparecerão no formulário de registro
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
                   {loading ? 'Salvando...' : (campus ? 'Atualizar' : 'Criar Campus')}
               </button>
           </div>
       </form>
   );
};

// Campus Details Component
const CampusDetails = ({ campus }) => {
   return (
       <div className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                   <h3 className="font-medium text-gray-900 mb-4">Informações Gerais</h3>
                   <dl className="space-y-3">
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Nome</dt>
                           <dd className="text-sm text-gray-900">{campus.name}</dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Cidade</dt>
                           <dd className="text-sm text-gray-900">{campus.city || 'Não informado'}</dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Status</dt>
                           <dd className="text-sm">
                               <span className={`badge ${campus.active ? 'badge-success' : 'badge-gray'}`}>
                                   {campus.active ? 'Ativo' : 'Inativo'}
                               </span>
                           </dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Criado em</dt>
                           <dd className="text-sm text-gray-900">
                               {format(new Date(campus.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                           </dd>
                       </div>
                       <div>
                           <dt className="text-sm font-medium text-gray-500">Última atualização</dt>
                           <dd className="text-sm text-gray-900">
                               {format(new Date(campus.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                           </dd>
                       </div>
                   </dl>
               </div>

               <div>
                   <h3 className="font-medium text-gray-900 mb-4">
                       Membros ({campus.users?.length || 0})
                   </h3>
                   {campus.users && campus.users.length > 0 ? (
                       <div className="space-y-2 max-h-60 overflow-y-auto">
                           {campus.users.map((user) => (
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
                       <p className="text-sm text-gray-500">Nenhum membro neste campus</p>
                   )}
               </div>
           </div>

           {/* Statistics */}
           <div>
               <h3 className="font-medium text-gray-900 mb-4">Estatísticas</h3>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="bg-blue-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-blue-600">
                           {campus.users?.length || 0}
                       </div>
                       <div className="text-xs text-blue-600">Total de Membros</div>
                   </div>
                   <div className="bg-green-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-green-600">
                           {campus.users?.filter(u => u.status === 'ACTIVE').length || 0}
                       </div>
                       <div className="text-xs text-green-600">Ativos</div>
                   </div>
                   <div className="bg-yellow-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-yellow-600">
                           {campus.users?.filter(u => u.status === 'PENDING').length || 0}
                       </div>
                       <div className="text-xs text-yellow-600">Pendentes</div>
                   </div>
                   <div className="bg-purple-50 p-3 rounded-lg">
                       <div className="text-lg font-bold text-purple-600">
                           {campus.users?.filter(u => u.role === 'ADMIN').length || 0}
                       </div>
                       <div className="text-xs text-purple-600">Administradores</div>
                   </div>
               </div>
           </div>
       </div>
   );
};

export default AdminCampus;