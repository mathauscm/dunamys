import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Loading from '../common/Loading';

const LoginForm = () => {
    const { login, loading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm();

    const onSubmit = async (data) => {
        try {
            await login(data.email, data.password);
        } catch (error) {
            // Error is handled in the context
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Submit Button */}
            <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full flex items-center justify-center"
            >
                {loading ? (
                    <Loading size="sm" />
                ) : (
                    'Entrar'
                )}
            </button>
        </form>
    );
};

export default LoginForm;
