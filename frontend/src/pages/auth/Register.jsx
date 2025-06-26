import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Church, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../../components/common/Loading';

const Register = () => {
    const { register: registerUser, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm();

    const password = watch('password');

    const onSubmit = async (data) => {
        try {
            await registerUser({
                name: data.name,
                email: data.email,
                phone: data.phone,
                password: data.password
            });
            // Redirect will be handled by the context
        } catch (error) {
            // Error is handled in the context
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
                        <Church className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Cadastre-se
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Crie sua conta para acessar o sistema
                    </p>
                </div>

                {/* Register Form */}
                <div className="bg-white py-8 px-6 shadow-soft rounded-lg">
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

                        {/* Password Field */}
                        <div>
                            <label className="label">Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className={`input pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                                    placeholder="Sua senha"
                                    {...register('password', {
                                        required: 'Senha é obrigatória',
                                        minLength: {
                                            value: 6,
                                            message: 'Senha deve ter pelo menos 6 caracteres'
                                        }
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="error-message">{errors.password.message}</p>
                            )}
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label className="label">Confirmar Senha</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className={`input pl-10 pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                                    placeholder="Confirme sua senha"
                                    {...register('confirmPassword', {
                                        required: 'Confirmação de senha é obrigatória',
                                        validate: value => value === password || 'Senhas não coincidem'
                                    })}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="error-message">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary w-full flex items-center justify-center"
                        >
                            {loading ? (
                                <Loading size="sm" />
                            ) : (
                                'Criar Conta'
                            )}
                        </button>
                    </form>

                    {/* Links */}
                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            Já tem conta? Faça login aqui
                        </Link>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500">
                    <p>Ao criar uma conta, você concorda com nossos termos de uso</p>
                    <p className="mt-1">© 2024 Igreja. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default Register;