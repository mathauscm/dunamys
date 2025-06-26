import React from 'react';
import { useForm } from 'react-hook-form';
import { User, Mail, Phone } from 'lucide-react';

const MemberForm = ({ member, onSubmit, loading }) => {
    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm({
        defaultValues: {
            name: member?.name || '',
            email: member?.email || '',
            phone: member?.phone || ''
        }
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Name Field */}
            <div>
                <label className="label">Nome Completo</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className={`input pl-10 ${errors.name ? 'input-error' : ''}`}
                        placeholder="Seu nome completo"
                        {...register('name', {
                            required: 'Nome é obrigatório',
                            minLength: {
                                value: 2,
                                message: 'Nome deve ter pelo menos 2 caracteres'
                            }
                        })}
                    />
                </div>
                {errors.name && (
                    <p className="error-message">{errors.name.message}</p>
                )}
            </div>

            {/* Email Field */}
            <div>
                <label className="label">Email</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="email"
                        className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                        placeholder="seu@email.com"
                        disabled={!!member} // Não permite editar email
                        {...register('email', {
                            required: 'Email é obrigatório',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Email inválido'
                            }
                        })}
                    />
                </div>
                {errors.email && (
                    <p className="error-message">{errors.email.message}</p>
                )}
            </div>

            {/* Phone Field */}
            <div>
                <label className="label">Telefone</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="tel"
                        className={`input pl-10 ${errors.phone ? 'input-error' : ''}`}
                        placeholder="(11) 99999-9999"
                        {...register('phone', {
                            required: 'Telefone é obrigatório',
                            pattern: {
                                value: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
                                message: 'Formato: (11) 99999-9999'
                            }
                        })}
                    />
                </div>
                {errors.phone && (
                    <p className="error-message">{errors.phone.message}</p>
                )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
                <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                >
                    {loading ? 'Salvando...' : 'Salvar'}
                </button>
            </div>
        </form>
    );
};

export default MemberForm;
