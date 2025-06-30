import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Users, FileText } from 'lucide-react';
import { adminService } from '../../services/members';
import Loading from '../common/Loading';
import { DateTimePicker } from './DateTimePicker';
import { api } from '../../services/api';

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

    // Carrega membros
    useEffect(() => {
        const fetchMembers = async () => {
            try {
                const response = await adminService.getMembers({ status: 'ACTIVE', limit: 100 });
                console.log('🔍 Membros carregados:', response.members);
                
                // Log detalhado dos membros para debug
                response.members.forEach(member => {
                    const campusIdFromField = member.campusId;
                    const campusIdFromObject = member.campus?.id;
                    const campusName = member.campus?.name;
                    
                    console.log(`Membro: ${member.name}`);
                    console.log(`  - campusId (campo): ${campusIdFromField}`);
                    console.log(`  - campus.id: ${campusIdFromObject}`);
                    console.log(`  - campus.name: ${campusName}`);
                });
                
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
                console.log('🏫 Campus carregados:', response.data);
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
        // Primeiro tenta usar o campo campusId
        if (member.campusId !== null && member.campusId !== undefined) {
            return member.campusId;
        }
        
        // Fallback: usar campus.id se disponível
        if (member.campus && member.campus.id !== null && member.campus.id !== undefined) {
            return member.campus.id;
        }
        
        return null;
    };

    // FILTRO ROBUSTO: Com fallback para campus.id
    const filteredMembers = React.useMemo(() => {
        if (filterCampusId === 'all') {
            console.log('🔍 Exibindo todos os membros:', members.length);
            return members;
        }
        
        // Converter para número para comparação
        const campusIdToFilter = parseInt(filterCampusId, 10);
        
        const filtered = members.filter(member => {
            const memberCampusId = getMemberCampusId(member);
            
            console.log(`Comparando membro ${member.name}:`);
            console.log(`  - Campus ID do membro: ${memberCampusId} (tipo: ${typeof memberCampusId})`);
            console.log(`  - Filtro: ${campusIdToFilter} (tipo: ${typeof campusIdToFilter})`);
            
            if (memberCampusId === null || memberCampusId === undefined) {
                console.log(`  - ❌ Membro sem campus`);
                return false;
            }
            
            const matches = parseInt(memberCampusId, 10) === campusIdToFilter;
            console.log(`  - ${matches ? '✅' : '❌'} Resultado: ${matches}`);
            
            return matches;
        });
        
        console.log(`🔍 Filtro aplicado - Campus ID: ${campusIdToFilter}, Membros filtrados: ${filtered.length}`);
        console.log('Membros filtrados:', filtered.map(m => ({ 
            name: m.name, 
            campusId: getMemberCampusId(m), 
            campusName: m.campus?.name 
        })));
        
        return filtered;
    }, [members, filterCampusId]);

    // CONTADOR DE MEMBROS POR CAMPUS: Usando a função helper
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
    };

    const handleFormSubmit = (data) => {
        // Validar se data e hora foram selecionadas
        if (!selectedDate) {
            alert('Por favor, selecione uma data');
            return;
        }
        if (!selectedTime) {
            alert('Por favor, selecione um horário');
            return;
        }

        const formData = {
            ...data,
            date: selectedDate.toISOString().split('T')[0], // YYYY-MM-DD
            time: selectedTime
        };

        onSubmit(formData);
    };

    // Log do estado atual para debug
    useEffect(() => {
        console.log('📊 Estado atual do filtro:', {
            filterCampusId,
            totalMembers: members.length,
            filteredMembers: filteredMembers.length,
            campuses: campuses.length
        });
    }, [filterCampusId, members.length, filteredMembers.length, campuses.length]);

    if (loadingMembers || loadingCampuses) {
        return <Loading />;
    }

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Title Field */}
            <div>
                <label className="label">Título da Escala</label>
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

            {/* Description Field */}
            <div>
                <label className="label">Descrição (Opcional)</label>
                <textarea
                    className="input min-h-[100px] resize-vertical"
                    placeholder="Descrição adicional sobre a escala..."
                    {...register('description')}
                />
            </div>

            {/* Date and Time */}
            <DateTimePicker
                dateValue={selectedDate}
                timeValue={selectedTime}
                onDateChange={setSelectedDate}
                onTimeChange={setSelectedTime}
                dateLabel="Data"
                timeLabel="Horário"
                required={true}
                dateError={!selectedDate && 'Data é obrigatória'}
                timeError={!selectedTime && 'Horário é obrigatório'}
            />

            {/* Campus Field */}
            <div>
                <label className="label">Campus</label>
                <select
                    className={`input ${errors.location ? 'input-error' : ''}`}
                    {...register('location', { required: 'Campus é obrigatório' })}
                    disabled={loadingCampuses}
                    defaultValue=""
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

            {/* Filtro de membros por campus - MELHORADO */}
            <div>
                <label className="label">
                    Filtrar membros por campus
                    <span className="text-xs text-gray-500 font-normal ml-2">
                        ({filteredMembers.length} membro{filteredMembers.length !== 1 ? 's' : ''} encontrado{filteredMembers.length !== 1 ? 's' : ''})
                    </span>
                </label>
                <select
                    className="input"
                    value={filterCampusId}
                    onChange={(e) => {
                        console.log('🔄 Alterando filtro para:', e.target.value);
                        setFilterCampusId(e.target.value);
                    }}
                >
                    <option value="all">Todos os membros ({members.length})</option>
                    {campuses.map(campus => {
                        // Contar membros deste campus usando a função helper
                        const membersInCampus = getMembersCountForCampus(campus.id);
                        
                        return (
                            <option key={campus.id} value={String(campus.id)}>
                                {campus.name}{campus.city ? ` - ${campus.city}` : ''} ({membersInCampus})
                            </option>
                        );
                    })}
                </select>
                

            </div>

            {/* Lista de membros disponíveis - MELHORADA */}
            <div>
                <label className="label flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Membros Disponíveis
                    {filterCampusId !== 'all' && (
                        <span className="ml-2 text-xs text-blue-600">
                            (Filtrados por campus)
                        </span>
                    )}
                </label>
                
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {filteredMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-gray-500 text-sm">
                                {filterCampusId === 'all' 
                                    ? 'Nenhum membro ativo encontrado'
                                    : `Nenhum membro encontrado no campus selecionado`
                                }
                            </p>
                            {filterCampusId !== 'all' && (
                                <button
                                    type="button"
                                    onClick={() => setFilterCampusId('all')}
                                    className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Ver todos os membros
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredMembers.map((member) => {
                                const memberCampusId = getMemberCampusId(member);
                                
                                return (
                                    <label
                                        key={member.id}
                                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                            checked={selectedMemberIds?.includes(member.id) || false}
                                            onChange={() => handleMemberToggle(member.id)}
                                        />
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">
                                                {member.name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {member.email}
                                                {/* Mostrar informações do campus - melhorado */}
                                                {member.campus?.name && (
                                                    <span className="ml-2 text-blue-600">
                                                        📍 {member.campus.name}
                                                    </span>
                                                )}
                                                {!member.campus?.name && memberCampusId && (
                                                    <span className="ml-2 text-orange-600">
                                                        📍 Campus ID: {memberCampusId}
                                                    </span>
                                                )}
                                                {memberCampusId === null && (
                                                    <span className="ml-2 text-gray-400">
                                                        📍 Sem campus
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {(!selectedMemberIds || selectedMemberIds.length === 0) && (
                    <p className="text-danger-600 text-sm mt-1">
                        Selecione pelo menos um membro
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
                <button
                    type="submit"
                    disabled={loading || !selectedMemberIds || selectedMemberIds.length === 0 || !selectedDate || !selectedTime}
                    className="btn btn-primary"
                >
                    {loading ? 'Salvando...' : (schedule ? 'Atualizar Escala' : 'Criar Escala')}
                </button>
            </div>
        </form>
    );
};

export default ScheduleForm;