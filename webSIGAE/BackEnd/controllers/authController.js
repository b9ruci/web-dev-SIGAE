const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip || req.socket.remoteAddress;
    const dispositivo = (req.headers['user-agent'] || 'desconocido').substring(0, 100);

    const [rows] = await pool.execute(
      `SELECT Usuario_Id, Usuario_Correo, Usuario_Contraseña,
              Usuario_Nombre_Completo, Usuario_Estado_Cuenta,
              Es_Administrador, Es_Docente, Es_Apoderado
       FROM usuario WHERE Usuario_Correo = ?`,
      [email]
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

    const payload = {
      userId: user.Usuario_Id,
      email: user.Usuario_Correo,
      roles
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
    const expiracion = new Date(Date.now() + 2 * 60 * 60 * 1000);

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
        email: user.Usuario_Correo,
        roles
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { login };