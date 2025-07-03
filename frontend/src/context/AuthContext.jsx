import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/auth';
import { toast } from 'react-toastify';

const AuthContext = createContext();

const initialState = {
    user: null,
    token: null,
    loading: true,
    error: null
};

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN_START':
            return {
                ...state,
                loading: true,
                error: null
            };
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                loading: false,
                error: null
            };
        case 'LOGIN_FAILURE':
            return {
                ...state,
                user: null,
                token: null,
                loading: false,
                error: action.payload
            };
        case 'LOGOUT':
            return {
                ...initialState,
                loading: false
            };
        case 'UPDATE_USER':
            return {
                ...state,
                user: action.payload
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'CLEAR_ERROR':
            return {
                ...state,
                error: null
            };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Verificar token ao carregar a aplicação
    useEffect(() => {
        const initAuth = async () => {
            try {
                dispatch({ type: 'SET_LOADING', payload: true });
                
                const token = localStorage.getItem('@igreja:token');
                
                if (token) {
                    console.log('Token encontrado, verificando...', token.substring(0, 20) + '...');
                    
                    try {
                        const user = await authService.verifyToken(token);
                        console.log('Usuário verificado:', user);
                        
                        dispatch({
                            type: 'LOGIN_SUCCESS',
                            payload: { user, token }
                        });
                    } catch (error) {
                        console.error('Token inválido ou expirado:', error);
                        
                        // Remove token inválido
                        localStorage.removeItem('@igreja:token');
                        
                        dispatch({ 
                            type: 'LOGIN_FAILURE', 
                            payload: 'Sessão expirada' 
                        });
                    }
                } else {
                    console.log('Nenhum token encontrado');
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } catch (error) {
                console.error('Erro na inicialização da autenticação:', error);
                localStorage.removeItem('@igreja:token');
                dispatch({ 
                    type: 'LOGIN_FAILURE', 
                    payload: 'Erro na verificação de autenticação' 
                });
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        console.log('Tentando fazer login com:', email);
        dispatch({ type: 'LOGIN_START' });

        try {
            const response = await authService.login(email, password);
            console.log('Login bem-sucedido:', response);

            // Salvar token no localStorage
            localStorage.setItem('@igreja:token', response.token);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: response
            });

            // Mensagem de sucesso baseada no status
            if (response.user.status === 'PENDING') {
                toast.info(`Olá, ${response.user.name}! Sua conta está aguardando aprovação.`);
            } else {
                toast.success(`Bem-vindo(a), ${response.user.name}!`);
            }

            return response;
        } catch (error) {
            console.error('Erro no login:', error);
            
            const errorMessage = error.response?.data?.error || 'Erro ao fazer login';

            dispatch({
                type: 'LOGIN_FAILURE',
                payload: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    };

    const register = async (userData) => {
        console.log('Tentando registrar usuário:', userData.email);
        dispatch({ type: 'LOGIN_START' });

        try {
            const response = await authService.register(userData);
            console.log('Registro bem-sucedido:', response);

            dispatch({ type: 'SET_LOADING', payload: false });

            toast.success(response.message || 'Cadastro realizado com sucesso! Aguarde aprovação.');

            return response;
        } catch (error) {
            console.error('Erro no registro:', error);
            
            const errorMessage = error.response?.data?.error || 'Erro ao registrar';

            dispatch({
                type: 'LOGIN_FAILURE',
                payload: errorMessage
            });

            toast.error(errorMessage);
            throw error;
        }
    };

    const logout = () => {
        console.log('Fazendo logout...');
        
        // Remove token do localStorage
        localStorage.removeItem('@igreja:token');
        
        // Reseta o estado
        dispatch({ type: 'LOGOUT' });
        
        toast.info('Você foi desconectado');
    };

    const updateUser = (userData) => {
        console.log('Atualizando dados do usuário:', userData);
        
        dispatch({
            type: 'UPDATE_USER',
            payload: userData
        });
    };

    const changePassword = async (currentPassword, newPassword) => {
        try {
            await authService.changePassword(currentPassword, newPassword);
            toast.success('Senha alterada com sucesso');
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Erro ao alterar senha';
            toast.error(errorMessage);
            throw error;
        }
    };

    const clearError = () => {
        dispatch({ type: 'CLEAR_ERROR' });
    };

    // Log do estado atual para debug
    useEffect(() => {
        console.log('Estado da autenticação:', {
            user: state.user ? `${state.user.name} (${state.user.role})` : null,
            userType: state.user?.userType,
            adminGroups: state.user?.adminGroups,
            status: state.user?.status,
            loading: state.loading,
            error: state.error,
            hasToken: !!localStorage.getItem('@igreja:token')
        });
        console.log('Usuário completo:', state.user);
    }, [state]);

    const value = {
        ...state,
        login,
        register,
        logout,
        updateUser,
        changePassword,
        clearError
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuthContext must be used within an AuthProvider');
    }
    return context;
};