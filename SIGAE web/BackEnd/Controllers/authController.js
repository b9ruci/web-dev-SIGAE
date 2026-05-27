const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  try {
    // 1. Buscar usuario
    const [rows] = await db.execute(
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

    // 2. Cuenta activa?
    if (!user.Usuario_Estado_Cuenta) {
      return res.status(401).json({ error: 'Cuenta deshabilitada' });
    }

    // 3. Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.Usuario_Contraseña);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // 4. Construir roles
    const roles = [];
    if (user.Es_Administrador) roles.push('Administrador');
    if (user.Es_Docente) roles.push('Docente');
    if (user.Es_Apoderado) roles.push('Apoderado');

    // 5. Generar JWT
    const payload = {
      userId: user.Usuario_Id,
      email: user.Usuario_Correo,
      roles
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });

    // 6. Registrar sesión (IP y user-agent)
    const ip = req.ip || req.connection.remoteAddress;
    const dispositivo = req.headers['user-agent'] || 'desconocido';
    const expiracion = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2h

    await db.execute(
      `INSERT INTO sesion
       (Sesion_Token_Acceso, Sesion_Fecha_Inicio, Sesion_Fecha_Expiracion,
        Sesion_Direccion_IP, Sesion_Dispositivo, Sesion_Token_Expiracion, Usuario_Id)
       VALUES (?, NOW(), ?, ?, ?, ?, ?)`,
      [token, expiracion, ip, dispositivo, expiracion, user.Usuario_Id]
    );

    // 7. Responder
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
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};