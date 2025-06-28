import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

export const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Use ref para evitar loops infinitos
    const hasExecuted = useRef(false);
    const currentRequest = useRef(null);

    const {
        immediate = true,
        onSuccess,
        onError
    } = options;

    const execute = useCallback(async (customEndpoint = endpoint, config = {}) => {
        // Cancelar requisição anterior se existir
        if (currentRequest.current) {
            currentRequest.current.cancel('Nova requisição');
        }

        // Criar nova requisição cancelável
        const source = api.CancelToken?.source();
        currentRequest.current = source;

        try {
            setLoading(true);
            setError(null);

            const response = await api.get(customEndpoint, {
                ...config,
                cancelToken: source?.token
            });

            setData(response.data);

            if (onSuccess) {
                onSuccess(response.data);
            }

            return response.data;
        } catch (err) {
            if (api.isCancel && api.isCancel(err)) {
                console.log('Requisição cancelada');
                return;
            }

            const errorMessage = err.response?.data?.error || 'Erro ao carregar dados';
            setError(errorMessage);

            if (onError) {
                onError(err);
            } else {
                console.error('Erro na API:', errorMessage);
            }

            throw err;
        } finally {
            setLoading(false);
            currentRequest.current = null;
        }
    }, [endpoint, onSuccess, onError]);

    const refresh = useCallback(() => {
        hasExecuted.current = false;
        return execute();
    }, [execute]);

    // UseEffect MUITO mais simples - só executa UMA vez
    useEffect(() => {
        if (immediate && endpoint && !hasExecuted.current) {
            hasExecuted.current = true;
            execute();
        }

        // Cleanup: cancelar requisição ao desmontar
        return () => {
            if (currentRequest.current) {
                currentRequest.current.cancel('Componente desmontado');
            }
        };
    }, [immediate, endpoint]); // APENAS estas dependências

    return {
        data,
        loading,
        error,
        execute,
        refresh
    };
};

export const useMutation = (mutationFn, options = {}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const {
        onSuccess,
        onError,
        showSuccessToast = true,
        successMessage = 'Operação realizada com sucesso'
    } = options;

    const mutate = useCallback(async (...args) => {
        try {
            setLoading(true);
            setError(null);

            const result = await mutationFn(...args);

            if (showSuccessToast) {
                toast.success(successMessage);
            }

            if (onSuccess) {
                onSuccess(result);
            }

            return result;
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Erro na operação';
            setError(errorMessage);

            if (onError) {
                onError(err);
            } else {
                toast.error(errorMessage);
            }

            throw err;
        } finally {
            setLoading(false);
        }
    }, [mutationFn, onSuccess, onError, showSuccessToast, successMessage]);

    return {
        mutate,
        loading,
        error
    };
};