import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

export const useApi = (endpoint, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const {
        immediate = true,
        onSuccess,
        onError,
        dependencies = []
    } = options;

    const execute = useCallback(async (customEndpoint = endpoint, config = {}) => {
        try {
            setLoading(true);
            setError(null);

            const response = await api.get(customEndpoint, config);

            setData(response.data);

            if (onSuccess) {
                onSuccess(response.data);
            }

            return response.data;
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Erro ao carregar dados';
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
    }, [endpoint, onSuccess, onError]);

    const mutate = useCallback((newData) => {
        setData(newData);
    }, []);

    const refresh = useCallback(() => {
        return execute();
    }, [execute]);

    useEffect(() => {
        if (immediate && endpoint) {
            execute();
        }
    }, [immediate, execute, ...dependencies]);

    return {
        data,
        loading,
        error,
        execute,
        mutate,
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