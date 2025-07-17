import React, { useState } from 'react';
import {
    Calendar,
    Plus,
    Edit2,
    Trash2,
    Users,
    Clock,
    MapPin,
    Send,
    ChevronLeft,
    ChevronRight,
    Filter,
    Search,
    Eye
} from 'lucide-react';
import { useApi, useMutation } from '../../hooks/useApi';
import { adminService, scheduleService } from '../../services/members';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import ScheduleForm from '../../components/forms/ScheduleForm';
import MembersSection from '../../components/schedules/MembersSection';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminSchedules = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // Filtro por mês corrigido: calcula o início e fim do mês atual
    const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

    // Chama a API já com os filtros de data e busca
    const { data: schedules, loading, refresh } = useApi(
        `/schedules?startDate=${startDate}&endDate=${endDate}&search=${encodeURIComponent(search)}&status=${statusFilter}`,
        {
            immediate: true,
            dependencies: [month, year, search, statusFilter]
        }
    );

    const { mutate: createSchedule, loading: creating } = useMutation(
        adminService.createSchedule,
        {
            onSuccess: () => {
                setShowCreateModal(false);
                refresh();
                // Mostrar feedback sobre notificações em background
                console.log('✅ Escala criada com sucesso! Notificações sendo enviadas em background.');
            }
        }
    );

    const { mutate: updateSchedule, loading: updating } = useMutation(
        (data) => adminService.updateSchedule(selectedSchedule.id, data),
        {
            onSuccess: () => {
                setShowEditModal(false);
                setSelectedSchedule(null);
                refresh();
                // Mostrar feedback sobre notificações em background
                console.log('✅ Escala atualizada com sucesso! Notificações sendo enviadas em background.');
            }
        }
    );

    const { mutate: deleteSchedule } = useMutation(
        adminService.deleteSchedule,
        {
            onSuccess: () => {
                refresh();
                console.log('✅ Escala removida com sucesso! Notificações de cancelamento sendo enviadas em background.');
            },
            successMessage: 'Escala removida com sucesso'
        }
    );

    const { mutate: sendNotification, loading: sendingNotification } = useMutation(
        ({ scheduleId, type, message }) => adminService.sendNotification(scheduleId, type, message),
        {
            onSuccess: () => {
                setShowNotificationModal(false);
                setSelectedSchedule(null);
                console.log('✅ Notificação customizada sendo enviada em background!');
            },
            successMessage: 'Notificação está sendo enviada em background'
        }
    );

    // Handlers consolidados e aprimorados
    const handleCreateSubmit = async (formData) => {
        try {
            console.log('Criando escala:', formData);
            await createSchedule(formData);
        } catch (error) {
            console.error('Erro ao criar escala:', error);
        }
    };

    const handleEditSubmit = async (formData) => {
        try {
            console.log('Editando escala:', formData);
            await updateSchedule(formData);
        } catch (error) {
            console.error('Erro ao editar escala:', error);
        }
    };

    const handleDelete = async (schedule) => {
        if (window.confirm(`Tem certeza que deseja remover a escala "${schedule.title}"?`)) {
            await deleteSchedule(schedule.id);
        }
    };

    const handleEdit = (schedule) => {
        setSelectedSchedule(schedule);
        setShowEditModal(true);
    };

    const handleViewDetails = (schedule) => {
        setSelectedSchedule(schedule);
        setShowDetailsModal(true);
    };

    const handleSendNotification = (schedule) => {
        setSelectedSchedule(schedule);
        setShowNotificationModal(true);
    };

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const getStatusBadge = (schedule) => {
        const scheduleDate = new Date(schedule.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (scheduleDate < today) {
            return <span className="badge badge-gray">Concluída</span>;
        } else if (scheduleDate.toDateString() === today.toDateString()) {
            return <span className="badge badge-warning">Hoje</span>;
        } else {
            return <span className="badge badge-success">Agendada</span>;
        }
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    const monthSchedules = schedules || [];
    const currentMonthName = format(currentDate, 'MMMM yyyy', { locale: ptBR });

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Gerenciar Escalas</h1>
                        <p className="text-gray-600">Organize e gerencie as escalas de serviço</p>
                    </div>

                    <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                        <button
                            onClick={handleToday}
                            className="btn btn-secondary btn-sm"
                        >
                            Hoje
                        </button>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary flex items-center"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Escala
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="card">
                    <div className="card-body">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                            {/* Month Navigation */}
                            <div className="flex items-center space-x-4">
                                <button
                                    onClick={handlePreviousMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <h2 className="text-lg font-semibold text-gray-900 capitalize min-w-[200px] text-center">
                                    {currentMonthName}
                                </h2>

                                <button
                                    onClick={handleNextMonth}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Search and Filter */}
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Search className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        className="input pl-10 w-64"
                                        placeholder="Buscar escalas..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                <button
                                    onClick={refresh}
                                    className="btn btn-secondary flex items-center"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Atualizar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Schedules Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {monthSchedules.length === 0 ? (
                        <div className="col-span-full">
                            <div className="card">
                                <div className="card-body text-center py-12">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                                        Nenhuma escala encontrada
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {search
                                            ? 'Nenhuma escala corresponde aos critérios de busca.'
                                            : `Nenhuma escala cadastrada para ${currentMonthName.toLowerCase()}.`
                                        }
                                    </p>
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="btn btn-primary mt-4"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Criar primeira escala
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        monthSchedules.map((schedule) => (
                            <div key={schedule.id} className="card hover:shadow-lg transition-shadow">
                                <div className="card-header">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900 line-clamp-2">
                                                {schedule.title}
                                            </h3>
                                            <div className="mt-1">
                                                {getStatusBadge(schedule)}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-1 ml-2">
                                            <button
                                                onClick={() => handleViewDetails(schedule)}
                                                className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                                title="Ver detalhes"
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(schedule)}
                                                className="p-1 text-blue-400 hover:text-blue-600 rounded"
                                                title="Editar"
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule)}
                                                className="p-1 text-red-400 hover:text-red-600 rounded"
                                                title="Remover"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="space-y-3">
                                        <div className="flex items-center text-sm text-gray-600">
                                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                            {format(new Date(schedule.date), "dd/MM/yyyy", { locale: ptBR })}
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                            {schedule.time}
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600">
                                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                            <span className="line-clamp-1">{schedule.location}</span>
                                        </div>

                                        <div className="flex items-center text-sm text-gray-600">
                                            <Users className="h-4 w-4 mr-2 text-gray-400" />
                                            {schedule.members?.length || 0} membro{(schedule.members?.length || 0) !== 1 ? 's' : ''}
                                        </div>

                                        {schedule.description && (
                                            <p className="text-sm text-gray-600 line-clamp-2">
                                                {schedule.description}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => handleViewDetails(schedule)}
                                            className="btn btn-secondary btn-sm"
                                        >
                                            Ver Detalhes
                                        </button>
                                        <button
                                            onClick={() => handleSendNotification(schedule)}
                                            className="btn btn-primary btn-sm flex items-center"
                                        >
                                            <Send className="h-3 w-3 mr-1" />
                                            Notificar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Modal de Criação - Nova Escala */}
                <Modal
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    title="Nova Escala"
                    size="lg"
                    scrollable={true}
                    closeOnEscape={true}
                    closeOnBackdropClick={true}
                >
                    <ScheduleForm
                        onSubmit={handleCreateSubmit}
                        loading={creating}
                        onClose={() => setShowCreateModal(false)}
                    />
                </Modal>

                {/* Modal de Edição */}
                <Modal
                    isOpen={showEditModal}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedSchedule(null);
                    }}
                    title="Editar Escala"
                    size="lg"
                    scrollable={true}
                    closeOnEscape={true}
                    closeOnBackdropClick={true}
                >
                    {selectedSchedule && (
                        <ScheduleForm
                            schedule={selectedSchedule}
                            onSubmit={handleEditSubmit}
                            loading={updating}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedSchedule(null);
                            }}
                        />
                    )}
                </Modal>

                {/* Modal de Detalhes */}
                <Modal
                    isOpen={showDetailsModal}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedSchedule(null);
                    }}
                    title="Detalhes da Escala"
                    size="4xl"
                    scrollable={false}
                    closeOnEscape={true}
                    closeOnBackdropClick={false}
                >
                    {selectedSchedule && (
                        <div className="flex flex-col h-full min-h-[70vh] max-h-[85vh]">
                            {/* Conteúdo com scroll interno */}
                            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                                <div className="space-y-6">
                                    {/* Header com informações principais */}
                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Título</dt>
                                                <dd className="mt-1 text-base font-semibold text-gray-900">{selectedSchedule.title}</dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data</dt>
                                                <dd className="mt-1 text-base font-semibold text-gray-900">
                                                    {format(new Date(selectedSchedule.date), "dd/MM/yyyy", { locale: ptBR })}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</dt>
                                                <dd className="mt-1">{getStatusBadge(selectedSchedule)}</dd>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Horário</dt>
                                                <dd className="mt-1 text-base font-medium text-gray-900 flex items-center">
                                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                    {selectedSchedule.time}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">Local</dt>
                                                <dd className="mt-1 text-base font-medium text-gray-900 flex items-center">
                                                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                    {selectedSchedule.location}
                                                </dd>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Descrição */}
                                    {selectedSchedule.description && (
                                        <div className="bg-white border rounded-lg p-4 shadow-sm">
                                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                                <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
                                                Descrição
                                            </h3>
                                            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded">
                                                {selectedSchedule.description}
                                            </p>
                                        </div>
                                    )}

                                    {/* Seção de Membros */}
                                    <div className="bg-white">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                                            <div className="h-2 w-2 bg-green-500 rounded-full mr-2"></div>
                                            Membros Escalados
                                        </h3>
                                        <MembersSection 
                                            members={selectedSchedule.members || []}
                                            scheduleId={selectedSchedule.id}
                                            onRefresh={refresh}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer fixo */}
                            <div className="flex-shrink-0 flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 pb-6">
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        setSelectedSchedule(null);
                                    }}
                                    className="btn btn-secondary"
                                >
                                    Fechar
                                </button>
                                <button
                                    onClick={() => handleSendNotification(selectedSchedule)}
                                    className="btn btn-primary flex items-center"
                                >
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar Notificação
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDetailsModal(false);
                                        handleEdit(selectedSchedule);
                                    }}
                                    className="btn btn-secondary flex items-center"
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Editar
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Modal de Notificação */}
                <Modal
                    isOpen={showNotificationModal}
                    onClose={() => {
                        setShowNotificationModal(false);
                        setSelectedSchedule(null);
                    }}
                    title="Enviar Notificação"
                    size="md"
                    scrollable={true}
                    closeOnEscape={true}
                    closeOnBackdropClick={true}
                >
                    {selectedSchedule && (
                        <NotificationForm
                            schedule={selectedSchedule}
                            onSubmit={sendNotification}
                            loading={sendingNotification}
                            onCancel={() => {
                                setShowNotificationModal(false);
                                setSelectedSchedule(null);
                            }}
                        />
                    )}
                </Modal>
            </div>
        </div>
    );
};

// Notification Form Component
const NotificationForm = ({ schedule, onSubmit, loading, onCancel }) => {
    const [message, setMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!message.trim()) {
            alert('Por favor, digite uma mensagem');
            return;
        }

        onSubmit({
            scheduleId: schedule.id,
            type: 'BOTH', // Sempre email + WhatsApp
            message: message.trim()
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <h3 className="font-medium text-gray-900 mb-2">
                    Escala: {schedule.title}
                </h3>
                <p className="text-sm text-gray-600">
                    {format(new Date(schedule.date), "dd/MM/yyyy", { locale: ptBR })} às {schedule.time}
                </p>
                <p className="text-sm text-gray-600">
                    {schedule.members?.length || 0} membro{(schedule.members?.length || 0) !== 1 ? 's' : ''} será(ão) notificado(s)
                </p>
            </div>


            <div>
                <label className="label">Mensagem</label>
                <textarea
                    className="input min-h-[120px] resize-vertical"
                    placeholder="Digite sua mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                />
            </div>

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
                    disabled={loading || !message.trim()}
                    className="btn btn-primary flex items-center"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Enviando...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4 mr-2" />
                            Enviar Notificação
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};

export default AdminSchedules;