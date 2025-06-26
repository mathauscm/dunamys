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
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // Verificar token ao carregar a aplicação
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('@igreja:token');

            if (token) {
                try {
                    const user = await authService.verifyToken(token);
                    dispatch({
                        type: 'LOGIN_SUCCESS',
                        payload: { user, token }
                    });
                } catch (error) {
                    localStorage.removeItem('@igreja:token');
                    dispatch({ type: 'SET_LOADING', payload: false });
                }
            } else {
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        dispatch({ type: 'LOGIN_START' });

        try {
            const response = await authService.login(email, password);

            localStorage.setItem('@igreja:token', response.token);

            dispatch({
                type: 'LOGIN_SUCCESS',
                payload: response
            });

            toast.success(`Bem-vindo(a), ${response.user.name}!`);

            return response;
        } catch (error) {
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
        dispatch({ type: 'LOGIN_START' });

        try {
            const response = await authService.register(userData);

            dispatch({ type: 'SET_LOADING', payload: false });

            toast.success(response.message);

            return response;
        } catch (error) {
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
        localStorage.removeItem('@igreja:token');
        dispatch({ type: 'LOGOUT' });
        toast.info('Você foi desconectado');
    };

    const updateUser = (userData) => {
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

    const value = {
        ...state,
        login,
        register,
        logout,
        updateUser,
        changePassword
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
