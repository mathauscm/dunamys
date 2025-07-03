import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, ChevronRight, Users, FileText, Settings } from 'lucide-react';
import { toast } from 'react-hot-toast';

// Hooks customizados
import { useFormWizard } from '../../../hooks/useFormWizard';

// Componentes modulares
import ScheduleDetailsForm from './ScheduleDetailsForm';
import MemberSelectionForm from './MemberSelectionForm';
import FunctionAssignmentForm from './FunctionAssignmentForm';

// Serviços
import { adminService } from '../../../services/members';
import { api } from '../../../services/api';
import Loading from '../../common/Loading';

const WIZARD_STEPS = ['details', 'members', 'functions'];

/**
 * Componente wizard para criação/edição de escalas
 * Organiza o formulário em etapas: Detalhes > Membros > Funções
 */
const ScheduleFormWizard = ({ schedule, onSubmit, loading, onClose }) => {
  // Estados dos dados
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [campuses, setCampuses] = useState([]);
  const [loadingCampuses, setLoadingCampuses] = useState(true);
  
  // Estados do formulário
  const [selectedDate, setSelectedDate] = useState(
    schedule?.date ? new Date(schedule.date) : null
  );
  const [selectedTime, setSelectedTime] = useState(schedule?.time || '');
  const [filterCampusId, setFilterCampusId] = useState('all');
  const [memberFunctions, setMemberFunctions] = useState({});

  // Hook do wizard
  const wizard = useFormWizard(WIZARD_STEPS, 'details');

  // Hook do formulário
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

  // Carregar funções dos membros da escala existente
  useEffect(() => {
    if (schedule?.members) {
      const existingMemberFunctions = {};
      schedule.members.forEach(member => {
        if (member.functions && member.functions.length > 0) {
          existingMemberFunctions[member.userId] = member.functions.map(f => f.functionId);
        }
      });
      setMemberFunctions(existingMemberFunctions);
    }
  }, [schedule]);

  // Carregar membros
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const response = await adminService.getMembers({ status: 'ACTIVE', limit: 100 });
        setMembers(response.members);
      } catch (error) {
        console.error('Erro ao carregar membros:', error);
        toast.error('Erro ao carregar lista de membros');
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  // Carregar campuses
  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const response = await api.get('/campus/public');
        setCampuses(response.data);
      } catch (error) {
        console.error('Erro ao carregar campus:', error);
        toast.error('Erro ao carregar lista de campus');
        setCampuses([]);
      } finally {
        setLoadingCampuses(false);
      }
    };
    fetchCampuses();
  }, []);

  // Função helper para obter campus ID do membro
  const getMemberCampusId = (member) => {
    if (member.campusId !== null && member.campusId !== undefined) {
      return member.campusId;
    }
    if (member.campus && member.campus.id !== null && member.campus.id !== undefined) {
      return member.campus.id;
    }
    return null;
  };

  // Filtrar membros por campus
  const filteredMembers = React.useMemo(() => {
    if (filterCampusId === 'all') {
      return members;
    }

    const campusIdToFilter = parseInt(filterCampusId, 10);

    return members.filter(member => {
      const memberCampusId = getMemberCampusId(member);
      return memberCampusId !== null &&
        memberCampusId !== undefined &&
        parseInt(memberCampusId, 10) === campusIdToFilter;
    });
  }, [members, filterCampusId]);

  // Contador de membros por campus
  const getMembersCountForCampus = (campusId) => {
    return members.filter(member => {
      const memberCampusId = getMemberCampusId(member);
      return memberCampusId !== null &&
        memberCampusId !== undefined &&
        parseInt(memberCampusId, 10) === campusId;
    }).length;
  };

  // Manipular seleção de membros
  const handleMemberToggle = (memberId) => {
    const currentIds = selectedMemberIds || [];
    const newIds = currentIds.includes(memberId)
      ? currentIds.filter(id => id !== memberId)
      : [...currentIds, memberId];

    setValue('memberIds', newIds);

    // Se removendo o membro, remover também suas funções
    if (!newIds.includes(memberId)) {
      const newMemberFunctions = { ...memberFunctions };
      delete newMemberFunctions[memberId];
      setMemberFunctions(newMemberFunctions);
    }
  };

  // Manipular mudança de funções dos membros
  const handleMemberFunctionChange = (memberId, functionIds) => {
    setMemberFunctions(prev => ({
      ...prev,
      [memberId]: functionIds
    }));
  };

  // Validar se pode avançar para próxima etapa
  const canProceedToNextStep = () => {
    switch (wizard.currentStep) {
      case 'details':
        return !!(selectedDate && selectedTime);
      case 'members':
        return selectedMemberIds && selectedMemberIds.length > 0;
      case 'functions':
        return true; // Funções são opcionais
      default:
        return false;
    }
  };

  // Avançar para próxima etapa
  const handleNextStep = () => {
    if (canProceedToNextStep()) {
      wizard.markStepComplete(wizard.currentStep);
      wizard.nextStep();
    } else {
      // Mostrar validação específica
      if (wizard.currentStep === 'details') {
        if (!selectedDate) toast.error('Por favor, selecione uma data');
        if (!selectedTime) toast.error('Por favor, selecione um horário');
      } else if (wizard.currentStep === 'members') {
        toast.error('Por favor, selecione pelo menos um membro');
      }
    }
  };

  // Submeter formulário
  const handleFormSubmit = (data) => {
    // Validação final
    if (!selectedDate) {
      toast.error('Por favor, selecione uma data');
      wizard.goToStep('details');
      return;
    }
    if (!selectedTime) {
      toast.error('Por favor, selecione um horário');
      wizard.goToStep('details');
      return;
    }
    if (!selectedMemberIds || selectedMemberIds.length === 0) {
      toast.error('Por favor, selecione pelo menos um membro');
      wizard.goToStep('members');
      return;
    }

    // Incluir dados adicionais
    const formData = {
      ...data,
      date: selectedDate.toISOString().split('T')[0],
      time: selectedTime,
      memberFunctions
    };

    onSubmit(formData);
  };

  // Obter membros selecionados
  const selectedMembers = members.filter(member =>
    selectedMemberIds?.includes(member.id)
  );

  if (loadingMembers || loadingCampuses) {
    return <Loading />;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
          
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {schedule ? 'Editar Escala' : 'Nova Escala'}
                </h2>
                <div className="flex items-center mt-2 text-sm text-gray-500">
                  <span>Etapa {wizard.getCurrentStepIndex() + 1} de {wizard.totalSteps}</span>
                  <div className="ml-4 flex-1 max-w-xs">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${wizard.getProgress()}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="flex w-full pt-20">
            {/* Sidebar de navegação */}
            <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
              <nav className="flex-1 p-6">
                <div className="space-y-3">
                  {wizard.stepStates.map(step => {
                    const stepConfig = {
                      details: { icon: FileText, label: 'Detalhes da Escala', description: 'Título, data, campus' },
                      members: { icon: Users, label: 'Membros', description: 'Seleção dos participantes' },
                      functions: { icon: Settings, label: 'Funções', description: 'Atribuição de responsabilidades' }
                    };

                    const config = stepConfig[step.name];
                    const Icon = config.icon;

                    return (
                      <button
                        key={step.name}
                        type="button"
                        onClick={() => step.canNavigate && wizard.goToStep(step.name)}
                        disabled={!step.canNavigate}
                        className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                          step.isCurrent
                            ? 'bg-primary-100 text-primary-700 border border-primary-200'
                            : step.canNavigate
                            ? 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            : 'text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Icon className="w-5 h-5 mr-3" />
                        <div className="text-left flex-1">
                          <div className="font-medium">{config.label}</div>
                          <div className="text-xs text-gray-500">{config.description}</div>
                        </div>
                        {step.isComplete && (
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 8 8">
                              <path d="m6.564.75-3.59 3.612-1.538-1.55L0 4.26 2.974 7.25 8 2.193z"/>
                            </svg>
                          </div>
                        )}
                        {step.isCurrent && <ChevronRight className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              </nav>

              {/* Resumo */}
              {selectedMembers.length > 0 && (
                <div className="border-t border-gray-200 bg-white p-4 max-h-48 overflow-y-auto">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">
                    Resumo ({selectedMembers.length} membro{selectedMembers.length > 1 ? 's' : ''})
                  </h4>
                  <div className="space-y-2">
                    {selectedMembers.map(member => {
                      const memberFuncs = memberFunctions[member.id] || [];
                      return (
                        <div key={member.id} className="p-2 bg-gray-50 rounded text-xs">
                          <div className="font-medium text-gray-900">{member.name}</div>
                          {memberFuncs.length > 0 ? (
                            <div className="text-primary-600 mt-1">
                              ✓ {memberFuncs.length} função{memberFuncs.length > 1 ? 'ões' : ''}
                            </div>
                          ) : (
                            <div className="text-gray-500 mt-1">Sem função definida</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Área principal */}
            <div className="flex-1 flex flex-col min-w-0">
              <form onSubmit={handleSubmit(handleFormSubmit)} className="flex-1 flex flex-col h-full">
                
                {/* Conteúdo da etapa */}
                <div className="flex-1 overflow-y-auto p-6">
                  {wizard.currentStep === 'details' && (
                    <ScheduleDetailsForm
                      register={register}
                      errors={errors}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      selectedTime={selectedTime}
                      setSelectedTime={setSelectedTime}
                      campuses={campuses}
                      loadingCampuses={loadingCampuses}
                    />
                  )}

                  {wizard.currentStep === 'members' && (
                    <MemberSelectionForm
                      filteredMembers={filteredMembers}
                      selectedMemberIds={selectedMemberIds}
                      onMemberToggle={handleMemberToggle}
                      filterCampusId={filterCampusId}
                      setFilterCampusId={setFilterCampusId}
                      campuses={campuses}
                      members={members}
                      getMembersCountForCampus={getMembersCountForCampus}
                    />
                  )}

                  {wizard.currentStep === 'functions' && (
                    <FunctionAssignmentForm
                      selectedMembers={selectedMembers}
                      memberFunctions={memberFunctions}
                      onMemberFunctionChange={handleMemberFunctionChange}
                    />
                  )}
                </div>

                {/* Footer com botões */}
                <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                  <div className="flex justify-between items-center">
                    <div className="flex space-x-3">
                      {!wizard.isFirstStep() && (
                        <button
                          type="button"
                          onClick={wizard.previousStep}
                          className="btn btn-outline"
                        >
                          Voltar
                        </button>
                      )}
                    </div>

                    <div className="flex space-x-3">
                      {!wizard.isLastStep() ? (
                        <button
                          type="button"
                          onClick={handleNextStep}
                          disabled={!canProceedToNextStep()}
                          className="btn btn-primary flex items-center"
                        >
                          Próximo
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={loading || !canProceedToNextStep()}
                          className="btn btn-primary"
                        >
                          {loading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Salvando...
                            </div>
                          ) : (
                            schedule ? 'Atualizar Escala' : 'Criar Escala'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleFormWizard;