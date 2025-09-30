import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
    Users,
    FileText,
    X,
    Calendar,
    Clock,
    MapPin,
    ChevronRight,
    UserCheck,
    Settings
} from 'lucide-react';
import { adminService } from '../../services/members';
import Loading from '../common/Loading';
import { api } from '../../services/api';
import MemberFunctionSelector from './MemberFunctionSelector';
import { DatePicker, TimePicker } from './DateTimePicker';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const ScheduleForm = ({ schedule, onSubmit, loading, onClose }) => {
    const { user } = useAuth(); // Obter dados do usuário logado
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [selectedDate, setSelectedDate] = useState(
        schedule?.date ? new Date(schedule.date) : null
    );
    const [selectedTime, setSelectedTime] = useState(schedule?.time || '');

    // Campus state
    const [campuses, setCampuses] = useState([]);
    const [loadingCampuses, setLoadingCampuses] = useState(true);

    // Filtro para membros por campus
    const [filterCampusId, setFilterCampusId] = useState('all');

    // Estado para as funções dos membros
    const [memberFunctions, setMemberFunctions] = useState({});

    // Estado para abas
    const [activeTab, setActiveTab] = useState('details'); // 'details' ou 'members'

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors }
    } = useForm({
        defaultValues: {
            title: schedule?.title || '',
            description: schedule?.description || '',
            location: schedule?.location || '',
            memberIds: schedule?.members?.map(m => m.userId) || []
        }
    });

    const selectedMemberIds = watch('memberIds');

    // Carregar funções dos membros da escala existente
    useEffect(() => {
        if (schedule?.members) {
            const existingMemberFunctions = {};
            schedule.members.forEach(member => {
                if (member.functions && member.functions.length > 0) {
                    existingMemberFunctions[member.userId] = member.functions.map(f => f.functionId);
                }
            });
            setMemberFunctions(existingMemberFunctions);
        }
    }, [schedule]);

    // Função para atualizar as funções de um membro - otimizada
    const handleMemberFunctionChange = (memberId, functionIds) => {
        setMemberFunctions(prev => {
            if (functionIds.length === 0) {
                const newState = { ...prev };
                delete newState[memberId];
                return newState;
            }
            return {
                ...prev,
                [memberId]: functionIds
            };
        });
    };

    // Carrega membros baseado na data selecionada
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoadingMembers(true);

                if (selectedDate) {
                    // Se há data selecionada, buscar apenas membros disponíveis
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    const filters = { limit: 100 };

                    // Se for groupAdmin, adicionar filtros de userRole e userId
                    if (user && user.userType === 'groupAdmin') {
                        filters.userRole = 'groupAdmin';
                        filters.userId = user.id;
                        console.log(`🔒 Carregando membros para groupAdmin ${user.id} (${user.name})`);
                    }

                    const response = await adminService.getAvailableMembers(dateStr, filters);
                    setMembers(response.members);
                    console.log(`✅ Carregados ${response.members.length} membros disponíveis para ${dateStr}`);
                    if (response.unavailableCount > 0) {
                        console.log(`ℹ️  ${response.unavailableCount} membros indisponíveis foram filtrados`);
                    }
                } else {
                    // Se não há data, carregar todos os membros ativos
                    const response = await adminService.getMembers({ status: 'ACTIVE', limit: 100 });
                    setMembers(response.members);
                }
            } catch (error) {
                console.error('Erro ao carregar membros:', error);
                // Fallback para busca tradicional em caso de erro
                try {
                    const response = await adminService.getMembers({ status: 'ACTIVE', limit: 100 });
                    setMembers(response.members);
                } catch (fallbackError) {
                    console.error('Erro no fallback:', fallbackError);
                }
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, [selectedDate, user]); // Dependências: data selecionada e usuário

    // Carrega campuses
    useEffect(() => {
        const fetchCampuses = async () => {
            try {
                const response = await api.get('/campus/public');
                setCampuses(response.data);
            } catch (error) {
                console.error('Erro ao carregar campus:', error);
                setCampuses([]);
            } finally {
                setLoadingCampuses(false);
            }
        };
        fetchCampuses();
    }, []);

    // FUNÇÃO HELPER: Obter campus ID do membro (com fallback)
    const getMemberCampusId = (member) => {
        if (member.campusId !== null && member.campusId !== undefined) {
            return member.campusId;
        }
        if (member.campus && member.campus.id !== null && member.campus.id !== undefined) {
            return member.campus.id;
        }
        return null;
    };

    // FILTRO ROBUSTO: Com fallback para campus.id
    const filteredMembers = React.useMemo(() => {
        if (filterCampusId === 'all') {
            return members;
        }

        const campusIdToFilter = parseInt(filterCampusId, 10);

        return members.filter(member => {
            const memberCampusId = getMemberCampusId(member);
            return memberCampusId !== null &&
                memberCampusId !== undefined &&
                parseInt(memberCampusId, 10) === campusIdToFilter;
        });
    }, [members, filterCampusId]);

    // CONTADOR DE MEMBROS POR CAMPUS
    const getMembersCountForCampus = (campusId) => {
        return members.filter(member => {
            const memberCampusId = getMemberCampusId(member);
            return memberCampusId !== null &&
                memberCampusId !== undefined &&
                parseInt(memberCampusId, 10) === campusId;
        }).length;
    };

    const handleMemberToggle = (memberId) => {
        const currentIds = selectedMemberIds || [];
        const newIds = currentIds.includes(memberId)
            ? currentIds.filter(id => id !== memberId)
            : [...currentIds, memberId];

        setValue('memberIds', newIds);

        // Se removendo o membro, remover também suas funções
        if (!newIds.includes(memberId)) {
            setMemberFunctions(prev => {
                const newMemberFunctions = { ...prev };
                delete newMemberFunctions[memberId];
                return newMemberFunctions;
            });
        }
    };

    const handleFormSubmit = (data) => {
        // Validar se data e hora foram selecionadas
        if (!selectedDate) {
            toast.error('Por favor, selecione uma data');
            return;
        }
        if (!selectedTime) {
            toast.error('Por favor, selecione um horário');
            return;
        }

        // Incluir funções dos membros no envio
        const formData = {
            ...data,
            date: selectedDate.toISOString().split('T')[0],
            time: selectedTime,
            memberFunctions
        };

        onSubmit(formData);
    };

    if (loadingMembers || loadingCampuses) {
        return <Loading />;
    }

    const selectedMembers = members.filter(member =>
        selectedMemberIds?.includes(member.id)
    );

    return (
        <div className="fixed inset-0 z-50 overflow-hidden pt-16 sm:pt-0">
            <div className="flex items-center justify-center min-h-screen sm:p-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                <div className="relative bg-white sm:rounded-lg shadow-xl w-full max-w-6xl h-full sm:h-[85vh] flex flex-col overflow-hidden">
                    {/* Header fixo */}
                    <div className="flex-shrink-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <h2 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
                                    {schedule ? 'Editar Escala' : 'Nova Escala'}
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 hidden sm:block">
                                    Configure os detalhes e selecione os membros
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 p-1.5 sm:p-2 hover:bg-gray-100 rounded-full flex-shrink-0 ml-2"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo principal */}
                    <div className="flex flex-col sm:flex-row w-full flex-1 overflow-hidden">
                        {/* Sidebar de Navegação - responsiva */}
                        <div className="hidden sm:flex sm:w-80 bg-gray-50 border-r border-gray-200 flex-col flex-shrink-0">
                            <nav className="flex-1 p-6">
                                <div className="space-y-3">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('details')}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                            activeTab === 'details'
                                                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <FileText className="w-5 h-5 mr-3" />
                                        <div className="text-left flex-1">
                                            <div className="font-medium">Detalhes da Escala</div>
                                            <div className="text-xs text-gray-500">Título, data, campus</div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform ${activeTab === 'details' ? 'rotate-90' : ''}`} />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('members')}
                                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                                            activeTab === 'members'
                                                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        <Users className="w-5 h-5 mr-3" />
                                        <div className="text-left flex-1">
                                            <div className="font-medium">Membros & Funções</div>
                                            <div className="text-xs text-gray-500">Seleção e configuração</div>
                                        </div>
                                        {selectedMemberIds?.length > 0 && (
                                            <span className="bg-primary-600 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                                {selectedMemberIds.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                            </nav>

                            {/* Resumo na sidebar - altura fixa */}
                            {selectedMembers.length > 0 && (
                                <div className="border-t border-gray-200 bg-white p-4 h-48 overflow-y-auto">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                        <UserCheck className="w-4 h-4 mr-2" />
                                        Resumo ({selectedMembers.length} membro{selectedMembers.length > 1 ? 's' : ''})
                                    </h4>
                                    <div className="space-y-2">
                                        {selectedMembers.map(member => {
                                            const memberFuncs = memberFunctions[member.id] || [];
                                            return (
                                                <div key={member.id} className="p-2 bg-gray-50 rounded text-xs">
                                                    <div className="font-medium text-gray-900">{member.name}</div>
                                                    {memberFuncs.length > 0 ? (
                                                        <div className="text-primary-600 mt-1">
                                                            ✓ {memberFuncs.length} função{memberFuncs.length > 1 ? 'ões' : ''}
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-500 mt-1">Sem função definida</div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navegação Mobile - Tabs horizontais */}
                        <div className="sm:hidden flex-shrink-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('details')}
                                    className={`flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        activeTab === 'details'
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'text-gray-600 bg-white border border-gray-300'
                                    }`}
                                >
                                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                                    Detalhes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('members')}
                                    className={`flex-1 flex items-center justify-center px-2 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                        activeTab === 'members'
                                            ? 'bg-primary-600 text-white shadow-sm'
                                            : 'text-gray-600 bg-white border border-gray-300'
                                    }`}
                                >
                                    <Users className="w-3.5 h-3.5 mr-1.5" />
                                    Membros
                                    {selectedMemberIds?.length > 0 && (
                                        <span className="ml-1 bg-white text-primary-600 text-[10px] rounded-full px-1.5 py-0.5 font-semibold">
                                            {selectedMemberIds.length}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Conteúdo Principal - área fixa */}
                        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col h-full">
                                {/* Área de Conteúdo - altura fixa com scroll */}
                                <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{maxHeight: 'calc(100vh - 280px)'}}>
                                    {activeTab === 'details' && (
                                        <div className="max-w-4xl space-y-4 sm:space-y-6 pb-6">
                                            <div className="mb-4 sm:mb-6">
                                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2 flex items-center">
                                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-primary-600" />
                                                    Informações da Escala
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    Configure os detalhes básicos da escala de serviço.
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
                                                {/* Coluna 1 */}
                                                <div className="space-y-3 sm:space-y-6">
                                                    {/* Título */}
                                                    <div>
                                                        <label className="label text-xs sm:text-sm">Título da Escala *</label>
                                                        <div className="relative">
                                                            <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
                                                                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                                            </div>
                                                            <input
                                                                type="text"
                                                                className={`input pl-8 sm:pl-10 text-xs sm:text-sm ${errors.title ? 'input-error' : ''}`}
                                                                placeholder="Ex: Culto Dominical"
                                                                {...register('title', {
                                                                    required: 'Título é obrigatório',
                                                                    minLength: {
                                                                        value: 3,
                                                                        message: 'Título deve ter pelo menos 3 caracteres'
                                                                    }
                                                                })}
                                                            />
                                                        </div>
                                                        {errors.title && (
                                                            <p className="error-message text-xs">{errors.title.message}</p>
                                                        )}
                                                    </div>

                                                    {/* Data e Hora */}
                                                    <div className="grid grid-cols-2 gap-2 sm:gap-4">
                                                        <div>
                                                            <label className="label text-xs sm:text-sm">
                                                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                                                Data *
                                                            </label>
                                                            <DatePicker
                                                                value={selectedDate}
                                                                onChange={setSelectedDate}
                                                                placeholder="Selecione a data"
                                                                required={true}
                                                                error={!selectedDate ? 'Data é obrigatória' : null}
                                                            />
                                                        </div>
                                                        
                                                        <div>
                                                            <label className="label text-xs sm:text-sm">
                                                                <Clock className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                                                Horário *
                                                            </label>
                                                            <TimePicker
                                                                value={selectedTime}
                                                                onChange={setSelectedTime}
                                                                placeholder="Selecione o horário"
                                                                required={true}
                                                                error={!selectedTime ? 'Horário é obrigatório' : null}
                                                                startTime="06:00"
                                                                endTime="23:30"
                                                                step={15}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Coluna 2 */}
                                                <div className="space-y-3 sm:space-y-6">
                                                    {/* Descrição */}
                                                    <div>
                                                        <label className="label text-xs sm:text-sm">Descrição (Opcional)</label>
                                                        <textarea
                                                            className="input h-20 sm:h-24 resize-none text-xs sm:text-sm"
                                                            placeholder="Descrição adicional..."
                                                            {...register('description')}
                                                        />
                                                    </div>

                                                    {/* Campus */}
                                                    <div>
                                                        <label className="label text-xs sm:text-sm">
                                                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                                                            Campus *
                                                        </label>
                                                        <select
                                                            className={`input text-xs sm:text-sm ${errors.location ? 'input-error' : ''}`}
                                                            {...register('location', { required: 'Campus é obrigatório' })}
                                                            disabled={loadingCampuses}
                                                        >
                                                            <option value="">Selecione o campus</option>
                                                            {campuses.map(campus => (
                                                                <option key={campus.id} value={campus.name}>
                                                                    {campus.name}{campus.city ? ` - ${campus.city}` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errors.location && (
                                                            <p className="error-message text-xs">{errors.location.message}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card de ação */}
                                            <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-3 sm:p-6 rounded-lg border border-primary-200">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                                                    <div className="flex-1">
                                                        <h4 className="text-sm sm:text-base font-medium text-gray-900">Próximo Passo</h4>
                                                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                                                            Selecione os membros e defina suas funções específicas
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveTab('members')}
                                                        className="btn btn-primary flex items-center justify-center w-full sm:w-auto text-sm"
                                                    >
                                                        <Users className="w-4 h-4 mr-2" />
                                                        Selecionar Membros
                                                        <ChevronRight className="w-4 h-4 ml-2" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'members' && (
                                        <div className="space-y-6">
                                            <div className="mb-3 sm:mb-6">
                                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2 flex items-center">
                                                    <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                                    Seleção de Membros e Funções
                                                </h3>
                                                <p className="text-xs sm:text-sm text-gray-500">
                                                    Escolha os membros e defina suas funções específicas.
                                                </p>
                                            </div>

                                            {/* Filtro por Campus e Info de Disponibilidade */}
                                            <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200">
                                                <div className="flex flex-col space-y-2 sm:space-y-3">
                                                    <div>
                                                        <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 block">
                                                            Filtrar por campus
                                                            <span className="text-xs text-gray-500 font-normal ml-2">
                                                                ({filteredMembers.length} encontrado{filteredMembers.length !== 1 ? 's' : ''})
                                                            </span>
                                                        </label>
                                                        <select
                                                            className="w-full text-xs sm:text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                            value={filterCampusId}
                                                            onChange={(e) => setFilterCampusId(e.target.value)}
                                                        >
                                                            <option value="all">Todos ({members.length})</option>
                                                            {campuses.map(campus => {
                                                                const membersInCampus = getMembersCountForCampus(campus.id);
                                                                return (
                                                                    <option key={campus.id} value={String(campus.id)}>
                                                                        {campus.name}{campus.city ? ` - ${campus.city}` : ''} ({membersInCampus})
                                                                    </option>
                                                                );
                                                            })}
                                                        </select>
                                                    </div>
                                                    
                                                    {/* Info de disponibilidade */}
                                                    {selectedDate && (
                                                        <div className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-xs">Disponíveis para {selectedDate.toLocaleDateString('pt-BR')}</span>
                                                        </div>
                                                    )}

                                                    {!selectedDate && (
                                                        <div className="flex items-center text-xs text-amber-600 bg-amber-50 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md">
                                                            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                            <span className="text-xs">Selecione data para filtrar disponibilidade</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Lista de Membros */}
                                            <div className="bg-white rounded-lg border border-gray-200">
                                                <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
                                                    <h4 className="text-xs sm:text-sm font-medium text-gray-900 flex items-center">
                                                        <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                                        Membros Disponíveis
                                                        {filterCampusId !== 'all' && (
                                                            <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                                                Filtrado por campus
                                                            </span>
                                                        )}
                                                    </h4>
                                                </div>

                                                <div
                                                    style={{
                                                        maxHeight: 'calc(100vh - 350px)',
                                                        minHeight: '400px',
                                                        overflowY: 'auto',
                                                        overflowX: 'hidden',
                                                        WebkitOverflowScrolling: 'touch',
                                                        overscrollBehavior: 'contain'
                                                    }}
                                                >
                                                    {filteredMembers.length === 0 ? (
                                                        <div className="text-center py-8">
                                                            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                                                            <p className="text-gray-500 text-sm">
                                                                {filterCampusId === 'all'
                                                                    ? 'Nenhum membro ativo encontrado.'
                                                                    : 'Nenhum membro encontrado para este campus.'
                                                                }
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-100 pb-32 sm:pb-6">
                                                            {filteredMembers.map(member => {
                                                                const isSelected = selectedMemberIds?.includes(member.id) || false;

                                                                return (
                                                                    <div key={member.id} className="relative">
                                                                        <div className="p-2 sm:p-4 hover:bg-gray-50 transition-colors">
                                                                            <div className="flex items-start space-x-2 sm:space-x-3">
                                                                                <div className="flex items-center h-5 pt-0.5">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                                        checked={isSelected}
                                                                                        onChange={() => handleMemberToggle(member.id)}
                                                                                    />
                                                                                </div>

                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                                                                                                {member.name}
                                                                                            </p>
                                                                                            <p className="text-xs text-gray-500 truncate">
                                                                                                {member.email}
                                                                                            </p>
                                                                                            {member.campus?.name && (
                                                                                                <p className="text-xs text-blue-600 truncate mt-0.5">
                                                                                                    📍 {member.campus.name}
                                                                                                </p>
                                                                                            )}
                                                                                        </div>

                                                                                        {isSelected && (
                                                                                            <div className="flex items-center text-xs text-green-600 bg-green-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ml-2 flex-shrink-0">
                                                                                                <Settings className="w-3 h-3 sm:mr-1" />
                                                                                                <span className="hidden sm:inline">Selecionado</span>
                                                                                            </div>
                                                                                        )}
                                                                                    </div>

                                                                                    {/* Seletor de Funções - Otimizado */}
                                                                                    {isSelected && (
                                                                                        <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                                                                                            <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-1">
                                                                                                <Settings className="w-2.5 h-2.5 inline mr-0.5" />
                                                                                                Funções:
                                                                                            </label>
                                                                                            <MemberFunctionSelector
                                                                                                member={member}
                                                                                                selectedFunctions={memberFunctions[member.id] || []}
                                                                                                onChange={handleMemberFunctionChange}
                                                                                                isLastInList={filteredMembers.indexOf(member) === filteredMembers.length - 1}
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {(!selectedMemberIds || selectedMemberIds.length === 0) && (
                                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                    <div className="flex">
                                                        <div className="flex-shrink-0">
                                                            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <div className="ml-3">
                                                            <p className="text-sm text-yellow-800">
                                                                Selecione pelo menos um membro para a escala.
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Footer com botões */}
                                <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-6 py-4 sm:py-4 mt-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center space-y-2 sm:space-y-0">
                                        <div className="flex space-x-3 order-2 sm:order-1">
                                            {activeTab === 'members' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('details')}
                                                    className="btn btn-outline flex-1 sm:flex-initial text-sm py-2"
                                                >
                                                    Voltar aos Detalhes
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex space-x-3 order-1 sm:order-2">
                                            <button
                                                type="submit"
                                                disabled={loading || !selectedMemberIds || selectedMemberIds.length === 0 || !selectedDate || !selectedTime}
                                                className="btn btn-primary flex-1 sm:flex-initial text-sm py-2"
                                            >
                                                {loading ? (
                                                    <div className="flex items-center justify-center">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                        Salvando...
                                                    </div>
                                                ) : (
                                                    schedule ? 'Atualizar Escala' : 'Criar Escala'
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleForm;