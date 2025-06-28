import React from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import Loading from '../../components/common/Loading';
import { format, isToday, isTomorrow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MemberDashboard = () => {
    // REMOVIDO: dependencies e onSuccess que causavam loops
    const { data: upcomingSchedules, loading: loadingSchedules } = useApi('/schedules');
    const { data: profile, loading: loadingProfile } = useApi('/members/profile');

    if (loadingProfile || loadingSchedules) {
        return <Loading fullScreen />;
    }

    // Filtrar próximas escalas no componente, não no hook
    const filteredSchedules = upcomingSchedules?.filter(schedule =>
        new Date(schedule.date) >= new Date()
    ).slice(0, 5) || [];

    const getDateLabel = (date) => {
        const scheduleDate = new Date(date);
        if (isToday(scheduleDate)) return 'Hoje';
        if (isTomorrow(scheduleDate)) return 'Amanhã';
        return format(scheduleDate, "dd/MM/yyyy", { locale: ptBR });
    };

    const getDateClass = (date) => {
        const scheduleDate = new Date(date);
        if (isToday(scheduleDate)) return 'bg-danger-100 text-danger-800';
        if (isTomorrow(scheduleDate)) return 'bg-warning-100 text-warning-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">
                    Bem-vindo(a), {profile?.name || 'Usuário'}!
                </h1>
                <p className="text-primary-100">
                    Acompanhe suas escalas e gerencie sua disponibilidade
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Calendar className="h-8 w-8 text-primary-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {filteredSchedules.length}
                                </div>
                                <div className="text-sm text-gray-600">Próximas Escalas</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <CheckCircle className="h-8 w-8 text-success-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">
                                    {profile?.status === 'ACTIVE' ? 'Ativo' : 'Pendente'}
                                </div>
                                <div className="text-sm text-gray-600">Status da Conta</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <Clock className="h-8 w-8 text-warning-600" />
                            </div>
                            <div className="ml-4">
                                <div className="text-2xl font-bold text-gray-900">0</div>
                                <div className="text-sm text-gray-600">Indisponibilidades</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Schedules */}
            <div className="card">
                <div className="card-header">
                    <h2 className="text-lg font-medium text-gray-900">Próximas Escalas</h2>
                </div>
                <div className="card-body">
                    {filteredSchedules.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                Nenhuma escala próxima
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Você não possui escalas agendadas no momento.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredSchedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <Calendar className="h-8 w-8 text-primary-600" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {schedule.title}
                                            </h3>
                                            <div className="flex items-center mt-1 space-x-4 text-sm text-gray-600">
                                                <span className="flex items-center">
                                                    <Clock className="h-4 w-4 mr-1" />
                                                    {schedule.time}
                                                </span>
                                                <span>{schedule.location}</span>
                                            </div>
                                            {schedule.description && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {schedule.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDateClass(schedule.date)}`}>
                                            {getDateLabel(schedule.date)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Minhas Escalas
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Veja todas as suas escalas passadas e futuras
                                </p>
                            </div>
                            <a
                                href="/member/schedules"
                                className="btn btn-primary btn-sm"
                            >
                                Ver Escalas
                            </a>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="card-body">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium text-gray-900">
                                    Disponibilidade
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Defina quando você está disponível para servir
                                </p>
                            </div>
                            <a
                                href="/member/availability"
                                className="btn btn-secondary btn-sm"
                            >
                                Gerenciar
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Status Alert */}
            {profile?.status === 'PENDING' && (
                <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <AlertTriangle className="h-5 w-5 text-warning-400" />
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-warning-800">
                                Conta Aguardando Aprovação
                            </h3>
                            <div className="mt-2 text-sm text-warning-700">
                                <p>
                                    Sua conta está aguardando aprovação de um administrador.
                                    Você receberá uma notificação quando sua conta for aprovada.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberDashboard;