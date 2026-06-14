const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
  const { rut, password } = req.body;

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.socket.remoteAddress;
    const dispositivo = (req.headers['user-agent'] || 'desconocido').substring(0, 100);

    const [rows] = await pool.execute(
      `SELECT Usuario_Id, Usuario_RUT, Usuario_Contraseña,
              Usuario_Nombre_Completo, Usuario_Estado_Cuenta,
              Es_Administrador, Administrador_Tipo, Administrador_Correo_Institucional,
              Es_Docente, Docente_Correo_Institucional,
              Es_Apoderado, Apoderado_Correo_Natural
       FROM usuario WHERE Usuario_RUT = ?`,
      [rut]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const user = rows[0];

    if (!user.Usuario_Estado_Cuenta) {
      return res.status(401).json({ error: 'Cuenta deshabilitada, contacte al administrador' });
    }

    const validPassword = await bcrypt.compare(password, user.Usuario_Contraseña);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const roles = [];
    if (user.Es_Administrador) roles.push('Administrador');
    if (user.Es_Docente) roles.push('Docente');
    if (user.Es_Apoderado) roles.push('Apoderado');

    // Correo según rol principal
    const correo =
      user.Administrador_Correo_Institucional ||
      user.Docente_Correo_Institucional ||
      user.Apoderado_Correo_Natural ||
      null;

    const payload = {
      id: user.Usuario_Id,
      rut: user.Usuario_RUT,
      roles,
      administradorTipo: user.Administrador_Tipo || null
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
    const expiracion = new Date(Date.now() + 15 * 60 * 1000);

    await pool.execute(
      `INSERT INTO sesion
      (Sesion_Token_Acceso, Sesion_Fecha_Inicio, Sesion_Fecha_Expiracion,
      Sesion_Direccion_IP, Sesion_Dispositivo, Sesion_Token_Expiracion, Sesion_Estado, Usuario_Id)
      VALUES (?, NOW(), ?, ?, ?, ?, 1, ?)`,
      [token, expiracion, ip, dispositivo, expiracion, user.Usuario_Id]
    );

    res.json({
      user: {
        id: user.Usuario_Id,
        nombre: user.Usuario_Nombre_Completo,
        rut: user.Usuario_RUT,
        correo,
        roles,
        administradorTipo: user.Administrador_Tipo || null
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado' });
  }

  try {
    // Marcar la sesión como inactiva (Sesion_Estado = 0) y registrar la expiración
    await pool.execute(
      `UPDATE sesion
       SET Sesion_Estado = 0, Sesion_Fecha_Expiracion = NOW()
       WHERE Sesion_Token_Acceso = ? AND Sesion_Estado = 1`,
      [token]
    );
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login, logout };
