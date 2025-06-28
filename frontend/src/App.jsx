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
import AdminLogs from './pages/admin/Logs';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user.role !== 'ADMIN') {
        return <Navigate to="/member" replace />;
    }

    return children;
};

function App() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={
                    user ? (
                        <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />
                    ) : (
                        <Login />
                    )
                } />
                <Route path="/register" element={
                    user ? (
                        <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />
                    ) : (
                        <Register />
                    )
                } />

                {/* Member Routes */}
                <Route path="/member" element={
                    <ProtectedRoute>
                        <MemberLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<MemberDashboard />} />
                    <Route path="schedules" element={<MemberSchedules />} />
                    <Route path="availability" element={<MemberAvailability />} />
                </Route>

                {/* Admin Routes */}
                <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="members" element={<AdminMembers />} />
                    <Route path="schedules" element={<AdminSchedules />} />
                    <Route path="logs" element={<AdminLogs />} />
                </Route>

                {/* Redirect root to appropriate dashboard */}
                <Route path="/" element={
                    user ? (
                        <Navigate to={user.role === 'ADMIN' ? '/admin' : '/member'} replace />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                } />

                {/* 404 Route */}
                <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                            <p className="text-gray-600 mb-8">Página não encontrada</p>
                            <button
                                onClick={() => window.history.back()}
                                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                } />
            </Routes>
        </div>
    );
}

export default App;