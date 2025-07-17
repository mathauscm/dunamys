import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showHeader = true,
    showCloseButton = true,
    scrollable = true
}) => {
    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        '2xl': 'max-w-5xl',
        '3xl': 'max-w-6xl',
        '4xl': 'max-w-7xl',
        full: 'max-w-full mx-4'
    };

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div
                    className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {showHeader && (
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className={scrollable ? (showHeader ? 'p-6' : 'p-6') : (showHeader ? 'p-6 pb-0' : 'p-6')}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Modal;
