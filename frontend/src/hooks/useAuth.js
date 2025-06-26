// ===== FRONTEND/SRC/HOOKS/USEAUTH.JS =====
import { useContext } from 'react';
import { useAuthContext } from '../context/AuthContext';

/**
 * Hook personalizado para acessar o contexto de autenticação
 * 
 * @returns {Object} Objeto contendo estado e métodos de autenticação
 * @returns {Object} returns.user - Dados do usuário logado (null se não logado)
 * @returns {string} returns.token - Token JWT atual
 * @returns {boolean} returns.loading - Estado de carregamento
 * @returns {string|null} returns.error - Mensagem de erro (se houver)
 * @returns {Function} returns.login - Função para fazer login
 * @returns {Function} returns.register - Função para registrar usuário
 * @returns {Function} returns.logout - Função para fazer logout
 * @returns {Function} returns.updateUser - Função para atualizar dados do usuário
 * @returns {Function} returns.changePassword - Função para alterar senha
 * 
 * @example
 * // Uso básico
 * const { user, login, logout, loading } = useAuth();
 * 
 * // Verificar se está logado
 * if (user) {
 *   console.log('Usuário logado:', user.name);
 * }
 * 
 * // Fazer login
 * const handleLogin = async () => {
 *   try {
 *     await login('email@exemplo.com', 'senha123');
 *   } catch (error) {
 *     console.error('Erro no login:', error);
 *   }
 * };
 * 
 * // Fazer logout
 * const handleLogout = () => {
 *   logout();
 * };
 */
export const useAuth = () => {
    const context = useAuthContext();

    if (!context) {
        throw new Error(
            'useAuth deve ser usado dentro de um AuthProvider. ' +
            'Certifique-se de que o componente está envolvido pelo AuthProvider.'
        );
    }

    return context;
};

/**
 * Hook para verificar se o usuário está autenticado
 * 
 * @returns {boolean} true se o usuário está logado, false caso contrário
 * 
 * @example
 * const isAuthenticated = useIsAuthenticated();
 * 
 * if (isAuthenticated) {
 *   return <DashboardPage />;
 * } else {
 *   return <LoginPage />;
 * }
 */
export const useIsAuthenticated = () => {
    const { user, loading } = useAuth();
    return !loading && !!user;
};

/**
 * Hook para verificar se o usuário é administrador
 * 
 * @returns {boolean} true se o usuário é admin, false caso contrário
 * 
 * @example
 * const isAdmin = useIsAdmin();
 * 
 * if (isAdmin) {
 *   return <AdminPanel />;
 * } else {
 *   return <AccessDenied />;
 * }
 */
export const useIsAdmin = () => {
    const { user } = useAuth();
    return user?.role === 'ADMIN';
};

/**
 * Hook para verificar se o usuário é membro
 * 
 * @returns {boolean} true se o usuário é membro, false caso contrário
 * 
 * @example
 * const isMember = useIsMember();
 * 
 * if (isMember) {
 *   return <MemberDashboard />;
 * }
 */
export const useIsMember = () => {
    const { user } = useAuth();
    return user?.role === 'MEMBER';
};

/**
 * Hook para verificar se a conta do usuário está ativa
 * 
 * @returns {boolean} true se a conta está ativa, false caso contrário
 * 
 * @example
 * const isActive = useIsActive();
 * 
 * if (!isActive) {
 *   return <AccountPendingMessage />;
 * }
 */
export const useIsActive = () => {
    const { user } = useAuth();
    return user?.status === 'ACTIVE';
};

/**
 * Hook para verificar se a conta está pendente de aprovação
 * 
 * @returns {boolean} true se está pendente, false caso contrário
 * 
 * @example
 * const isPending = useIsPending();
 * 
 * if (isPending) {
 *   return <PendingApprovalMessage />;
 * }
 */
export const useIsPending = () => {
    const { user } = useAuth();
    return user?.status === 'PENDING';
};

