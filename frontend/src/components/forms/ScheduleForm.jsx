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
            // O campo "location" armazena o nome do campus, mantendo compatibilidade com seu uso atual
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
                setCampuses([]);
            } finally {
                setLoadingCampuses(false);
            }
        };
        fetchCampuses();
    }, []);

    // Filtro robusto por campusId (de membro) igual ao id do campus selecionado
    const filteredMembers = filterCampusId === 'all'
        ? members
        : members.filter(m => m.campusId && String(m.campusId) === String(filterCampusId));

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

            {/* Filtro de membros por campus */}
            <div>
                <label className="label">Filtrar membros por campus</label>
                <select
                    className="input"
                    value={filterCampusId}
                    onChange={e => setFilterCampusId(e.target.value)}
                >
                    <option value="all">Todos os membros</option>
                    {campuses.map(campus => (
                        <option key={campus.id} value={String(campus.id)}>
                            {campus.name}{campus.city ? ` - ${campus.city}` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Lista de membros disponíveis */}
            <div>
                <label className="label flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Membros Disponíveis
                </label>
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {filteredMembers.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            Nenhum membro disponível encontrado
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {filteredMembers.map((member) => (
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
                                            {/* Exibe o campus do membro para debug/clareza */}
                                            {member.campus && member.campus.name
                                                ? <span style={{marginLeft: 8, color: '#bbb'}}>({member.campus.name})</span>
                                                : member.campusId && campuses.find(c => c.id === member.campusId)
                                                    ? <span style={{marginLeft: 8, color: '#bbb'}}>({campuses.find(c => c.id === member.campusId).name})</span>
                                                    : null
                                            }
                                        </div>
                                    </div>
                                </label>
                            ))}
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