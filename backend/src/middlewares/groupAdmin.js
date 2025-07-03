const requireGroupAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Token de autenticação necessário' });
  }

  const { userType, role } = req.user;

  if (role !== 'ADMIN' && userType !== 'groupAdmin') {
    return res.status(403).json({ 
      message: 'Acesso negado. Requer permissões de administrador de grupo' 
    });
  }

  next();
};

const requireAdminOrGroupAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Token de autenticação necessário' });
  }

  const { userType, role } = req.user;

  if (role !== 'ADMIN' && userType !== 'groupAdmin') {
    return res.status(403).json({ 
      message: 'Acesso negado. Requer permissões de administrador' 
    });
  }

  next();
};

const requireGroupAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Token de autenticação necessário' });
  }

  const { userType, role, adminGroups } = req.user;

  if (role === 'ADMIN') {
    return next();
  }

  if (userType !== 'groupAdmin') {
    return res.status(403).json({ 
      message: 'Acesso negado. Requer permissões de administrador de grupo' 
    });
  }

  const groupId = parseInt(req.params.groupId) || parseInt(req.body.groupId);
  
  if (!groupId) {
    return res.status(400).json({ 
      message: 'ID do grupo é obrigatório' 
    });
  }

  if (!adminGroups.includes(groupId)) {
    return res.status(403).json({ 
      message: 'Acesso negado. Você não tem permissão para este grupo' 
    });
  }

  next();
};

const requireFullAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Token de autenticação necessário' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      message: 'Acesso negado. Requer permissões de administrador geral' 
    });
  }

  next();
};

module.exports = {
  requireGroupAdmin,
  requireAdminOrGroupAdmin,
  requireGroupAccess,
  requireFullAdmin
};