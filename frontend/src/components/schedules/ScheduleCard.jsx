import React from 'react';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, Send } from 'lucide-react';

// Mapeamento de ícones para funções
const iconMap = {
    'car': '🚗',
    'heart': '❤️',
    'users': '👥',
    'dollar-sign': '💰',
    'coffee': '☕',
    'utensils': '🍽️',
    'instagram': '📱',
    'projector': '📽️',
    'camera': '📷',
    'video': '🎥',
    'radio': '📻',
    'briefcase': '📋'
};

const ScheduleCard = ({ 
    schedule, 
    onEdit, 
    onDelete, 
    onSendNotification, 
    isAdmin = false 
}) => {
    const scheduleDate = new Date(schedule.date);
    const today = new Date();
    const isPast = scheduleDate < today;

    const renderIcon = (iconName) => {
        return iconMap[iconName] || iconMap['briefcase'];
    };

    const renderMemberWithFunctions = (member) => {
        const memberFunctions = member.functions || [];
        
        return (
            <div key={member.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                        <span className="text-primary-600 text-sm font-medium">
                            {member.user.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.user.name}</div>
                        
                        {/* NOVO: Exibir funções do membro */}
                        {memberFunctions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                                {memberFunctions.map((memberFunc) => (
                                    <span
                                        key={memberFunc.id}
                                        className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                                        title={`${memberFunc.function.group.name}: ${memberFunc.function.description || ''}`}
                                    >
                                        <span className="mr-1">{renderIcon(memberFunc.function.icon)}</span>
                                        {memberFunc.function.name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Indicador de status para membros sem função definida */}
                {memberFunctions.length === 0 && (
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                        Sem função
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className={`card ${isPast ? 'opacity-75' : ''}`}>
            <div className="card-header">
                <div className="flex justify-between items-start">
                    <div className="flex-1">
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            {schedule.title}
                            {isPast && (
                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    Finalizada
                                </span>
                            )}
                        </h3>
                        {schedule.description && (
                            <p className="text-sm text-gray-600 mb-2">{schedule.description}</p>
                        )}
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {scheduleDate.toLocaleDateString('pt-BR')}
                            </div>
                            <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {schedule.time}
                            </div>
                            {schedule.location && (
                                <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {schedule.location}
                                </div>
                            )}
                            <div className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {schedule.members?.length || 0} {schedule.members?.length === 1 ? 'membro' : 'membros'}
                            </div>
                        </div>
                    </div>

                    {isAdmin && (
                        <div className="flex space-x-2 ml-4">
                            <button
                                onClick={() => onSendNotification(schedule)}
                                className="btn btn-sm btn-outline"
                                title="Enviar notificação"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onEdit(schedule)}
                                className="btn btn-sm btn-secondary"
                                title="Editar escala"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onDelete(schedule)}
                                className="btn btn-sm btn-danger"
                                title="Excluir escala"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="card-body">
                {schedule.members && schedule.members.length > 0 ? (
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Membros Escalados:
                        </h4>
                        <div className="space-y-0">
                            {schedule.members.map(renderMemberWithFunctions)}
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 text-gray-500">
                        <Users className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm">Nenhum membro escalado</p>
                    </div>
                )}

                {/* NOVO: Resumo de funções por grupo */}
                {schedule.members && schedule.members.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <FunctionSummary members={schedule.members} />
                    </div>
                )}
            </div>
        </div>
    );
};

// NOVO: Componente para resumir funções por grupo
const FunctionSummary = ({ members }) => {
    const functionGroups = {};
    
    // Agrupar funções por grupo
    members.forEach(member => {
        if (member.functions && member.functions.length > 0) {
            member.functions.forEach(memberFunc => {
                const groupName = memberFunc.function.group.name;
                if (!functionGroups[groupName]) {
                    functionGroups[groupName] = [];
                }
                functionGroups[groupName].push({
                    functionName: memberFunc.function.name,
                    icon: memberFunc.function.icon,
                    memberName: member.user.name
                });
            });
        }
    });

    const groupNames = Object.keys(functionGroups);
    
    if (groupNames.length === 0) {
        return null;
    }

    return (
        <div>
            <h5 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
                Resumo por Função
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {groupNames.map(groupName => (
                    <div key={groupName} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-medium text-gray-700 mb-2">
                            {groupName}
                        </div>
                        <div className="space-y-1">
                            {functionGroups[groupName].map((item, index) => (
                                <div key={index} className="flex items-center text-xs text-gray-600">
                                    <span className="mr-2">{iconMap[item.icon] || '📋'}</span>
                                    <span className="font-medium mr-1">{item.functionName}:</span>
                                    <span>{item.memberName}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ScheduleCard;