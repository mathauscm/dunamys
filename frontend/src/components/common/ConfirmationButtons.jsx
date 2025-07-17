import React, { useState } from 'react';
import { CheckCircle, XCircle, Check, X } from 'lucide-react';

const ConfirmationButtons = ({ 
  scheduleId, 
  currentStatus, 
  onConfirm, 
  onMarkUnavailable, 
  disabled = false,
  size = 'md' 
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading || disabled) return;
    
    try {
      setLoading(true);
      await onConfirm(scheduleId);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkUnavailable = async () => {
    if (loading || disabled) return;
    
    try {
      setLoading(true);
      await onMarkUnavailable(scheduleId);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      case 'md':
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = (size) => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-6 w-6';
      case 'md':
      default:
        return 'h-5 w-5';
    }
  };

  const sizeClasses = getSizeClasses(size);
  const iconSize = getIconSize(size);

  const isConfirmed = currentStatus === 'CONFIRMED';
  const isUnavailable = currentStatus === 'UNAVAILABLE';
  const isPending = currentStatus === 'PENDING';

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={handleConfirm}
        disabled={loading || disabled}
        className={`inline-flex items-center rounded-md border font-medium transition-colors ${sizeClasses} ${
          isConfirmed
            ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
            : 'bg-white text-green-600 border-green-600 hover:bg-green-50'
        } ${
          (loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isConfirmed ? (
          <div className={`${iconSize} mr-2 bg-white rounded-full flex items-center justify-center`}>
            <Check className="h-3 w-3 text-green-600" />
          </div>
        ) : (
          <CheckCircle className={`${iconSize} mr-2`} />
        )}
        {isConfirmed ? 'Confirmado' : 'Confirmar Presença'}
      </button>

      <button
        onClick={handleMarkUnavailable}
        disabled={loading || disabled}
        className={`inline-flex items-center rounded-md border font-medium transition-colors ${sizeClasses} ${
          isUnavailable
            ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
            : 'bg-white text-red-600 border-red-600 hover:bg-red-50'
        } ${
          (loading || disabled) ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUnavailable ? (
          <div className={`${iconSize} mr-2 bg-white rounded-full flex items-center justify-center`}>
            <X className="h-3 w-3 text-red-600" />
          </div>
        ) : (
          <XCircle className={`${iconSize} mr-2`} />
        )}
        {isUnavailable ? 'Indisponível' : 'Marcar Indisponibilidade'}
      </button>
    </div>
  );
};

export default ConfirmationButtons;