import React, { useState, useEffect } from 'react';
import { Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, 
         isSameMonth, isToday, isBefore, startOfToday, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Componente de Seleção de Data com Calendário
export const DatePicker = ({ 
    value, 
    onChange, 
    label = "Data", 
    placeholder = "Selecione uma data",
    minDate = new Date(),
    maxDate,
    disabled = false,
    error,
    required = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());

    const handleDateSelect = (date) => {
        onChange(date);
        setIsOpen(false);
    };

    const handlePrevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const getDaysInMonth = () => {
        const start = startOfMonth(currentMonth);
        const end = endOfMonth(currentMonth);
        return eachDayOfInterval({ start, end });
    };

    const isDateDisabled = (date) => {
        if (minDate && isBefore(date, startOfToday())) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    };

    const formatDisplayDate = (date) => {
        if (!date) return placeholder;
        return format(date, "dd/MM/yyyy", { locale: ptBR });
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="label">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`input w-full text-left flex items-center justify-between ${
                        error ? 'input-error' : ''
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}
                >
                    <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                            {formatDisplayDate(value)}
                        </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Calendar Dropdown */}
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-4 w-80">
                            {/* Header do Calendário */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                
                                <h3 className="font-medium text-gray-900 capitalize">
                                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                                </h3>
                                
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="p-1 hover:bg-gray-100 rounded"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Dias da Semana */}
                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                                    <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Dias do Mês */}
                            <div className="grid grid-cols-7 gap-1">
                                {getDaysInMonth().map((date) => {
                                    const isSelected = value && format(date, 'yyyy-MM-dd') === format(value, 'yyyy-MM-dd');
                                    const isCurrentDay = isToday(date);
                                    const isDisabled = isDateDisabled(date);
                                    
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            type="button"
                                            onClick={() => !isDisabled && handleDateSelect(date)}
                                            disabled={isDisabled}
                                            className={`
                                                w-8 h-8 text-sm rounded-full transition-colors
                                                ${isSelected 
                                                    ? 'bg-blue-600 text-white' 
                                                    : isCurrentDay 
                                                        ? 'bg-blue-100 text-blue-600 font-medium'
                                                        : 'text-gray-700 hover:bg-gray-100'
                                                }
                                                ${isDisabled 
                                                    ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' 
                                                    : 'cursor-pointer'
                                                }
                                            `}
                                        >
                                            {format(date, 'd')}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Ações Rápidas */}
                            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => handleDateSelect(new Date())}
                                    className="text-sm text-blue-600 hover:text-blue-700"
                                >
                                    Hoje
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange(null);
                                        setIsOpen(false);
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Limpar
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p className="error-message">{error}</p>
            )}
        </div>
    );
};

// Componente de Seleção de Horário Otimizado
export const TimePicker = ({ 
    value, 
    onChange, 
    label = "Horário", 
    placeholder = "Selecione um horário",
    disabled = false,
    error,
    required = false,
    step = 30, // Intervalo em minutos
    startTime = "06:00",
    endTime = "23:00",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const generateTimeOptions = () => {
        const options = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        for (let hour = startHour; hour <= endHour; hour++) {
            for (let minute = 0; minute < 60; minute += step) {
                if (hour === endHour && minute > endMinute) break;
                if (hour === startHour && minute < startMinute) continue;
                
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                options.push(timeString);
            }
        }
        
        return options;
    };

    const timeOptions = generateTimeOptions();

    const handleTimeSelect = (time) => {
        onChange(time);
        setIsOpen(false);
    };

    const formatDisplayTime = (time) => {
        if (!time) return placeholder;
        return time;
    };

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="label">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            
            <div className="relative">
                <button
                    type="button"
                    onClick={() => !disabled && setIsOpen(!isOpen)}
                    disabled={disabled}
                    className={`input w-full text-left flex items-center justify-between ${
                        error ? 'input-error' : ''
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer hover:border-gray-400'}`}
                >
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-400 mr-2" />
                        <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                            {formatDisplayTime(value)}
                        </span>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Time Dropdown */}
                        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-full max-h-60 overflow-y-auto">
                            {timeOptions.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    onClick={() => handleTimeSelect(time)}
                                    className={`
                                        w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors
                                        ${value === time ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}
                                    `}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {error && (
                <p className="error-message">{error}</p>
            )}
        </div>
    );
};

// Componente Combinado de Data e Hora
export const DateTimePicker = ({ 
    dateValue, 
    timeValue, 
    onDateChange, 
    onTimeChange,
    dateLabel = "Data",
    timeLabel = "Horário",
    datePlaceholder = "Selecione uma data",
    timePlaceholder = "Selecione um horário",
    disabled = false,
    dateError,
    timeError,
    required = false,
    className = ""
}) => {
    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            <DatePicker
                value={dateValue}
                onChange={onDateChange}
                label={dateLabel}
                placeholder={datePlaceholder}
                disabled={disabled}
                error={dateError}
                required={required}
            />
            
            <TimePicker
                value={timeValue}
                onChange={onTimeChange}
                label={timeLabel}
                placeholder={timePlaceholder}
                disabled={disabled}
                error={timeError}
                required={required}
            />
        </div>
    );
};

// Componente de Período (Data Início e Fim)
export const DateRangePicker = ({ 
    startDate, 
    endDate, 
    onStartDateChange, 
    onEndDateChange,
    startLabel = "Data Início",
    endLabel = "Data Fim",
    startPlaceholder = "Data de início",
    endPlaceholder = "Data de fim",
    disabled = false,
    startError,
    endError,
    required = false,
    className = ""
}) => {
    const handleStartDateChange = (date) => {
        onStartDateChange(date);
        // Se a data de fim for anterior à nova data de início, limpar
        if (endDate && date && date > endDate) {
            onEndDateChange(null);
        }
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}>
            <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                label={startLabel}
                placeholder={startPlaceholder}
                disabled={disabled}
                error={startError}
                required={required}
            />
            
            <DatePicker
                value={endDate}
                onChange={onEndDateChange}
                label={endLabel}
                placeholder={endPlaceholder}
                minDate={startDate || new Date()}
                disabled={disabled || !startDate}
                error={endError}
                required={required}
            />
        </div>
    );
};

export default { DatePicker, TimePicker, DateTimePicker, DateRangePicker };