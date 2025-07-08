import React from 'react';
import { Settings, UserCheck, CheckCircle } from 'lucide-react';
import MemberFunctionSelector from '../MemberFunctionSelector';

/**
 * Componente para atribuição de funções aos membros
 * Responsável por definir as funções específicas de cada membro selecionado
 */
const FunctionAssignmentForm = ({
  selectedMembers,
  memberFunctions,
  onMemberFunctionChange
}) => {
  const membersWithFunctions = selectedMembers.filter(member => 
    memberFunctions[member.id] && memberFunctions[member.id].length > 0
  );

  const membersWithoutFunctions = selectedMembers.filter(member => 
    !memberFunctions[member.id] || memberFunctions[member.id].length === 0
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Atribuição de Funções
        </h3>
        <p className="text-sm text-gray-500">
          Defina as funções específicas para cada membro selecionado.
        </p>
      </div>

      {selectedMembers.length === 0 ? (
        <div className="text-center py-12">
          <UserCheck className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum membro selecionado
          </h4>
          <p className="text-gray-500">
            Volte à etapa anterior para selecionar os membros que participarão da escala.
          </p>
        </div>
      ) : (
        <>
          {/* Resumo do progresso */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Progresso das Funções</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {membersWithFunctions.length} de {selectedMembers.length} membros com funções definidas
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round((membersWithFunctions.length / selectedMembers.length) * 100)}%
                </div>
                <div className="text-xs text-gray-500">Completo</div>
              </div>
            </div>
            <div className="mt-3 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(membersWithFunctions.length / selectedMembers.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Lista de membros com funções */}
          <div className="space-y-4">
            {selectedMembers.map((member, index) => {
              const memberFuncs = memberFunctions[member.id] || [];
              const hasFunctions = memberFuncs.length > 0;

              return (
                <div 
                  key={member.id} 
                  className={`bg-white rounded-lg border transition-all duration-200 ${
                    hasFunctions 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                          hasFunctions 
                            ? 'bg-green-100 text-green-600' 
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {hasFunctions ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Settings className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {member.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {member.email}
                            {member.campus?.name && (
                              <span className="ml-2 text-blue-600">
                                📍 {member.campus.name}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {hasFunctions && (
                        <div className="flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {memberFuncs.length} função{memberFuncs.length > 1 ? 'ões' : ''}
                        </div>
                      )}
                    </div>

                    {/* Seletor de funções */}
                    <div className={`transition-all duration-200 ${
                      hasFunctions ? 'bg-white' : 'bg-gray-50'
                    } p-3 rounded-lg border border-gray-200`}>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        <Settings className="w-3 h-3 inline mr-1" />
                        Funções do membro:
                      </label>
                      <MemberFunctionSelector
                        member={member}
                        selectedFunctions={memberFunctions[member.id] || []}
                        onChange={onMemberFunctionChange}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alertas baseados no estado */}
          {membersWithoutFunctions.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-amber-800">
                    Membros sem funções definidas
                  </h4>
                  <div className="mt-2 text-sm text-amber-700">
                    <p>
                      {membersWithoutFunctions.length} membro{membersWithoutFunctions.length > 1 ? 's' : ''} ainda não {membersWithoutFunctions.length > 1 ? 'têm' : 'tem'} funções específicas definidas:
                    </p>
                    <ul className="list-disc list-inside mt-1">
                      {membersWithoutFunctions.map(member => (
                        <li key={member.id}>{member.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {membersWithFunctions.length === selectedMembers.length && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Todas as funções definidas! 🎉
                  </h4>
                  <p className="mt-2 text-sm text-green-700">
                    Todos os membros têm funções específicas atribuídas. A escala está pronta para ser criada.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Informações sobre funções */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Settings className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">
                  Sobre as Funções
                </h4>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Cada membro pode ter múltiplas funções</li>
                    <li>Funções ajudam na organização e comunicação da escala</li>
                    <li>Membros sem funções específicas participarão como voluntários gerais</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FunctionAssignmentForm;