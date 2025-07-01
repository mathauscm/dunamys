import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Loading from './components/common/Loading';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Member Pages
import MemberLayout from './components/layout/MemberLayout';
import MemberDashboard from './pages/member/Dashboard';
import MemberSchedules from './pages/member/Schedules';
import MemberAvailability from './pages/member/Availability';

// Admin Pages
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMembers from './pages/admin/Members';
import AdminSchedules from './pages/admin/Schedules';
import AdminCampus from './pages/admin/Campus';
import AdminLogs from './pages/admin/Logs';
import AdminMinistries from './pages/admin/Ministries';
import AdminFunctions from './pages/admin/Functions'; // NOVA IMPORTAÇÃO

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false, requiresActive = true }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading fullScreen />;
    }

    // Não está logado
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Verificar se conta está ativa (exceto para rota de pending)
    if (requiresActive && user.status !== 'ACTIVE') {
        return <Navigate to="/pending" replace />;
    }

    // Verificar permissão de admin
    if (adminOnly && user.role !== 'ADMIN') {
        return <Navigate to="/member" replace />;
    }

    return children;
};

// Component para usuários com conta pendente
const PendingApproval = () => {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-warning-100 rounded-full flex items-center justify-center">
                        <svg className="h-8 w-8 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Conta Pendente
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sua conta está aguardando aprovação
                    </p>
                </div>

                <div className="bg-white py-8 px-6 shadow-soft rounded-lg">
                    <div className="text-center">
                        <p className="text-gray-700 mb-6">
                            Olá, <strong>{user?.name}</strong>!
                        </p>
                        <p className="text-gray-600 mb-6">
                            Sua conta foi criada com sucesso e está aguardando aprovação de um administrador. 
                            Você receberá uma notificação por email quando sua conta for aprovada.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="text-sm text-gray-600">
                                    <strong>Status:</strong> {user?.status === 'PENDING' ? 'Aguardando Aprovação' : user?.status}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                    <strong>Email:</strong> {user?.email}
                                </p>
                                {user?.campus && (
                                    <p className="text-sm text-gray-600 mt-1">
                                        <strong>Campus:</strong> {user.campus.name}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={logout}
                                className="w-full btn btn-secondary"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-500">
                    <p>Entre em contato com a administração da igreja se precisar de ajuda</p>
                </div>
            </div>
        </div>
    );
};

function App() {
    const { user, loading } = useAuth();

    // Mostrar loading enquanto verifica autenticação
    if (loading) {
        return <Loading fullScreen />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                {/* Public Routes */}
                <Route 
                    path="/login" 
                    element={
                        user ? (
                            // Se já está logado, redirecionar baseado no status e role
                            user.status !== 'ACTIVE' ? (
                                <Navigate to="/pending" replace />
                            ) : user.role === 'ADMIN' ? (
                                <Navigate to="/admin" replace />
                            ) : (
                                <Navigate to="/member" replace />
                            )
                        ) : (
                            <Login />
                        )
                    } 
                />
                
                <Route 
                    path="/register" 
                    element={
                        user ? (
                            // Se já está logado, redirecionar baseado no status e role
                            user.status !== 'ACTIVE' ? (
                                <Navigate to="/pending" replace />
                            ) : user.role === 'ADMIN' ? (
                                <Navigate to="/admin" replace />
                            ) : (
                                <Navigate to="/member" replace />
                            )
                        ) : (
                            <Register />
                        )
                    } 
                />

                {/* Pending Approval Route */}
                <Route 
                    path="/pending" 
                    element={
                        user ? (
                            user.status === 'ACTIVE' ? (
                                // Se conta já está ativa, redirecionar para área apropriada
                                user.role === 'ADMIN' ? (
                                    <Navigate to="/admin" replace />
                                ) : (
                                    <Navigate to="/member" replace />
                                )
                            ) : user.status === 'PENDING' ? (
                                <PendingApproval />
                            ) : (
                                // Status rejeitado ou inativo
                                <Navigate to="/login" replace />
                            )
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />

                {/* Member Routes */}
                <Route 
                    path="/member" 
                    element={
                        <ProtectedRoute>
                            <MemberLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<MemberDashboard />} />
                    <Route path="schedules" element={<MemberSchedules />} />
                    <Route path="availability" element={<MemberAvailability />} />
                </Route>

                {/* Admin Routes */}
                <Route 
                    path="/admin" 
                    element={
                        <ProtectedRoute adminOnly>
                            <AdminLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route index element={<AdminDashboard />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="schedules" element={<AdminSchedules />} />
                    <Route path="campus" element={<AdminCampus />} />
                    <Route path="ministries" element={<AdminMinistries />} />
                    <Route path="functions" element={<AdminFunctions />} /> {/* NOVA ROTA */}
                    <Route path="logs" element={<AdminLogs />} />
                </Route>

                {/* Root Route - Redirect to appropriate area */}
                <Route 
                    path="/" 
                    element={
                        user ? (
                            user.status !== 'ACTIVE' ? (
                                <Navigate to="/pending" replace />
                            ) : user.role === 'ADMIN' ? (
                                <Navigate to="/admin" replace />
                            ) : (
                                <Navigate to="/member" replace />
                            )
                        ) : (
                            <Navigate to="/login" replace />
                        )
                    } 
                />

                {/* 404 Route */}
                <Route 
                    path="*" 
                    element={
                        <div className="min-h-screen flex items-center justify-center bg-gray-50">
                            <div className="text-center">
                                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                                    </svg>
                                </div>
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                                <p className="text-gray-600 mb-8">Página não encontrada</p>
                                <div className="space-x-4">
                                    <button
                                        onClick={() => window.history.back()}
                                        className="btn btn-secondary"
                                    >
                                        Voltar
                                    </button>
                                    {user ? (
                                        <a
                                            href={user.role === 'ADMIN' ? '/admin' : '/member'}
                                            className="btn btn-primary"
                                        >
                                            Ir para Dashboard
                                        </a>
                                    ) : (
                                        <a href="/login" className="btn btn-primary">
                                            Fazer Login
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    } 
                />
            </Routes>
        </div>
    );
}

export default App;