/**
 * Hook para obter informações específicas do usuário
 * 
 * @returns {Object} Objeto com informações do usuário
 * @returns {string} returns.id - ID do usuário
 * @returns {string} returns.name - Nome do usuário
 * @returns {string} returns.email - Email do usuário
 * @returns {string} returns.phone - Telefone do usuário
 * @returns {string} returns.role - Papel do usuário (ADMIN/MEMBER)
 * @returns {string} returns.status - Status da conta
 * 
 * @example
 * const userInfo = useUserInfo();
 * 
 * return (
 *   <div>
 *     <h1>Bem-vindo, {userInfo.name}!</h1>
 *     <p>Email: {userInfo.email}</p>
 *     <p>Papel: {userInfo.role}</p>
 *   </div>
 * );
 */
export const useUserInfo = () => {
    const { user } = useAuth();

    return {
        id: user?.id || null,
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role || null,
        status: user?.status || null,
        createdAt: user?.createdAt || null,
        lastLogin: user?.lastLogin || null
    };
};

/**
 * Hook para gerenciar permissões
 * 
 * @param {string} permission - Permissão a ser verificada
 * @returns {boolean} true se o usuário tem a permissão, false caso contrário
 * 
 * @example
 * const canManageMembers = usePermission('MANAGE_MEMBERS');
 * const canCreateSchedules = usePermission('CREATE_SCHEDULES');
 * 
 * if (canManageMembers) {
 *   return <MembersManagement />;
 * }
 */
export const usePermission = (permission) => {
    const { user } = useAuth();

    // Admins têm todas as permissões
    if (user?.role === 'ADMIN') {
        return true;
    }

    // Mapear permissões específicas para membros
    const memberPermissions = {
        'VIEW_OWN_SCHEDULES': true,
        'MANAGE_OWN_AVAILABILITY': true,
        'UPDATE_OWN_PROFILE': true,
        'VIEW_OWN_NOTIFICATIONS': true
    };

    const adminPermissions = {
        'MANAGE_MEMBERS': true,
        'MANAGE_SCHEDULES': true,
        'SEND_NOTIFICATIONS': true,
        'VIEW_LOGS': true,
        'MANAGE_SYSTEM': true,
        ...memberPermissions // Admins também têm permissões de membro
    };

    if (user?.role === 'ADMIN') {
        return adminPermissions[permission] || false;
    }

    if (user?.role === 'MEMBER') {
        return memberPermissions[permission] || false;
    }

    return false;
};

/**
 * Hook para logout com confirmação
 * 
 * @param {Object} options - Opções para o logout
 * @param {boolean} options.confirm - Se deve mostrar confirmação
 * @param {string} options.message - Mensagem de confirmação personalizada
 * @returns {Function} Função de logout
 * 
 * @example
 * const logoutWithConfirm = useLogoutWithConfirmation({
 *   confirm: true,
 *   message: 'Tem certeza que deseja sair?'
 * });
 * 
 * <button onClick={logoutWithConfirm}>
 *   Sair
 * </button>
 */
export const useLogoutWithConfirmation = (options = {}) => {
    const { logout } = useAuth();
    const { confirm = false, message = 'Tem certeza que deseja sair do sistema?' } = options;

    return () => {
        if (confirm) {
            if (window.confirm(message)) {
                logout();
            }
        } else {
            logout();
        }
    };
};

/**
 * Hook para redirecionamento baseado em autenticação
 * 
 * @param {Object} options - Opções de redirecionamento
 * @param {string} options.loginPath - Caminho para página de login
 * @param {string} options.adminPath - Caminho para área admin
 * @param {string} options.memberPath - Caminho para área de membro
 * @returns {Function} Função para obter caminho de redirecionamento
 * 
 * @example
 * const getRedirectPath = useAuthRedirect({
 *   loginPath: '/login',
 *   adminPath: '/admin',
 *   memberPath: '/member'
 * });
 * 
 * const redirectPath = getRedirectPath();
 * navigate(redirectPath);
 */
export const useAuthRedirect = (options = {}) => {
    const { user, loading } = useAuth();
    const {
        loginPath = '/login',
        adminPath = '/admin',
        memberPath = '/member'
    } = options;

    return () => {
        if (loading) return null;

        if (!user) {
            return loginPath;
        }

        switch (user.role) {
            case 'ADMIN':
                return adminPath;
            case 'MEMBER':
                return memberPath;
            default:
                return loginPath;
        }
    };
};

