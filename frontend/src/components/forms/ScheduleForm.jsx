import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, MapPin, Users, FileText } from 'lucide-react';
import { adminService } from '../../services/members';
import Loading from '../common/Loading';

const ScheduleForm = ({ schedule, onSubmit, loading }) => {
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(true);

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
            date: schedule?.date ? new Date(schedule.date).toISOString().split('T')[0] : '',
            time: schedule?.time || '',
            location: schedule?.location || '',
            memberIds: schedule?.members?.map(m => m.userId) || []
        }
    });

    const selectedMemberIds = watch('memberIds');

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

    const handleMemberToggle = (memberId) => {
        const currentIds = selectedMemberIds || [];
        const newIds = currentIds.includes(memberId)
            ? currentIds.filter(id => id !== memberId)
            : [...currentIds, memberId];

        setValue('memberIds', newIds);
    };

    if (loadingMembers) {
        return <Loading />;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Date and Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="label">Data</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="date"
                            className={`input pl-10 ${errors.date ? 'input-error' : ''}`}
                            min={new Date().toISOString().split('T')[0]}
                            {...register('date', {
                                required: 'Data é obrigatória'
                            })}
                        />
                    </div>
                    {errors.date && (
                        <p className="error-message">{errors.date.message}</p>
                    )}
                </div>

                <div>
                    <label className="label">Horário</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Clock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="time"
                            className={`input pl-10 ${errors.time ? 'input-error' : ''}`}
                            {...register('time', {
                                required: 'Horário é obrigatório'
                            })}
                        />
                    </div>
                    {errors.time && (
                        <p className="error-message">{errors.time.message}</p>
                    )}
                </div>
            </div>

            {/* Location Field */}
            <div>
                <label className="label">Local</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className={`input pl-10 ${errors.location ? 'input-error' : ''}`}
                        placeholder="Ex: Igreja Central, Auditório Principal"
                        {...register('location', {
                            required: 'Local é obrigatório'
                        })}
                    />
                </div>
                {errors.location && (
                    <p className="error-message">{errors.location.message}</p>
                )}
            </div>

            {/* Members Selection */}
            <div>
                <label className="label flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Membros Escalados
                </label>
                <div className="mt-2 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-3">
                    {members.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            Nenhum membro ativo encontrado
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {members.map((member) => (
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
                    disabled={loading || !selectedMemberIds || selectedMemberIds.length === 0}
                    className="btn btn-primary"
                >
                    {loading ? 'Salvando...' : (schedule ? 'Atualizar Escala' : 'Criar Escala')}
                </button>
            </div>
        </form>
    );
};

export default ScheduleForm;
