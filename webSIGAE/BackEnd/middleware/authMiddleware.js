const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const verifyToken = async (req, res, next) => {

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

    // Verificar que la sesión siga activa en BD (cubre cuentas desactivadas y logouts)
    const [rows] = await pool.execute(
      `SELECT Sesion_Estado FROM sesion WHERE Sesion_Token_Acceso = ? LIMIT 1`,
      [token]
    );

    if (rows.length === 0 || rows[0].Sesion_Estado === 0) {
      return res.status(401).json({
        error: 'Sesión inválida o cerrada',
        codigo: 'SESION_INACTIVA'
      });
    }

    req.user = decoded;
    req.token = token;

    next();

  } catch (error) {

    // Distinguir token expirado de token inválido (CU 13)
    if (error.name === 'TokenExpiredError') {
      // Marcar sesión como expirada en BD
      try {
        await pool.execute(
          `UPDATE sesion
           SET Sesion_Estado = 0, Sesion_Fecha_Expiracion = NOW()
           WHERE Sesion_Token_Acceso = ? AND Sesion_Estado = 1`,
          [token]
        );
      } catch (_) { /* no bloquear la respuesta si falla la BD */ }

      return res.status(401).json({
        error: 'Sesión expirada',
        codigo: 'TOKEN_EXPIRADO'
      });
    }

    return res.status(401).json({
      error: 'Token inválido'
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

  if (req.user?.administradorTipo !== 'Super Admin') {

    return res.status(403).json({
      error: 'Solo un Super Administrador puede realizar esta acción'
    });

  }

  next();

};

const verifyPuedeCrearRol = (req, res, next) => {
  const { Es_Administrador } = req.body;

  if (Es_Administrador) {
    if (req.user?.administradorTipo !== 'Super Admin') {
      return res.status(403).json({
        error: 'Solo un Super Administrador puede registrar administradores'
      });
    }
  }

  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin,
  verifyPuedeCrearRol,   // ← agrega esta línea
};