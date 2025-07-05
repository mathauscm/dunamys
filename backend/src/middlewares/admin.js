const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }
  next();
};

const requireAdminOrSelf = (req, res, next) => {
  const targetUserId = parseInt(req.params.id);
  
  if (req.user.role === 'ADMIN' || req.user.id === targetUserId) {
    next();
  } else {
    return res.status(403).json({ 
      error: 'Acesso negado. Você só pode acessar seus próprios dados.' 
    });
  }
};

const requireMasterAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Token de autenticação necessário' 
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acesso negado. Apenas administradores podem acessar este recurso.' 
    });
  }

  const masterAdminEmail = process.env.MASTER_ADMIN_EMAIL || 'admin@igreja.com';
  if (req.user.email !== masterAdminEmail) {
    return res.status(403).json({ 
      error: 'Acesso negado. Requer permissões de administrador master.' 
    });
  }

  next();
};

module.exports = {
  requireAdmin,
  requireAdminOrSelf,
  requireMasterAdmin
};
