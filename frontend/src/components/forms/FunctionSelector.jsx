import React, { useState, useEffect } from 'react';
import { 
    ChevronDown, 
    Check, 
    X, 
    Settings,
    Users,
    Camera,
    Car,
    Heart,
    Building,
    DollarSign,
    Coffee,
    Utensils,
    Smartphone,
    Monitor,
    Video,
    Radio,
    Wrench
} from 'lucide-react';
import { functionsService } from '../../services/functions';

// Mapeamento de ícones
const iconMap = {
    Users, Camera, Car, Heart, Building, DollarSign, Coffee, Utensils,
    Smartphone, Monitor, Video, Radio, Settings, Wrench
};

const getIconComponent = (iconName) => {
    const IconComponent = iconMap[iconName] || Settings;
    return IconComponent;
};

const FunctionSelector = ({ 
    selectedFunctionIds = [], 
    onSelectionChange, 
    disabled = false,
    placeholder = "Selecionar funções...",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carregar categorias e funções
    useEffect(() => {
        const loadCategories = async () => {
            try {
                setLoading(true);
                const data = await functionsService.getPublicCategories();
                setCategories(data);
                setError(null);
            } catch (err) {
                console.error('Erro ao carregar funções:', err);
                setError('Erro ao carregar funções');
            } finally {
                setLoading(false);
            }
        };

        loadCategories();
    }, []);

    // Obter funções selecionadas
    const getSelectedFunctions = () => {
        const selected = [];
        categories.forEach(category => {
            category.functions?.forEach(func => {
                if (selectedFunctionIds.includes(func.id)) {
                    selected.push(func);
                }
            });
        });
        return selected;
    };

    // Verificar se uma função está selecionada
    const isFunctionSelected = (functionId) => {
        return selectedFunctionIds.includes(functionId);
    };

    // Toggle seleção de função
    const toggleFunction = (functionId) => {
        if (disabled) return;

        let newSelection;
        if (isFunctionSelected(functionId)) {
            newSelection = selectedFunctionIds.filter(id => id !== functionId);
        } else {
            newSelection = [...selectedFunctionIds, functionId];
        }
        
        onSelectionChange(newSelection);
    };

    // Remover função selecionada
    const removeFunction = (functionId, e) => {
        e.stopPropagation();
        if (disabled) return;
        
        const newSelection = selectedFunctionIds.filter(id => id !== functionId);
        onSelectionChange(newSelection);
    };

    // Limpar todas as seleções
    const clearAll = (e) => {
        e.stopPropagation();
        if (disabled) return;
        onSelectionChange([]);
    };

    const selectedFunctions = getSelectedFunctions();

    if (loading) {
        return (
            <div className={`input flex items-center justify-center ${className}`}>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-primary-600"></div>
                <span className="ml-2 text-sm text-gray-500">Carregando funções...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`input text-red-600 ${className}`}>
                {error}
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {/* Input principal */}
            <div
                className={`input cursor-pointer min-h-[42px] ${
                    disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
                } ${isOpen ? 'ring-2 ring-blue-500 ring-opacity-20 border-blue-500' : ''}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex flex-wrap gap-1 flex-1 min-h-[20px]">
                        {selectedFunctions.length === 0 ? (
                            <span className="text-gray-400 text-sm">{placeholder}</span>
                        ) : (
                            selectedFunctions.map((func) => {
                                const IconComponent = getIconComponent(func.icon);
                                return (
                                    <span
                                        key={func.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                                    >
                                        <IconComponent className="h-3 w-3" />
                                        {func.name}
                                        {!disabled && (
                                            <button
                                                type="button"
                                                onClick={(e) => removeFunction(func.id, e)}
                                                className="ml-1 hover:text-blue-900"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </span>
                                );
                            })
                        )}
                    </div>
                    
                    <div className="flex items-center gap-2 ml-2">
                        {selectedFunctions.length > 0 && !disabled && (
                            <button
                                type="button"
                                onClick={clearAll}
                                className="text-gray-400 hover:text-gray-600"
                                title="Limpar seleção"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        <ChevronDown 
                            className={`h-4 w-4 text-gray-400 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                            }`} 
                        />
                    </div>
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Overlay */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Conteúdo do dropdown */}
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
                        {categories.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                Nenhuma função disponível
                            </div>
                        ) : (
                            categories.map((category) => {
                                const CategoryIconComponent = getIconComponent(category.icon);
                                const activeFunctions = category.functions?.filter(f => f.active) || [];
                                
                                if (activeFunctions.length === 0) return null;

                                return (
                                    <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                                        {/* Header da categoria */}
                                        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                                            <div className="flex items-center gap-2">
                                                <CategoryIconComponent className="h-4 w-4 text-gray-600" />
                                                <span className="text-sm font-medium text-gray-700">
                                                    {category.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    ({activeFunctions.length})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Funções da categoria */}
                                        <div className="py-1">
                                            {activeFunctions.map((func) => {
                                                const FuncIconComponent = getIconComponent(func.icon);
                                                const isSelected = isFunctionSelected(func.id);

                                                return (
                                                    <div
                                                        key={func.id}
                                                        className={`px-3 py-2 cursor-pointer transition-colors ${
                                                            isSelected 
                                                                ? 'bg-blue-50 text-blue-700' 
                                                                : 'hover:bg-gray-50 text-gray-700'
                                                        }`}
                                                        onClick={() => toggleFunction(func.id)}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <FuncIconComponent className="h-4 w-4 text-gray-500" />
                                                                <div>
                                                                    <div className="text-sm font-medium">
                                                                        {func.name}
                                                                    </div>
                                                                    {func.description && (
                                                                        <div className="text-xs text-gray-500">
                                                                            {func.description}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {isSelected && (
                                                                <Check className="h-4 w-4 text-blue-600" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default FunctionSelector;