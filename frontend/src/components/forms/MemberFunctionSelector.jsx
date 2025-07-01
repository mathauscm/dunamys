import React, { useState, useEffect } from 'react';
import { ChevronDown, X, Briefcase } from 'lucide-react';
import { api } from '../../services/api';

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

    useEffect(() => {
        loadFunctions();
    }, []);

    const loadFunctions = async () => {
        try {
            setLoading(true);
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
        } catch (error) {
            console.error('Erro ao carregar funções:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFunctionToggle = (functionId) => {
        const newSelected = selectedFunctions.includes(functionId)
            ? selectedFunctions.filter(id => id !== functionId)
            : [...selectedFunctions, functionId];
        
        onChange(member.id, newSelected);
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

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white
                    ${disabled ? 'bg-gray-50 text-gray-400' : 'hover:bg-gray-50'}
                    ${selectedNames.length > 0 ? 'border-primary-300' : ''}
                    focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                `}
            >
                <div className="flex items-center">
                    <Briefcase className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="truncate">
                        {selectedNames.length === 0 
                            ? 'Selecionar função...'
                            : selectedNames.length === 1
                                ? selectedNames[0]
                                : `${selectedNames.length} funções`
                        }
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {loading ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Carregando...</div>
                    ) : groups.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-gray-500">Nenhuma função disponível</div>
                    ) : (
                        groups.map((group) => (
                            <div key={group.id}>
                                <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b">
                                    {group.name}
                                </div>
                                {group.functions.map((func) => (
                                    <label
                                        key={func.id}
                                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedFunctions.includes(func.id)}
                                            onChange={() => handleFunctionToggle(func.id)}
                                            className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                        <span className="mr-2 text-sm">{renderIcon(func.icon)}</span>
                                        <div className="flex-1">
                                            <div className="text-sm font-medium text-gray-900">{func.name}</div>
                                            {func.description && (
                                                <div className="text-xs text-gray-500">{func.description}</div>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Overlay para fechar o dropdown ao clicar fora */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

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
                                        onClick={() => handleFunctionToggle(func.id)}
                                        className="ml-1 inline-flex items-center justify-center w-4 h-4 text-primary-600 hover:text-primary-800"
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
    );
};

export default MemberFunctionSelector;