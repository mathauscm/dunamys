// frontend/src/pages/member/Availability.jsx - COMPLETO
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Plus, Trash2, AlertCircle } from 'lucide-react';
import { useApi, useMutation } from '../../hooks/useApi';
import { memberService } from '../../services/members';
import Loading from '../../components/common/Loading';
import Modal from '../../components/common/Modal';
import { DateRangePicker } from '../../components/forms/DateTimePicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MemberAvailability = () => {
    const [showModal, setShowModal] = useState(false);
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const { data: unavailabilities, loading, refresh } = useApi('/members/unavailability');

    const { mutate: createUnavailability, loading: creating } = useMutation(
        memberService.setUnavailability,
        {
            onSuccess: () => {
                setShowModal(false);
                setStartDate(null);
                setEndDate(null);
                refresh();
            }
        }
    );

    const { mutate: removeUnavailability } = useMutation(
        memberService.removeUnavailability,
        {
            onSuccess: refresh
        }
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        // Validar se as datas foram selecionadas
        if (!startDate) {
            alert('Por favor, selecione a data de início');
            return;
        }
        if (!endDate) {
            alert('Por favor, selecione a data de fim');
            return;
        }

        const formData = {
            startDate: startDate.toISOString().split('T')[0], // YYYY-MM-DD
            endDate: endDate.toISOString().split('T')[0], // YYYY-MM-DD
            reason: data.reason?.trim() || undefined
        };

        await createUnavailability(formData);
        reset();
    };

    const handleRemove = async (id) => {
        if (window.confirm('Tem certeza que deseja remover esta indisponibilidade?')) {
            await removeUnavailability(id);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setStartDate(null);
        setEndDate(null);
        reset();
    };

    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Disponibilidade</h1>
                    <p className="text-gray-600">Defina os períodos em que você não pode servir</p>
                </div>

                <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-primary flex items-center mt-4 sm:mt-0"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Indisponibilidade
                </button>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertCircle className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">Como funciona?</h3>
                        <div className="mt-2 text-sm text-blue-700">
                            <p>
                                Defina os períodos em que você não estará disponível para servir.
                                Os administradores serão notificados e não irão escalá-lo durante estes períodos.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Unavailabilities List */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-medium text-gray-900">Indisponibilidades</h2>
                </div>
                <div className="card-body">
                    {!unavailabilities || unavailabilities.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Nenhuma indisponibilidade cadastrada
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Você ainda não definiu períodos de indisponibilidade.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {unavailabilities.map((unavailability) => (
                                <div
                                    key={unavailability.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-4 text-sm">
                                            <span className="font-medium text-gray-900">
                                                {format(new Date(unavailability.startDate), "dd/MM/yyyy", { locale: ptBR })}
                                            </span>
                                            <span className="text-gray-500">até</span>
                                            <span className="font-medium text-gray-900">
                                                {format(new Date(unavailability.endDate), "dd/MM/yyyy", { locale: ptBR })}
                                            </span>
                                        </div>
                                        {unavailability.reason && (
                                            <p className="mt-1 text-sm text-gray-600">
                                                {unavailability.reason}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => handleRemove(unavailability.id)}
                                        className="ml-4 p-2 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for creating unavailability */}
            <Modal
                isOpen={showModal}
                onClose={handleCloseModal}
                title="Nova Indisponibilidade"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Date Range - USANDO COMPONENTE OTIMIZADO */}
                    <DateRangePicker
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        startLabel="Data Início"
                        endLabel="Data Fim"
                        startPlaceholder="Selecione a data de início"
                        endPlaceholder="Selecione a data de fim"
                        required={true}
                        startError={!startDate && 'Data de início é obrigatória'}
                        endError={!endDate && 'Data de fim é obrigatória'}
                    />

                    <div>
                        <label className="label">Motivo (Opcional)</label>
                        <textarea
                            className="input min-h-[100px] resize-vertical"
                            placeholder="Ex: Viagem, compromisso pessoal..."
                            {...register('reason', {
                                setValueAs: value => value?.trim() || undefined
                            })}
                        />
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn btn-secondary"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={creating || !startDate || !endDate}
                            className="btn btn-primary"
                        >
                            {creating ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default MemberAvailability;