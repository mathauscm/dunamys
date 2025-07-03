import React from 'react';
import { FileText, Calendar, Clock, MapPin } from 'lucide-react';

/**
 * Componente para os detalhes básicos da escala
 * Responsável apenas pelos campos: título, descrição, data, hora e campus
 */
const ScheduleDetailsForm = ({ 
  register, 
  errors, 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime,
  campuses,
  loadingCampuses 
}) => {
  return (
    <div className="max-w-4xl space-y-6">
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-primary-600" />
          Informações da Escala
        </h3>
        <p className="text-sm text-gray-500">
          Configure os detalhes básicos da escala de serviço.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1 */}
        <div className="space-y-6">
          {/* Título */}
          <div>
            <label className="label">Título da Escala *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className={`input pl-10 ${errors.title ? 'input-error' : ''}`}
                placeholder="Ex: Culto Dominical - Manhã"
                {...register('title', {
                  required: 'Título é obrigatório',
                  minLength: {
                    value: 3,
                    message: 'Título deve ter pelo menos 3 caracteres'
                  }
                })}
              />
            </div>
            {errors.title && (
              <p className="error-message">{errors.title.message}</p>
            )}
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                className="input w-full"
                required
              />
              {!selectedDate && (
                <p className="text-sm text-red-600 mt-1">Data é obrigatória</p>
              )}
            </div>
            <div>
              <label className="label">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário *
              </label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="input w-full"
                required
              />
              {!selectedTime && (
                <p className="text-sm text-red-600 mt-1">Horário é obrigatório</p>
              )}
            </div>
          </div>
        </div>

        {/* Coluna 2 */}
        <div className="space-y-6">
          {/* Descrição */}
          <div>
            <label className="label">Descrição (Opcional)</label>
            <textarea
              className="input h-24 resize-none"
              placeholder="Descrição adicional sobre a escala..."
              {...register('description')}
            />
          </div>

          {/* Campus */}
          <div>
            <label className="label">
              <MapPin className="w-4 h-4 inline mr-1" />
              Campus *
            </label>
            <select
              className={`input ${errors.location ? 'input-error' : ''}`}
              {...register('location', { required: 'Campus é obrigatório' })}
              disabled={loadingCampuses}
            >
              <option value="">Selecione o campus</option>
              {campuses.map(campus => (
                <option key={campus.id} value={campus.name}>
                  {campus.name}{campus.city ? ` - ${campus.city}` : ''}
                </option>
              ))}
            </select>
            {errors.location && (
              <p className="error-message">{errors.location.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Card de validação */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Campos Obrigatórios
            </h4>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Título da escala</li>
                <li>Data do evento</li>
                <li>Horário do evento</li>
                <li>Campus onde será realizado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetailsForm;