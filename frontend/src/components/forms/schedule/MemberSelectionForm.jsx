import React from 'react';
import { Users, UserCheck, Settings } from 'lucide-react';

/**
 * Componente para seleção de membros
 * Responsável pela lista e filtros de membros
 */
const MemberSelectionForm = ({
  filteredMembers,
  selectedMemberIds,
  onMemberToggle,
  filterCampusId,
  setFilterCampusId,
  campuses,
  members,
  getMembersCountForCampus
}) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <Users className="w-5 h-5 mr-2" />
          Seleção de Membros
        </h3>
        <p className="text-sm text-gray-500">
          Escolha os membros que participarão desta escala.
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
          {selectedMemberIds && selectedMemberIds.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              {selectedMemberIds.length} membro{selectedMemberIds.length > 1 ? 's' : ''} selecionado{selectedMemberIds.length > 1 ? 's' : ''}
            </p>
          )}
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
                const isSelected = selectedMemberIds?.includes(member.id) || false;

                return (
                  <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          checked={isSelected}
                          onChange={() => onMemberToggle(member.id)}
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
                              {member.ministry?.name && (
                                <span className="ml-2 text-purple-600">
                                  🙏 {member.ministry.name}
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

                        {/* Informações adicionais do membro quando selecionado */}
                        {isSelected && (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <p className="text-xs text-green-700">
                              ✓ Membro incluído na escala
                            </p>
                            {member._count?.schedules > 0 && (
                              <p className="text-xs text-gray-600 mt-1">
                                Participou de {member._count.schedules} escala{member._count.schedules > 1 ? 's' : ''} anteriormente
                              </p>
                            )}
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

      {/* Dica para usuário */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <UserCheck className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Dica para Seleção
            </h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use o filtro por campus para encontrar membros específicos</li>
                <li>Membros selecionados podem ter funções atribuídas na próxima etapa</li>
                <li>Verifique se os membros não têm conflitos na data escolhida</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSelectionForm;