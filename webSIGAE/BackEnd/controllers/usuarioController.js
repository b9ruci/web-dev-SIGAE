// controllers/usuarioController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const { validarCorreoInstitucional } = require('../middleware/validation');

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM usuario');
    const usuarios = rows.map(({ Usuario_Contraseña, ...resto }) => resto);
    res.json(usuarios);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener usuarios' });
  }
};

// Obtener un usuario por ID
const getUsuarioById = async (req, res) => {
  const { id } = req.params;
  const solicitante = req.user;

  const esPropioUsuario = String(solicitante.id) === String(id);
  const esAdmin = (solicitante.roles || []).includes('Administrador');

  if (!esPropioUsuario && !esAdmin) {
    return res.status(403).json({ mensaje: 'No tienes permiso para ver este perfil' });
  }

  try {
    const [rows] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    const { Usuario_Contraseña, ...usuario } = rows[0];
    res.json(usuario);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el usuario' });
  }
};

// Crear usuario — acepta los 3 roles con sus correos específicos
const createUsuario = async (req, res) => {
  const {
    Usuario_RUT,
    Usuario_Telefono,
    Usuario_Nombre_Completo,
    Usuario_Estado_Cuenta,
    Usuario_Contraseña,
    Usuario_Foto_Perfil,
    // Docente
    Es_Docente,
    Docente_Carga_Horaria_Maxima,
    Docente_Especialidad,
    Docente_Correo_Institucional,
    // Administrador
    Es_Administrador,
    Administrador_Tipo,
    Administrador_Correo_Institucional,
    // Apoderado
    Es_Apoderado,
    Apoderado_Direccion,
    Apoderado_Correo_Natural,
  } = req.body;

  // Campos base obligatorios
  if (!Usuario_RUT || !Usuario_Telefono || !Usuario_Nombre_Completo || !Usuario_Contraseña) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios (RUT, teléfono, nombre, contraseña)' });
  }

  // Validar correo según rol
  if (Es_Docente && !Docente_Correo_Institucional)
    return res.status(400).json({ mensaje: 'El correo institucional del docente es obligatorio' });
  if (Es_Docente && !validarCorreoInstitucional(Docente_Correo_Institucional))
    return res.status(400).json({ mensaje: 'El correo institucional del docente debe pertenecer al dominio @jacquescousteau.edu' });
  if (Es_Administrador && !Administrador_Correo_Institucional)
    return res.status(400).json({ mensaje: 'El correo institucional del administrador es obligatorio' });
  if (Es_Administrador && !validarCorreoInstitucional(Administrador_Correo_Institucional))
    return res.status(400).json({ mensaje: 'El correo institucional del administrador debe pertenecer al dominio @jacquescousteau.edu' });
  if (Es_Apoderado && !Apoderado_Correo_Natural)
    return res.status(400).json({ mensaje: 'El correo del apoderado es obligatorio' });

  try {
    
    // Verificar si existe usuario con ese RUT
const [existeRUT] = await db.query(
  `SELECT
      Usuario_Id,
      Es_Administrador,
      Es_Docente,
      Es_Apoderado
   FROM usuario
   WHERE Usuario_RUT = ?`,
  [Usuario_RUT]
);

if (existeRUT.length > 0) {

  const usuario = existeRUT[0];

  if (Es_Docente) {

    if (usuario.Es_Docente) {
      return res.status(400).json({
        mensaje: 'El usuario ya posee el rol Docente'
      });
    }

    return res.status(409).json({
      requiereAsignacionRol: true,
      usuarioId: usuario.Usuario_Id,
      rol: 'Docente',
      mensaje:
        'El usuario ya existe. Debe asignar el rol desde Gestión de Roles.'
    });
  }

  if (Es_Apoderado) {

    if (usuario.Es_Apoderado) {
      return res.status(400).json({
        mensaje: 'El usuario ya posee el rol Apoderado'
      });
    }

    return res.status(409).json({
      requiereAsignacionRol: true,
      usuarioId: usuario.Usuario_Id,
      rol: 'Apoderado',
      mensaje:
        'El usuario ya existe. Debe asignar el rol desde Gestión de Roles.'
    });
  }

  if (Es_Administrador) {

    if (usuario.Es_Administrador) {
      return res.status(400).json({
        mensaje: 'El usuario ya posee el rol Administrador'
      });
    }

    return res.status(409).json({
      requiereAsignacionRol: true,
      usuarioId: usuario.Usuario_Id,
      rol: 'Administrador',
      mensaje:
        'El usuario ya existe. Debe asignar el rol desde Gestión de Roles.'
    });
  }
}

    // Verificar correo duplicado según rol
    if (Es_Docente) {
      const [dup] = await db.query(
        'SELECT Usuario_Id FROM usuario WHERE Docente_Correo_Institucional = ?',
        [Docente_Correo_Institucional]
      );
      if (dup.length > 0)
        return res.status(400).json({ mensaje: 'Ya existe un docente con ese correo institucional' });
    }
    if (Es_Administrador) {
      const [dup] = await db.query(
        'SELECT Usuario_Id FROM usuario WHERE Administrador_Correo_Institucional = ?',
        [Administrador_Correo_Institucional]
      );
      if (dup.length > 0)
        return res.status(400).json({ mensaje: 'Ya existe un administrador con ese correo institucional' });
    }
    if (Es_Apoderado) {
      const [dup] = await db.query(
        'SELECT Usuario_Id FROM usuario WHERE Apoderado_Correo_Natural = ?',
        [Apoderado_Correo_Natural]
      );
      if (dup.length > 0)
        return res.status(400).json({ mensaje: 'Ya existe un apoderado con ese correo' });
    }

    const hash = await bcrypt.hash(Usuario_Contraseña, 10);

    const [resultado] = await db.query(
      `INSERT INTO usuario (
        Usuario_RUT, Usuario_Telefono, Usuario_Nombre_Completo,
        Usuario_Estado_Cuenta, Usuario_Contraseña, Usuario_Foto_Perfil,
        Es_Docente, Docente_Carga_Horaria_Maxima, Docente_Especialidad, Docente_Correo_Institucional,
        Es_Administrador, Administrador_Tipo, Administrador_Correo_Institucional,
        Es_Apoderado, Apoderado_Direccion, Apoderado_Correo_Natural
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        Usuario_RUT,
        Usuario_Telefono,
        Usuario_Nombre_Completo,
        Usuario_Estado_Cuenta !== undefined ? Usuario_Estado_Cuenta : 1,
        hash,
        Usuario_Foto_Perfil || null,
        Es_Docente      ? 1 : 0,
        Docente_Carga_Horaria_Maxima    || null,
        Docente_Especialidad            || null,
        Docente_Correo_Institucional    || null,
        Es_Administrador ? 1 : 0,
        Administrador_Tipo              || null,
        Administrador_Correo_Institucional || null,
        Es_Apoderado    ? 1 : 0,
        Apoderado_Direccion             || null,
        Apoderado_Correo_Natural        || null,
      ]
    );

    const [nuevo] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [resultado.insertId]);
    const { Usuario_Contraseña: pwd, ...usuarioSinPwd } = nuevo[0];
    res.status(201).json(usuarioSinPwd);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al crear el usuario' });
  }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
  const { id } = req.params;
  const solicitante = req.user;

  try {
    const [existe] = await db.query(
      'SELECT Es_Administrador, Administrador_Tipo FROM usuario WHERE Usuario_Id = ?', [id]
    );
    if (existe.length === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const objetivo = existe[0];
    const esSuperAdmin = solicitante.administradorTipo === 'SuperAdmin';
    const esAdmin = (solicitante.roles || []).includes('Administrador');

    // SuperAdmin puede editar Admin, Docente y Apoderado (no a otros SuperAdmin)
    // Admin puede editar solo Docente y Apoderado
    const objetivoEsSuperAdmin = objetivo.Es_Administrador && objetivo.Administrador_Tipo === 'SuperAdmin';
    const objetivoEsAdmin = objetivo.Es_Administrador && objetivo.Administrador_Tipo !== 'SuperAdmin';

    if (objetivoEsSuperAdmin) {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar a un SuperAdministrador' });
    }
    if (objetivoEsAdmin && !esSuperAdmin) {
      return res.status(403).json({ mensaje: 'Solo un SuperAdministrador puede editar a un Administrador' });
    }
    if (!esSuperAdmin && !esAdmin) {
      return res.status(403).json({ mensaje: 'No tienes permiso para editar usuarios' });
    }

    const datosActualizar = { ...req.body };
    delete datosActualizar.Usuario_Id;
    const { Usuario_Contraseña, ...otrosDatos } = datosActualizar;

    // Validar dominio de correos institucionales si se están actualizando
    if (otrosDatos.Docente_Correo_Institucional && !validarCorreoInstitucional(otrosDatos.Docente_Correo_Institucional)) {
      return res.status(400).json({ mensaje: 'El correo institucional del docente debe pertenecer al dominio @jacquescousteau.edu' });
    }
    if (otrosDatos.Administrador_Correo_Institucional && !validarCorreoInstitucional(otrosDatos.Administrador_Correo_Institucional)) {
      return res.status(400).json({ mensaje: 'El correo institucional del administrador debe pertenecer al dominio @jacquescousteau.edu' });
    }

    let hash = null;
    if (Usuario_Contraseña) hash = await bcrypt.hash(Usuario_Contraseña, 10);

    const campos  = Object.keys(otrosDatos).map(c => `${c} = ?`);
    const valores = Object.values(otrosDatos);

    if (hash) { campos.push('Usuario_Contraseña = ?'); valores.push(hash); }
    if (campos.length === 0) return res.status(400).json({ mensaje: 'No hay campos para actualizar' });

    valores.push(id);
    await db.query(`UPDATE usuario SET ${campos.join(', ')} WHERE Usuario_Id = ?`, valores);

    const [actualizado] = await db.query('SELECT * FROM usuario WHERE Usuario_Id = ?', [id]);
    const { Usuario_Contraseña: pwd, ...usuarioSinPwd } = actualizado[0];
    res.json(usuarioSinPwd);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el usuario' });
  }
};

// Eliminar usuario
const deleteUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('DELETE FROM usuario WHERE Usuario_Id = ?', [id]);
    if (resultado.affectedRows === 0) return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2')
      return res.status(409).json({ mensaje: 'No se puede eliminar: el usuario tiene registros relacionados' });
    res.status(500).json({ mensaje: 'Error al eliminar el usuario' });
  }
};

const updateRoles = async (req, res) => {

    const { id } = req.params;

    const {
        Es_Administrador,
        Es_Docente,
        Es_Apoderado,
        Administrador_Tipo
    } = req.body;

    try {

        const [usuario] = await db.query(
            `SELECT Usuario_Id
             FROM usuario
             WHERE Usuario_Id = ?`,
            [id]
        );

        if (usuario.length === 0) {

            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });

        }

        await db.query(
            `UPDATE usuario
             SET
             Es_Administrador = ?,
             Es_Docente = ?,
             Es_Apoderado = ?,
             Administrador_Tipo = ?
             WHERE Usuario_Id = ?`,
            [
                Es_Administrador,
                Es_Docente,
                Es_Apoderado,
                Administrador_Tipo || null,
                id
            ]
        );

        res.json({
            mensaje:
                'Roles actualizados correctamente'
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje:
                'Error al actualizar roles'
        });

    }

};

const toggleEstado = async (req, res) => {
  const { id } = req.params;
  const actorId   = req.user.id;
  const actorTipo = req.user.administradorTipo;

  // Excepción 3 del CU: actor no puede desactivarse a sí mismo
  if (parseInt(id) === actorId) {
    return res.status(403).json({ mensaje: 'No puedes desactivar tu propia cuenta' });
  }

  try {
    const [rows] = await db.query(
      `SELECT Usuario_Estado_Cuenta, Es_Administrador, Administrador_Tipo
       FROM usuario WHERE Usuario_Id = ?`,
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });

    const u = rows[0];

    // CU 23: solo SuperAdmin puede tocar cuentas de administrador
    if (u.Es_Administrador && actorTipo !== 'SuperAdmin') {
      return res.status(403).json({
        mensaje: 'Solo un SuperAdmin puede desactivar o reactivar cuentas de administrador'
      });
    }

    const nuevoEstado = u.Usuario_Estado_Cuenta ? 0 : 1;

    await db.query(
      'UPDATE usuario SET Usuario_Estado_Cuenta = ? WHERE Usuario_Id = ?',
      [nuevoEstado, id]
    );

    // CU 22: al desactivar, invalida todas las sesiones activas del usuario
    if (nuevoEstado === 0) {
      await db.query(
        `UPDATE sesion
         SET Sesion_Estado = 0, Sesion_Fecha_Expiracion = NOW()
         WHERE Usuario_Id = ? AND Sesion_Estado = 1`,
        [id]
      );
    }

    res.json({ mensaje: 'Estado actualizado', estado: nuevoEstado });
  } catch (e) {
    console.error(e);
    res.status(500).json({ mensaje: 'Error al actualizar estado' });
  }
};

module.exports = {
  getUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  updateRoles,
  toggleEstado
};