/**
 * Hook para verificar se o token está próximo do vencimento
 * 
 * @param {number} threshold - Minutos antes do vencimento para considerar "próximo"
 * @returns {Object} Objeto com informações sobre o token
 * @returns {boolean} returns.isExpiringSoon - Se o token expira em breve
 * @returns {number} returns.minutesUntilExpiry - Minutos até expirar
 * @returns {Function} returns.refreshToken - Função para renovar o token
 * 
 * @example
 * const { isExpiringSoon, refreshToken } = useTokenExpiry(30); // 30 minutos
 * 
 * useEffect(() => {
 *   if (isExpiringSoon) {
 *     refreshToken();
 *   }
 * }, [isExpiringSoon, refreshToken]);
 */
export const useTokenExpiry = (threshold = 30) => {
    const { token, refreshToken } = useAuth();

    const getTokenExpiry = () => {
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000; // Converter para milliseconds
        } catch (error) {
            return null;
        }
    };

    const tokenExpiry = getTokenExpiry();
    const now = Date.now();
    const minutesUntilExpiry = tokenExpiry ? Math.floor((tokenExpiry - now) / (1000 * 60)) : 0;
    const isExpiringSoon = minutesUntilExpiry <= threshold && minutesUntilExpiry > 0;

    return {
        isExpiringSoon,
        minutesUntilExpiry,
        refreshToken
    };
};

// Export default do hook principal
export default useAuth;

// ===== EXEMPLOS DE USO =====

/**
 * EXEMPLO 1: Componente de Login
 * 
 * import { useAuth } from '../hooks/useAuth';
 * 
 * const LoginPage = () => {
 *   const { login, loading, error } = useAuth();
 *   
 *   const handleSubmit = async (data) => {
 *     try {
 *       await login(data.email, data.password);
 *       // Redirecionamento será feito automaticamente
 *     } catch (err) {
 *       console.error('Erro no login:', err);
 *     }
 *   };
 *   
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       {error && <div className="error">{error}</div>}
 *       <input type="email" name="email" required />
 *       <input type="password" name="password" required />
 *       <button type="submit" disabled={loading}>
 *         {loading ? 'Entrando...' : 'Entrar'}
 *       </button>
 *     </form>
 *   );
 * };
 */

/**
 * EXEMPLO 2: Componente Protegido
 * 
 * import { useAuth, useIsAuthenticated } from '../hooks/useAuth';
 * 
 * const ProtectedComponent = () => {
 *   const isAuthenticated = useIsAuthenticated();
 *   const { user } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <LoginPage />;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Bem-vindo, {user.name}!</h1>
 *       <p>Você está na área protegida.</p>
 *     </div>
 *   );
 * };
 */

/**
 * EXEMPLO 3: Rota com Permissão
 * 
 * import { usePermission } from '../hooks/useAuth';
 * 
 * const AdminPanel = () => {
 *   const canManageMembers = usePermission('MANAGE_MEMBERS');
 *   
 *   if (!canManageMembers) {
 *     return <AccessDenied />;
 *   }
 *   
 *   return (
 *     <div>
 *       <h1>Painel Administrativo</h1>
 *       <MembersManagement />
 *     </div>
 *   );
 * };
 */

/**
 * EXEMPLO 4: Header com Informações do Usuário
 * 
 * import { useAuth, useLogoutWithConfirmation } from '../hooks/useAuth';
 * 
 * const Header = () => {
 *   const { user } = useAuth();
 *   const logout = useLogoutWithConfirmation({ confirm: true });
 *   
 *   return (
 *     <header>
 *       <div>Olá, {user.name}</div>
 *       <button onClick={logout}>Sair</button>
 *     </header>
 *   );
 * };
 */

/**
 * EXEMPLO 5: Auto-refresh de Token
 * 
 * import { useTokenExpiry } from '../hooks/useAuth';
 * 
 * const TokenManager = () => {
 *   const { isExpiringSoon, refreshToken } = useTokenExpiry(30);
 *   
 *   useEffect(() => {
 *     if (isExpiringSoon) {
 *       refreshToken();
 *     }
 *   }, [isExpiringSoon, refreshToken]);
 *   
 *   return null; // Componente invisível para gerenciar token
 * };
 */