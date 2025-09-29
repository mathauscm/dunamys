import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Briefcase, Search } from 'lucide-react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useAuth, useAdminGroups } from '../../hooks/useAuth';
import { functionGroupAdminService } from '../../services/functionGroupAdmin';

// Mapeamento de ícones (mesmo do arquivo Functions.jsx)
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

const MemberFunctionSelector = ({ 
    member, 
    selectedFunctions = [], 
    onChange,
    disabled = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [functions, setFunctions] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownPosition, setDropdownPosition] = useState({ 
        top: 0, 
        left: 0, 
        width: 0, 
        maxHeight: 400,
        direction: 'down' // 'up' ou 'down'
    });
    const [isMobile, setIsMobile] = useState(false);
    const { user } = useAuth();
    const adminGroups = useAdminGroups();
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadFunctions();
        
        // Detectar se é mobile
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const loadFunctions = async () => {
        try {
            setLoading(true);
            
            // Se é admin de grupo, carregar apenas suas funções
            if (user?.userType === 'groupAdmin') {
                const myFunctionsResponse = await functionGroupAdminService.getMyFunctions();
                const availableFunctions = myFunctionsResponse.functions || [];
                
                // Organizar por grupos
                const groupsMap = {};
                availableFunctions.forEach(func => {
                    if (!groupsMap[func.group.id]) {
                        groupsMap[func.group.id] = {
                            id: func.group.id,
                            name: func.group.name,
                            functions: []
                        };
                    }
                    groupsMap[func.group.id].functions.push(func);
                });
                
                const groupsArray = Object.values(groupsMap);
                setGroups(groupsArray);
                setFunctions(availableFunctions);
            } else {
                // Admin geral vê todas as funções
                const response = await api.get('/functions/groups');
                setGroups(response.data.data || []);
                
                // Flatten all functions for easier searching
                const allFunctions = [];
                (response.data.data || []).forEach(group => {
                    group.functions.forEach(func => {
                        allFunctions.push({
                            ...func,
                            groupName: group.name
                        });
                    });
                });
                setFunctions(allFunctions);
            }
        } catch (error) {
            console.error('Erro ao carregar funções:', error);
        } finally {
            setLoading(false);
        }
    };


    const getSelectedFunctionNames = () => {
        return functions
            .filter(func => selectedFunctions.includes(func.id))
            .map(func => func.name);
    };

    const renderIcon = (iconName) => {
        return iconMap[iconName] || iconMap['briefcase'];
    };

    const selectedNames = getSelectedFunctionNames();

    const calculateDropdownPosition = () => {
        if (buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            // Configurações do dropdown
            const dropdownHeight = 400; // altura máxima do dropdown
            const dropdownMinWidth = 320;
            const dropdownWidth = Math.max(buttonRect.width, dropdownMinWidth);
            const padding = 8; // espaçamento das bordas da tela
            
            // Calcular espaço disponível em cada direção
            const spaceBelow = viewportHeight - buttonRect.bottom;
            const spaceAbove = buttonRect.top;
            const spaceRight = viewportWidth - buttonRect.left;
            const spaceLeft = buttonRect.right;
            
            // Determinar posição vertical (prioridade: baixo, depois cima, depois centralizado)
            let top;
            let maxHeight = dropdownHeight;
            let direction = 'down';
            
            if (spaceBelow >= dropdownHeight + padding) {
                // Espaço suficiente embaixo
                top = buttonRect.bottom + scrollY + 4;
                direction = 'down';
            } else if (spaceAbove >= dropdownHeight + padding) {
                // Espaço suficiente em cima
                top = buttonRect.top + scrollY - dropdownHeight - 4;
                direction = 'up';
            } else {
                // Nem em cima nem embaixo - usar o lado com mais espaço
                const availableHeight = Math.max(spaceBelow, spaceAbove) - padding * 2;
                maxHeight = Math.min(dropdownHeight, availableHeight);
                
                if (spaceBelow > spaceAbove) {
                    // Mais espaço embaixo - alinhar com o botão
                    top = buttonRect.bottom + scrollY + 4;
                    direction = 'down';
                } else {
                    // Mais espaço em cima - mostrar em cima
                    top = buttonRect.top + scrollY - maxHeight - 4;
                    direction = 'up';
                }
            }
            
            // Determinar posição horizontal (centralizar no botão, mas manter na tela)
            let left = buttonRect.left + scrollX + (buttonRect.width - dropdownWidth) / 2;
            
            // Ajustar se sair da tela
            if (left < padding) {
                left = padding + scrollX;
            } else if (left + dropdownWidth > viewportWidth - padding) {
                left = viewportWidth - dropdownWidth - padding + scrollX;
            }
            
            setDropdownPosition({
                top,
                left,
                width: dropdownWidth,
                maxHeight,
                direction
            });
        }
    };

    const handleToggleDropdown = () => {
        if (!isOpen) {
            calculateDropdownPosition();
        }
        setIsOpen(!isOpen);
        setSearchTerm('');
    };

    const handleFunctionToggle = (functionId) => {
        const newSelected = selectedFunctions.includes(functionId)
            ? selectedFunctions.filter(id => id !== functionId)
            : [...selectedFunctions, functionId];
        
        onChange(member.id, newSelected);
    };

    const getFilteredGroups = () => {
        if (!searchTerm.trim()) return groups;
        
        return groups.map(group => ({
            ...group,
            functions: group.functions.filter(func => 
                func.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                func.description?.toLowerCase().includes(searchTerm.toLowerCase())
            )
        })).filter(group => group.functions.length > 0);
    };

    // Fechar dropdown ao clicar fora e gerenciar posicionamento
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        // Throttle para melhor performance durante scroll
        let throttleTimer;
        const throttledRepositioning = () => {
            if (throttleTimer) return;
            throttleTimer = setTimeout(() => {
                calculateDropdownPosition();
                throttleTimer = null;
            }, 16); // ~60fps
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', throttledRepositioning, true);
            window.addEventListener('resize', throttledRepositioning);
            
            // Recalcular posição imediatamente após abrir
            const timer = setTimeout(calculateDropdownPosition, 0);
            
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('scroll', throttledRepositioning, true);
                window.removeEventListener('resize', throttledRepositioning);
                clearTimeout(timer);
                if (throttleTimer) clearTimeout(throttleTimer);
            };
        }
    }, [isOpen]);

    return (
        <>
            <div className="relative">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggleDropdown}
                    disabled={disabled}
                    className={`
                        w-full flex items-center justify-between px-2 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-md bg-white
                        ${disabled ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}
                        ${selectedNames.length > 0 ? 'border-primary-300 bg-primary-50' : ''}
                        ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-150
                    `}
                >
                    <div className="flex items-center min-w-0">
                        <Briefcase className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate text-xs sm:text-sm">
                            {selectedNames.length === 0
                                ? 'Selecionar função...'
                                : selectedNames.length === 1
                                    ? selectedNames[0]
                                    : `${selectedNames.length} funções`
                            }
                        </span>
                    </div>
                    <ChevronDown className={`w-3 h-3 sm:w-4 sm:h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Mostrar funções selecionadas como badges */}
                {selectedNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {functions
                            .filter(func => selectedFunctions.includes(func.id))
                            .map((func) => (
                                <span
                                    key={func.id}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 rounded-full"
                                >
                                    <span className="mr-1">{renderIcon(func.icon)}</span>
                                    {func.name}
                                    {!disabled && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFunctionToggle(func.id);
                                            }}
                                            className="ml-1 inline-flex items-center justify-center w-4 h-4 text-primary-600 hover:text-primary-800 hover:bg-primary-200 rounded-full transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </span>
                            ))
                        }
                    </div>
                )}
            </div>

            {/* Portal para o dropdown */}
            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={`
                        ${isMobile
                            ? 'fixed inset-x-3 bottom-3'
                            : 'fixed'
                        }
                        bg-white border border-gray-300 rounded-lg shadow-2xl transition-all duration-200
                        ${dropdownPosition.direction === 'up'
                            ? 'animate-in slide-in-from-bottom-2 fade-in'
                            : 'animate-in slide-in-from-top-2 fade-in'
                        }
                    `}
                    style={isMobile ? {
                        zIndex: 9999,
                        maxHeight: '40vh'
                    } : {
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                        maxHeight: dropdownPosition.maxHeight,
                        zIndex: 9999,
                        transformOrigin: dropdownPosition.direction === 'up' ? 'bottom center' : 'top center'
                    }}
                >
                    <div className="flex flex-col h-full">
                        {/* Header com busca */}
                        <div className={`border-b border-gray-200 bg-gray-50 rounded-t-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                            <div className="flex items-center justify-between mb-1.5">
                                <span className={`font-medium text-gray-700 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                                    Selecionar Funções
                                </span>
                                <span className="text-xs text-gray-500">
                                    {selectedNames.length} selecionada{selectedNames.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="relative">
                                <Search className={`absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 ${isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
                                <input
                                    type="text"
                                    placeholder="Buscar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                                        isMobile ? 'pl-8 pr-2 py-2 text-xs' : 'pl-9 pr-3 py-2 text-sm'
                                    }`}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Conteúdo com scroll independente */}
                        <div
                            className="flex-1 overflow-y-auto scroll-container overscroll-contain"
                            style={isMobile ? {
                                maxHeight: 'calc(40vh - 130px)',
                                WebkitOverflowScrolling: 'touch'
                            } : {
                                maxHeight: dropdownPosition.maxHeight - 120 // Subtraindo header(80px) + footer(40px)
                            }}
                        >
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-sm text-gray-500">Carregando funções...</div>
                                </div>
                            ) : getFilteredGroups().length === 0 ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center">
                                        <Briefcase className="mx-auto w-8 h-8 text-gray-400 mb-2" />
                                        <div className="text-sm text-gray-500">
                                            {searchTerm ? 'Nenhuma função encontrada' : 'Nenhuma função disponível'}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-2">
                                    {getFilteredGroups().map((group) => (
                                        <div key={group.id} className="mb-0.5">
                                            <div className={`px-2.5 py-1.5 font-semibold text-gray-600 bg-gray-50 border-b border-gray-100 sticky top-0 ${isMobile ? 'text-xs' : 'text-xs'}`}>
                                                <div className="flex items-center">
                                                    <span>{group.name}</span>
                                                    <span className="ml-1.5 text-gray-400">({group.functions.length})</span>
                                                </div>
                                            </div>
                                            {group.functions.map((func) => (
                                                <label
                                                    key={func.id}
                                                    className={`flex items-center hover:bg-primary-50 active:bg-primary-100 cursor-pointer transition-colors group ${
                                                        isMobile ? 'px-2.5 py-2 min-h-[44px]' : 'px-3 py-2'
                                                    }`}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFunctions.includes(func.id)}
                                                        onChange={() => handleFunctionToggle(func.id)}
                                                        className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors flex-shrink-0"
                                                    />
                                                    <span className={`mr-2 flex-shrink-0 ${isMobile ? 'text-base' : 'text-lg'}`}>{renderIcon(func.icon)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-medium text-gray-900 group-hover:text-primary-700 transition-colors ${
                                                            isMobile ? 'text-xs' : 'text-sm'
                                                        }`}>
                                                            {func.name}
                                                        </div>
                                                        {func.description && !isMobile && (
                                                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                                {func.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedFunctions.includes(func.id) && (
                                                        <div className="ml-2 bg-primary-500 text-white rounded-full flex items-center justify-center flex-shrink-0 w-4 h-4">
                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </label>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer com resumo e botão de fechar (mobile) */}
                        <div className={`border-t border-gray-200 bg-gray-50 rounded-b-lg ${isMobile ? 'p-2' : 'p-3'}`}>
                            {selectedNames.length > 0 && (
                                <div className={`text-gray-600 ${isMobile ? 'text-xs mb-2' : 'text-xs'}`}>
                                    <strong>{selectedNames.length}</strong> função{selectedNames.length !== 1 ? 'ões' : ''} para <strong>{member.name.split(' ')[0]}</strong>
                                </div>
                            )}
                            {isMobile && (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-medium py-2.5 px-3 rounded-lg transition-colors text-sm"
                                >
                                    Confirmar Seleção
                                </button>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MemberFunctionSelector;