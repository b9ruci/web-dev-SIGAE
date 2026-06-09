const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/db');

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'El correo es requerido' });
  }

  try {
    // Buscar usuario por cualquiera de los 3 correos posibles
    const [rows] = await pool.execute(
      `SELECT Usuario_Id, Usuario_Nombre_Completo, Usuario_Estado_Cuenta,
              Administrador_Correo_Institucional,
              Docente_Correo_Institucional,
              Apoderado_Correo_Natural
       FROM usuario
       WHERE Administrador_Correo_Institucional = ?
          OR Docente_Correo_Institucional = ?
          OR Apoderado_Correo_Natural = ?`,
      [email, email, email]
    );

    // Siempre responder OK para no revelar si el correo existe
    if (rows.length === 0 || !rows[0].Usuario_Estado_Cuenta) {
      return res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
    }

    const user = rows[0];

    // Invalidar tokens anteriores pendientes del mismo usuario
    await pool.execute(
      `UPDATE solicitud_recuperacion
       SET Solicitud_Recuperacion_Estado = 'Expirado'
       WHERE Usuario_Id = ? AND Solicitud_Recuperacion_Estado = 'En Proceso'`,
      [user.Usuario_Id]
    );

    // Generar token seguro
    const token = crypto.randomBytes(32).toString('hex');
    const ahora = new Date();
    const expiracion = new Date(ahora.getTime() + 60 * 60 * 1000); // 1 hora

    await pool.execute(
      `INSERT INTO solicitud_recuperacion
       (Solicitud_Recuperacion_Fecha_Expiracion, Solicitud_Recuperacion_Token,
        Solicitud_Recuperacion_Fecha_Creacion, Solicitud_Recuperacion_Estado, Usuario_Id)
       VALUES (?, ?, ?, 'En Proceso', ?)`,
      [expiracion, token, ahora, user.Usuario_Id]
    );

    // Construir enlace de recuperación
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    // --- ENVÍO DE CORREO ---
    // En producción usar nodemailer con SMTP real.
    // Por ahora se imprime el link en consola para desarrollo.
    console.log('=== ENLACE DE RECUPERACIÓN ===');
    console.log(`Usuario: ${user.Usuario_Nombre_Completo} (${email})`);
    console.log(`Link: ${resetLink}`);
    console.log('==============================');

    // Si tienes nodemailer configurado, descomenta:
    // await transporter.sendMail({
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: 'Recuperación de contraseña - SIGAE',
    //   html: `<p>Hola ${user.Usuario_Nombre_Completo},</p>
    //          <p>Haz clic en el siguiente enlace para restablecer tu contraseña (válido por 1 hora):</p>
    //          <a href="${resetLink}">${resetLink}</a>`,
    // });

    res.json({ message: 'Si el correo existe, recibirás un enlace de recuperación.' });
  } catch (error) {
    console.error('Error en forgotPassword:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    // Buscar el token válido y no expirado
    const [rows] = await pool.execute(
      `SELECT Solicitud_Recuperacion_Id, Usuario_Id,
              Solicitud_Recuperacion_Fecha_Expiracion, Solicitud_Recuperacion_Estado
       FROM solicitud_recuperacion
       WHERE Solicitud_Recuperacion_Token = ?
         AND Solicitud_Recuperacion_Estado = 'En Proceso'`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Token inválido o ya utilizado' });
    }

    const solicitud = rows[0];

    // Verificar expiración
    if (new Date() > new Date(solicitud.Solicitud_Recuperacion_Fecha_Expiracion)) {
      await pool.execute(
        `UPDATE solicitud_recuperacion SET Solicitud_Recuperacion_Estado = 'Expirado'
         WHERE Solicitud_Recuperacion_Id = ?`,
        [solicitud.Solicitud_Recuperacion_Id]
      );
      return res.status(400).json({ error: 'El enlace de recuperación ha expirado. Solicita uno nuevo.' });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña en usuario
    await pool.execute(
      `UPDATE usuario SET Usuario_Contraseña = ? WHERE Usuario_Id = ?`,
      [hashedPassword, solicitud.Usuario_Id]
    );

    // Marcar token como Utilizado (consistente con los datos de ejemplo en la BD)
    await pool.execute(
      `UPDATE solicitud_recuperacion SET Solicitud_Recuperacion_Estado = 'Utilizado'
       WHERE Solicitud_Recuperacion_Id = ?`,
      [solicitud.Solicitud_Recuperacion_Id]
    );

    // Invalidar todas las sesiones activas del usuario por seguridad
    await pool.execute(
      `UPDATE sesion SET Sesion_Estado = 0
       WHERE Usuario_Id = ? AND Sesion_Estado = 1`,
      [solicitud.Usuario_Id]
    );

    res.json({ message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' });
  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/auth/validate-reset-token?token=...
const validateResetToken = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ valid: false, error: 'Token requerido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT Solicitud_Recuperacion_Fecha_Expiracion, Solicitud_Recuperacion_Estado
       FROM solicitud_recuperacion
       WHERE Solicitud_Recuperacion_Token = ?
         AND Solicitud_Recuperacion_Estado = 'En Proceso'`,
      [token]
    );

    if (rows.length === 0) {
      return res.json({ valid: false, error: 'Token inválido o ya utilizado' });
    }

    if (new Date() > new Date(rows[0].Solicitud_Recuperacion_Fecha_Expiracion)) {
      return res.json({ valid: false, error: 'El enlace ha expirado' });
    }

    res.json({ valid: true });
  } catch (error) {
    console.error('Error en validateResetToken:', error);
    res.status(500).json({ valid: false, error: 'Error interno del servidor' });
  }
};

// PUT /api/auth/cambiar-contrasena
// Body: { usuarioId, contrasenaActual, nuevaContrasena }
// Headers: Authorization Bearer token
const cambiarContrasena = async (req, res) => {
  const { usuarioId, contrasenaActual, nuevaContrasena } = req.body;
  if (!usuarioId || !contrasenaActual || !nuevaContrasena)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  if (nuevaContrasena.length < 8)
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  const hasUpper = /[A-Z]/.test(nuevaContrasena);
  const hasNum   = /[0-9]/.test(nuevaContrasena);
  if (!hasUpper || !hasNum)
    return res.status(400).json({ error: 'La contraseña debe contener al menos una mayúscula y un número' });
  try {
    const [rows] = await pool.execute(
      'SELECT Usuario_Contraseña FROM usuario WHERE Usuario_Id = ?', [usuarioId]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const valida = await bcrypt.compare(contrasenaActual, rows[0].Usuario_Contraseña);
    if (!valida) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    const hash = await bcrypt.hash(nuevaContrasena, 10);
    await pool.execute('UPDATE usuario SET Usuario_Contraseña = ? WHERE Usuario_Id = ?', [hash, usuarioId]);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { forgotPassword, resetPassword, validateResetToken, cambiarContrasena };
