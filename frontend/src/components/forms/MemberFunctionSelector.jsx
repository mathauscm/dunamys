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
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
    const { user } = useAuth();
    const adminGroups = useAdminGroups();
    const buttonRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadFunctions();
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
            const rect = buttonRef.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const scrollX = window.scrollX;
            
            setDropdownPosition({
                top: rect.bottom + scrollY + 4,
                left: rect.left + scrollX,
                width: rect.width
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

    // Fechar dropdown ao clicar fora
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

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('scroll', calculateDropdownPosition, true);
            window.addEventListener('resize', calculateDropdownPosition);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', calculateDropdownPosition, true);
            window.removeEventListener('resize', calculateDropdownPosition);
        };
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
                        w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white
                        ${disabled ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}
                        ${selectedNames.length > 0 ? 'border-primary-300 bg-primary-50' : ''}
                        ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
                        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                        transition-all duration-150
                    `}
                >
                    <div className="flex items-center min-w-0">
                        <Briefcase className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                            {selectedNames.length === 0 
                                ? 'Selecionar função...'
                                : selectedNames.length === 1
                                    ? selectedNames[0]
                                    : `${selectedNames.length} funções selecionadas`
                            }
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
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
                    className="fixed bg-white border border-gray-300 rounded-lg shadow-2xl"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                        width: Math.max(dropdownPosition.width, 320),
                        zIndex: 9999,
                        maxHeight: '400px'
                    }}
                >
                    <div className="flex flex-col h-full">
                        {/* Header com busca */}
                        <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-700">
                                    Selecionar Funções
                                </span>
                                <span className="text-xs text-gray-500">
                                    {selectedNames.length} selecionada{selectedNames.length !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar função..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Conteúdo com scroll independente */}
                        <div className="flex-1 overflow-y-auto" style={{ maxHeight: '300px' }}>
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
                                        <div key={group.id} className="mb-1">
                                            <div className="px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 border-b border-gray-100 sticky top-0">
                                                <div className="flex items-center">
                                                    <span>{group.name}</span>
                                                    <span className="ml-2 text-gray-400">({group.functions.length})</span>
                                                </div>
                                            </div>
                                            {group.functions.map((func) => (
                                                <label
                                                    key={func.id}
                                                    className="flex items-center px-3 py-2 hover:bg-primary-50 cursor-pointer transition-colors group"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFunctions.includes(func.id)}
                                                        onChange={() => handleFunctionToggle(func.id)}
                                                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition-colors"
                                                    />
                                                    <span className="mr-3 text-lg">{renderIcon(func.icon)}</span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-medium text-gray-900 group-hover:text-primary-700 transition-colors">
                                                            {func.name}
                                                        </div>
                                                        {func.description && (
                                                            <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                                {func.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                    {selectedFunctions.includes(func.id) && (
                                                        <div className="ml-2 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center">
                                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
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

                        {/* Footer com resumo */}
                        {selectedNames.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                                <div className="text-xs text-gray-600">
                                    <strong>{selectedNames.length}</strong> função{selectedNames.length !== 1 ? 'ões' : ''} selecionada{selectedNames.length !== 1 ? 's' : ''} para <strong>{member.name}</strong>
                                </div>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default MemberFunctionSelector;