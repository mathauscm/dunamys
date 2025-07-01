{activeTab === 'members' && (
                                    <div className="space-y-6">
                                        <div className="mb-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                                <Users className="w-5 h-5 mr-2 text-primary-600" />
                                                Seleção de Membros e Funções
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Escolha os membros e defina suas funções específicas na escala.
                                            </p>
                                        </div>

                                        {/* Filtro por Campus - melhorado */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                                            <div className="flex items-center justify-between mb-3">
                                                <label className="text-sm font-medium text-gray-700 flex items-center">
                                                    <MapPin className="w-4 h-4 mr-2" />
                                                    Filtrar por campus
                                                </label>
                                                <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full">
                                                    {filteredMembers.length} encontrado{filteredMembers.length !== 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <select
                                                className="input w-full max-w-md"
                                                value={filterCampusId}
                                                onChange={(e) => setFilterCampusId(e.target.value)}
                                            >
                                                <option value="all">Todos os membros ({members.length})</option>
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

                                        {/* Lista de Membros - layout em grid */}
                                        <div className="bg-white rounded-lg border border-gray-200">
                                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                                <h4 className="text-sm font-medium text-gray-900 flex items-center">
                                                    <UserCheck className="w-4 h-4 mr-2" />
                                                    Membros Disponíveis
                                                    {filterCampusId !== 'all' && (
                                                        <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                                            Filtro ativo
                                                        </span>
                                                    )}
                                                </h4>
                                            </div>

                                            <div className="max-h-96 overflow-y-auto">
                                                {filteredMembers.length === 0 ? (
                                                    <div className="text-center py-12">
                                                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                        <h4 className="text-sm font-medium text-gray-900 mb-2">Nenhum membro encontrado</h4>
                                                        <p className="text-sm text-gray-500">
                                                            {filterCampusId === 'all' 
                                                                ? 'Não há membros ativos no sistema.'
                                                                : 'Não há membros ativos neste campus. Tente outro filtro.'
                                                            }
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-gray-100">
                                                        {filteredMembers.map(member => {
                                                            const memberCampusId = getMemberCampusId(member);
                                                            const isSelected = selectedMemberIds?.includes(member.id) || false;
                                                            
                                                            return (
                                                                <div key={member.id} className={`p-4 transition-colors ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                                                    <div className="flex items-start space-x-3">
                                                                        <div className="flex items-center h-5 pt-1">
                                                                            <input
                                                                                type="checkbox"
                                                                                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                                checked={isSelected}
                                                                                onChange={() => handleMemberToggle(member.id)}
                                                                            />
                                                                        </div>
                                                                        
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <div>
                                                                                    <p className="text-sm font-medium text-gray-900">
                                                                                        {member.name}
                                                                                    </p>
                                                                                    <p className="text-xs text-gray-500 truncate">
                                                                                        {member.email}
                                                                                    </p>
                                                                                    <div className="flex items-center mt-1">
                                                                                        {member.campus?.name && (
                                                                                            <span className="inline-flex items-center text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                                                                                <MapPin className="w-3 h-3 mr-1" />
                                                                                                {member.campus.name}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                
                                                                                {isSelected && (
                                                                                    <div className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                                                        <Settings className="w-3 h-3 mr-1" />
                                                                                        Selecionado
                                                                                    </div>
                                                                                )}
                                                                            </div>

                                                                            {/* Seletor de Funções - Otimizado */}
                                                                            {isSelected && (
                                                                                <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                                                                    <div className="flex items-center mb-2">
                                                                                        <Settings className="w-4 h-4 mr-2 text-primary-600" />
                                                                                        <label className="text-xs font-medium text-gray-700">
                                                                                            Funções do membro:
                                                                                        </label>
                                                                                    </div>
                                                                                    <MemberFunctionSelector
                                                                                        member={member}
                                                                                        selectedFunctions={memberFunctions[member.id] || []}
                                                                                        onChange={handleMemberFunctionChange}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Alerta se nenhum membro selecionado */}
                                        {(!selectedMemberIds || selectedMemberIds.length === 0) && (
                                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                // frontend/src/components/forms/ScheduleForm.jsx - DESIGN MELHORADO

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
import { DateTimePicker } from './DateTimePicker';
import { api } from '../../services/api';
import MemberFunctionSelector from './MemberFunctionSelector';
import { toast } from 'react-hot-toast';

const ScheduleForm = ({ schedule, onSubmit, loading }) => {
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

    // NOVO: Estado para as funções dos membros
    const [memberFunctions, setMemberFunctions] = useState({});

    // NOVO: Estado para abas
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

    // Função para atualizar as funções de um membro
    const handleMemberFunctionChange = (memberId, functionIds) => {
        setMemberFunctions(prev => ({
            ...prev,
            [memberId]: functionIds
        }));
    };

    // Carrega membros
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                setLoadingMembers(true);
                const response = await adminService.getMembers({ status: 'ACTIVE', limit: 100 });
                setMembers(response.members);
            } catch (error) {
                console.error('Erro ao carregar membros:', error);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, []);

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
            const newMemberFunctions = { ...memberFunctions };
            delete newMemberFunctions[memberId];
            setMemberFunctions(newMemberFunctions);
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
        <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="flex items-center justify-center min-h-screen p-4">
                <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
                
                {/* Modal com tamanho fixo e mais largo */}
                <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-[85vh] flex overflow-hidden">
                    {/* Header fixo */}
                    <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {schedule ? 'Editar Escala' : 'Nova Escala'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Configure os detalhes e selecione os membros
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Conteúdo principal com padding-top para o header fixo */}
                    <div className="flex w-full pt-20">
                        {/* Sidebar de Navegação - largura fixa */}
                        <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
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

                        {/* Conteúdo Principal - área fixa */}
                        <div className="flex-1 flex flex-col min-w-0">
                            <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col h-full">
                                {/* Área de Conteúdo - altura fixa com scroll */}
                                <div className="flex-1 overflow-y-auto p-6">{activeTab === 'details' && (
                                    <div className="max-w-4xl space-y-6">
                                        <div className="mb-6">
                                            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                                <FileText className="w-5 h-5 mr-2 text-primary-600" />
                                                Informações da Escala
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                Configure os detalhes básicos da escala de serviço.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Coluna 1 */}
                                            <div className="space-y-6">
                                                {/* Título */}
                                                <div>
                                                    <label className="label">Título da Escala *</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <FileText className="h-5 w-5 text-gray-400" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            className={`input pl-10 ${errors.title ? 'input-error' : ''}`}
                                                            placeholder="Ex: Culto Dominical - Manhã"
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
                                                        <p className="error-message">{errors.title.message}</p>
                                                    )}
                                                </div>

                                                {/* Data e Hora */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="label">
                                                            <Calendar className="w-4 h-4 inline mr-1" />
                                                            Data *
                                                        </label>
                                                        <input
                                                            type="date"
                                                            value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                                                            onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                                                            className="input w-full"
                                                            required
                                                        />
                                                        {!selectedDate && (
                                                            <p className="text-sm text-red-600 mt-1">Data é obrigatória</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="label">
                                                            <Clock className="w-4 h-4 inline mr-1" />
                                                            Horário *
                                                        </label>
                                                        <input
                                                            type="time"
                                                            value={selectedTime}
                                                            onChange={(e) => setSelectedTime(e.target.value)}
                                                            className="input w-full"
                                                            required
                                                        />
                                                        {!selectedTime && (
                                                            <p className="text-sm text-red-600 mt-1">Horário é obrigatório</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Coluna 2 */}
                                            <div className="space-y-6">
                                                {/* Descrição */}
                                                <div>
                                                    <label className="label">Descrição (Opcional)</label>
                                                    <textarea
                                                        className="input h-24 resize-none"
                                                        placeholder="Descrição adicional sobre a escala..."
                                                        {...register('description')}
                                                    />
                                                </div>

                                                {/* Campus */}
                                                <div>
                                                    <label className="label">
                                                        <MapPin className="w-4 h-4 inline mr-1" />
                                                        Campus *
                                                    </label>
                                                    <select
                                                        className={`input ${errors.location ? 'input-error' : ''}`}
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
                                                        <p className="error-message">{errors.location.message}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card de ação */}
                                        <div className="bg-gradient-to-r from-primary-50 to-blue-50 p-6 rounded-lg border border-primary-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-medium text-gray-900">Próximo Passo</h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        Selecione os membros e defina suas funções específicas
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setActiveTab('members')}
                                                    className="btn btn-primary flex items-center"
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
                                <div className="mb-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
                                        <Users className="w-5 h-5 mr-2" />
                                        Seleção de Membros e Funções
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Escolha os membros e defina suas funções específicas.
                                    </p>
                                </div>

                                {/* Filtro por Campus */}
                                <div className="bg-white p-4 rounded-lg border border-gray-200">
                                    <label className="label mb-2">
                                        Filtrar membros por campus
                                        <span className="text-xs text-gray-500 font-normal ml-2">
                                            ({filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''} encontrado{filteredMembers.length !== 1 ? 's' : ''})
                                        </span>
                                    </label>
                                    <select
                                        className="input max-w-sm"
                                        value={filterCampusId}
                                        onChange={(e) => setFilterCampusId(e.target.value)}
                                    >
                                        <option value="all">Todos os membros ({members.length})</option>
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

                                {/* Lista de Membros */}
                                <div className="bg-white rounded-lg border border-gray-200">
                                    <div className="px-4 py-3 border-b border-gray-200">
                                        <h4 className="text-sm font-medium text-gray-900 flex items-center">
                                            <UserCheck className="w-4 h-4 mr-2" />
                                            Membros Disponíveis
                                            {filterCampusId !== 'all' && (
                                                <span className="ml-2 text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                                                    Filtrado por campus
                                                </span>
                                            )}
                                        </h4>
                                    </div>

                                    <div className="max-h-96 overflow-y-auto">
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
                                            <div className="divide-y divide-gray-100">
                                                {filteredMembers.map(member => {
                                                    const memberCampusId = getMemberCampusId(member);
                                                    const isSelected = selectedMemberIds?.includes(member.id) || false;
                                                    
                                                    return (
                                                        <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                                                            <div className="flex items-start space-x-3">
                                                                <div className="flex items-center h-5">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                                                        checked={isSelected}
                                                                        onChange={() => handleMemberToggle(member.id)}
                                                                    />
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center justify-between">
                                                                        <div>
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {member.name}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {member.email}
                                                                                {member.campus?.name && (
                                                                                    <span className="ml-2 text-blue-600">
                                                                                        📍 {member.campus.name}
                                                                                    </span>
                                                                                )}
                                                                            </p>
                                                                        </div>
                                                                        
                                                                        {isSelected && (
                                                                            <div className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                                                                <Settings className="w-3 h-3 mr-1" />
                                                                                Selecionado
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Seletor de Funções - Melhorado */}
                                                                    {isSelected && (
                                                                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                                                                            <label className="block text-xs font-medium text-gray-700 mb-2">
                                                                                <Settings className="w-3 h-3 inline mr-1" />
                                                                                Funções do membro:
                                                                            </label>
                                                                            <MemberFunctionSelector
                                                                                member={member}
                                                                                selectedFunctions={memberFunctions[member.id] || []}
                                                                                onChange={handleMemberFunctionChange}
                                                                            />
                                                                        </div>
                                                                    )}
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
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                        <div className="flex justify-between items-center">
                            <div className="flex space-x-3">
                                {activeTab === 'members' && (
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('details')}
                                        className="btn btn-outline"
                                    >
                                        Voltar aos Detalhes
                                    </button>
                                )}
                            </div>
                            
                            <div className="flex space-x-3">
                                <button
                                    type="submit"
                                    disabled={loading || !selectedMemberIds || selectedMemberIds.length === 0 || !selectedDate || !selectedTime}
                                    className="btn btn-primary"
                                >
                                    {loading ? (
                                        <div className="flex items-center">
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
    );
};

export default ScheduleForm;