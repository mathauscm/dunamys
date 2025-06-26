import React from 'react';
import { Link } from 'react-router-dom';
import { Church } from 'lucide-react';
import LoginForm from '../../components/forms/LoginForm';

const Login = () => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-primary-600 rounded-full flex items-center justify-center">
                        <Church className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Área de Membros
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Faça login para acessar o sistema
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-white py-8 px-6 shadow-soft rounded-lg">
                    <LoginForm />

                    {/* Links */}
                    <div className="mt-6 text-center space-y-4">
                        <Link
                            to="/register"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                            Não tem conta? Cadastre-se aqui
                        </Link>

                        <div>
                            <button
                                type="button"
                                className="text-gray-500 hover:text-gray-700 text-sm"
                                onClick={() => {
                                    // Implementar modal de recuperação de senha
                                    alert('Funcionalidade em desenvolvimento');
                                }}
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-gray-500">
                    <p>Sistema de Gerenciamento de Membros</p>
                    <p className="mt-1">© 2024 Igreja. Todos os direitos reservados.</p>
                </div>
            </div>
        </div>
    );
};

export default Login;