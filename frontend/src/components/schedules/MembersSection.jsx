import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Users, Filter } from 'lucide-react';
import ConfirmationBadge from '../common/ConfirmationBadge';

const MembersSection = ({ members = [], scheduleId, onRefresh }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed'

  // Contar membros por status
  const memberCounts = members.reduce((acc, member) => {
    const status = member.confirmationStatus || 'PENDING';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const totalMembers = members.length;
  const pendingCount = memberCounts.PENDING || 0;
  const confirmedCount = memberCounts.CONFIRMED || 0;
  const unavailableCount = memberCounts.UNAVAILABLE || 0;

  // Filtrar membros baseado no filtro selecionado
  const filteredMembers = members.filter(member => {
    const status = member.confirmationStatus || 'PENDING';
    
    switch (filter) {
      case 'pending':
        return status === 'PENDING';
      case 'confirmed':
        return status === 'CONFIRMED';
      case 'unavailable':
        return status === 'UNAVAILABLE';
      default:
        return true;
    }
  });

  const getFilterButtonClass = (filterValue) => {
    const baseClass = 'px-3 py-1 text-sm font-medium rounded-md transition-colors';
    
    if (filter === filterValue) {
      switch (filterValue) {
        case 'pending':
          return `${baseClass} bg-gray-100 text-gray-800 border border-gray-300`;
        case 'confirmed':
          return `${baseClass} bg-green-100 text-green-800 border border-green-300`;
        case 'unavailable':
          return `${baseClass} bg-red-100 text-red-800 border border-red-300`;
        default:
          return `${baseClass} bg-blue-100 text-blue-800 border border-blue-300`;
      }
    }
    
    return `${baseClass} bg-white text-gray-600 border border-gray-300 hover:bg-gray-50`;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header do dropdown */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Users className="h-5 w-5 text-gray-400" />
          <span className="font-medium text-gray-900">
            Membros Escalados ({totalMembers})
          </span>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Badges de contagem */}
          <div className="flex items-center space-x-2">
            {pendingCount > 0 && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                {pendingCount} pendente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
            {confirmedCount > 0 && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                {confirmedCount} confirmado{confirmedCount !== 1 ? 's' : ''}
              </span>
            )}
            {unavailableCount > 0 && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                {unavailableCount} indisponível{unavailableCount !== 1 ? 'eis' : ''}
              </span>
            )}
          </div>
          
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Conteúdo expandido */}
      {isExpanded && (
        <div className="border-t border-gray-200">
          {/* Filtros */}
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 mr-2">Filtrar por:</span>
              
              <button
                onClick={() => setFilter('all')}
                className={getFilterButtonClass('all')}
              >
                Todos ({totalMembers})
              </button>
              
              <button
                onClick={() => setFilter('pending')}
                className={getFilterButtonClass('pending')}
              >
                Pendentes ({pendingCount})
              </button>
              
              <button
                onClick={() => setFilter('confirmed')}
                className={getFilterButtonClass('confirmed')}
              >
                Confirmados ({confirmedCount})
              </button>
              
              {unavailableCount > 0 && (
                <button
                  onClick={() => setFilter('unavailable')}
                  className={getFilterButtonClass('unavailable')}
                >
                  Indisponíveis ({unavailableCount})
                </button>
              )}
            </div>
          </div>

          {/* Lista de membros */}
          <div className="p-4">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                  {filter === 'all' 
                    ? 'Nenhum membro escalado' 
                    : `Nenhum membro ${filter === 'pending' ? 'pendente' : filter === 'confirmed' ? 'confirmado' : 'indisponível'}`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {/* Avatar */}
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {(member.user?.name || member.name || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      {/* Info do membro */}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-900">
                            {member.user?.name || member.name}
                          </span>
                          <ConfirmationBadge 
                            status={member.confirmationStatus || 'PENDING'} 
                            size="sm"
                          />
                        </div>
                        
                        {/* Informações adicionais */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-1">
                          {(member.user?.phone || member.phone) && (
                            <span className="text-xs text-gray-500">
                              {member.user?.phone || member.phone}
                            </span>
                          )}
                          
                          {/* Ministério */}
                          {member.user?.ministry && (
                            <span className="text-xs text-blue-600 font-medium">
                              {member.user.ministry.name}
                            </span>
                          )}
                          
                          {/* Funções */}
                          {member.functions && member.functions.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {member.functions.map(f => f.function.name).join(', ')}
                            </span>
                          )}
                        </div>
                        
                        {/* Data de confirmação */}
                        {member.confirmedAt && (
                          <div className="text-xs text-gray-500 mt-1">
                            Confirmado em {new Date(member.confirmedAt).toLocaleDateString('pt-BR')}
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
      )}
    </div>
  );
};

export default MembersSection;