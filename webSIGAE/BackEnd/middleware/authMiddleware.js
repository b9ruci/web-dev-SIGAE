const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];

  const token =
    authHeader &&
    authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token no proporcionado'
    });
  }

  try {

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (error) {

    return res.status(401).json({
      error: 'Token inválido o expirado'
    });

  }

};

const verifyAdmin = (req, res, next) => {

  const roles = req.user?.roles || [];

  if (!roles.includes('Administrador')) {

    return res.status(403).json({
      error: 'No tienes permisos'
    });

  }

  next();

};

const verifySuperAdmin = (req, res, next) => {

  if (
    req.user?.administradorTipo !==
    'SuperAdmin'
  ) {

    return res.status(403).json({
      error:
        'Solo un SuperAdmin puede modificar roles'
    });

  }

  next();

};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin
};