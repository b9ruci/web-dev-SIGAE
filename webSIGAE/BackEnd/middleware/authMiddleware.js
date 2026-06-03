const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

const verifyAdmin = (req, res, next) => {
  const roles = req.user?.roles || [];
  const esAdmin = roles.includes('Administrador') || roles.includes('Super Admin');

  if (!esAdmin) {
    return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
  }

  next();
};

module.exports = { verifyToken, verifyAdmin };