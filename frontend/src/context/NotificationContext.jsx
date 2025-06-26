import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-toastify';

const NotificationContext = createContext();

const initialState = {
    notifications: [],
    unreadCount: 0
};

const notificationReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_NOTIFICATION':
            return {
                ...state,
                notifications: [action.payload, ...state.notifications],
                unreadCount: state.unreadCount + 1
            };
        case 'MARK_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(notif =>
                    notif.id === action.payload ? { ...notif, read: true } : notif
                ),
                unreadCount: Math.max(0, state.unreadCount - 1)
            };
        case 'MARK_ALL_AS_READ':
            return {
                ...state,
                notifications: state.notifications.map(notif => ({ ...notif, read: true })),
                unreadCount: 0
            };
        case 'REMOVE_NOTIFICATION':
            const notification = state.notifications.find(n => n.id === action.payload);
            return {
                ...state,
                notifications: state.notifications.filter(n => n.id !== action.payload),
                unreadCount: notification && !notification.read
                    ? Math.max(0, state.unreadCount - 1)
                    : state.unreadCount
            };
        case 'CLEAR_ALL':
            return initialState;
        default:
            return state;
    }
};

export const NotificationProvider = ({ children }) => {
    const [state, dispatch] = useReducer(notificationReducer, initialState);

    // Simular recebimento de notificações (em produção viria do WebSocket ou polling)
    useEffect(() => {
        const interval = setInterval(() => {
            // Aqui você implementaria a lógica para buscar novas notificações
            // checkForNewNotifications();
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now(),
            timestamp: new Date(),
            read: false,
            ...notification
        };

        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: newNotification
        });

        // Mostrar toast se for uma notificação importante
        if (notification.showToast) {
            toast.info(notification.message);
        }
    };

    const markAsRead = (id) => {
        dispatch({
            type: 'MARK_AS_READ',
            payload: id
        });
    };

    const markAllAsRead = () => {
        dispatch({ type: 'MARK_ALL_AS_READ' });
    };

    const removeNotification = (id) => {
        dispatch({
            type: 'REMOVE_NOTIFICATION',
            payload: id
        });
    };

    const clearAll = () => {
        dispatch({ type: 'CLEAR_ALL' });
    };

    const value = {
        ...state,
        addNotification,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
