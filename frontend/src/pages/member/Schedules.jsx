import React, { useState } from 'react';
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight, Briefcase, Star, UserCheck } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Loading from '../../components/common/Loading';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MemberSchedules = () => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    // CORREÇÃO: Passando os parâmetros corretamente na URL
    const { data: schedules, loading, refresh } = useApi(
        `/members/schedules?month=${month}&year=${year}`,
        {
            immediate: true,
            // REMOVIDO: dependencies que causavam loops
        }
    );

    const handlePreviousMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    // ADICIONADO: Força atualização quando o mês/ano mudar
    React.useEffect(() => {
        console.log('Mês/ano alterado:', { month, year });
        refresh();
    }, [month, year, refresh]);

    if (loading) {
        return <Loading fullScreen />;
    }

    const monthSchedules = schedules || [];
    const currentMonthName = format(currentDate, 'MMMM yyyy', { locale: ptBR });

    // DEBUG: Log para verificar os dados
    console.log('Escalas recebidas:', monthSchedules);
    console.log('Mês atual:', month, 'Ano atual:', year);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Minhas Escalas</h1>
                    <p className="text-gray-600">Acompanhe suas escalas de serviço</p>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                    <button
                        onClick={handleToday}
                        className="btn btn-secondary btn-sm"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={refresh}
                        className="btn btn-primary btn-sm"
                    >
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Month Navigation */}
            <div className="card">
                <div className="card-body">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={handlePreviousMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>

                        <h2 className="text-lg font-semibold text-gray-900 capitalize">
                            {currentMonthName}
                        </h2>

                        <button
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                    
                    {/* ADICIONADO: Informações de debug */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mt-2 text-xs text-gray-500 text-center">
                            Debug: Mês {month}/{year} - {monthSchedules.length} escalas encontradas
                        </div>
                    )}
                </div>
            </div>

            {/* Schedules List */}
            <div className="card">
                <div className="card-body">
                    {monthSchedules.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Nenhuma escala neste mês
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Você não possui escalas agendadas para {currentMonthName.toLowerCase()}.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {monthSchedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-3">
                                                <h3 className="text-lg font-medium text-gray-900">
                                                    {schedule.title}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${new Date(schedule.date) < new Date()
                                                        ? 'bg-gray-100 text-gray-800'
                                                        : 'bg-primary-100 text-primary-800'
                                                    }`}>
                                                    {new Date(schedule.date) < new Date() ? 'Concluído' : 'Agendado'}
                                                </span>
                                            </div>

                                            {/* Informações básicas */}
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                                                <div className="flex items-center">
                                                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                                    {format(new Date(schedule.date), "dd/MM/yyyy", { locale: ptBR })}
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                                                    {schedule.time}
                                                </div>
                                                <div className="flex items-center">
                                                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                                    {schedule.location}
                                                </div>
                                            </div>

                                            {/* Informações de ministério e função */}
                                            {schedule.memberInfo && (
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                                    {/* Ministério */}
                                                    <div className="flex items-start">
                                                        <Star className="h-4 w-4 mr-2 text-amber-500 mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Ministério</p>
                                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                                {schedule.memberInfo.ministry?.name || 'Não definido'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Função */}
                                                    <div className="flex items-start">
                                                        <Briefcase className="h-4 w-4 mr-2 text-blue-500 mt-0.5 flex-shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">Função</p>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {schedule.memberInfo.functionNames}
                                                                {schedule.memberInfo.hasMultipleFunctions && (
                                                                    <span className="ml-1 text-xs text-primary-600">
                                                                        (+{schedule.memberInfo.functions.length - 1})
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {schedule.description && (
                                                <p className="mt-3 text-sm text-gray-600">
                                                    {schedule.description}
                                                </p>
                                            )}

                                            {/* Versão mobile compacta */}
                                            {schedule.memberInfo && (
                                                <div className="sm:hidden mt-3 space-y-2">
                                                    <div className="text-xs text-gray-600">
                                                        <span className="font-medium">Ministério:</span> {schedule.memberInfo.ministry?.name || 'N/A'} • 
                                                        <span className="font-medium">Função:</span> {schedule.memberInfo.functionNames}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberSchedules;