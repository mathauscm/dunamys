import React from 'react';

const ConfirmationBadge = ({ status, size = 'md', className = '' }) => {
  const getBadgeConfig = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return {
          text: 'Confirmado',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200'
        };
      case 'UNAVAILABLE':
        return {
          text: 'Indisponível',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200'
        };
      case 'PENDING':
      default:
        return {
          text: 'Pendente',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200'
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      case 'md':
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getBadgeConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses} ${className}`}
    >
      {config.text}
    </span>
  );
};

export default ConfirmationBadge;