const pool = require('../config/db');

/**
 * Obtiene las conversaciones del usuario autenticado.
 *
 * Un usuario puede participar como:
 * - Docente
 * - Apoderado
 *
 * Un Administrador puede visualizar todas las conversaciones.
 */
const obtenerConversaciones = async (req, res) => {
  const usuarioId = req.user.id;
  const roles = req.user.roles || [];

  try {
    let where = '';
    let parametros = [];

    if (roles.includes('Administrador')) {
      // El administrador puede visualizar todas las conversaciones.
      where = '';
    } else if (roles.includes('Docente')) {
      where = 'WHERE c.Docente_Usuario_Id = ?';
      parametros = [usuarioId];
    } else if (roles.includes('Apoderado')) {
      where = 'WHERE c.Apoderado_Usuario_Id = ?';
      parametros = [usuarioId];
    } else {
      return res.status(403).json({
        mensaje: 'No tienes permisos para acceder a los mensajes'
      });
    }

    const [rows] = await pool.query(
      `
      SELECT
        c.Conversacion_Id,
        c.Conversacion_Fecha_Inicio,
        c.Conversacion_Estado,

        c.Docente_Usuario_Id,
        docente.Usuario_Nombre_Completo AS Docente_Nombre,

        c.Apoderado_Usuario_Id,
        apoderado.Usuario_Nombre_Completo AS Apoderado_Nombre,

        (
          SELECT m.Mensaje_Contenido
          FROM mensaje m
          WHERE m.Conversacion_Id = c.Conversacion_Id
          ORDER BY m.Mensaje_Fecha_Envio DESC,
                   m.Mensaje_Hora_Envio DESC,
                   m.Mensaje_Id DESC
          LIMIT 1
        ) AS Ultimo_Mensaje,

        (
          SELECT m.Mensaje_Estado
          FROM mensaje m
          WHERE m.Conversacion_Id = c.Conversacion_Id
          ORDER BY m.Mensaje_Fecha_Envio DESC,
                   m.Mensaje_Hora_Envio DESC,
                   m.Mensaje_Id DESC
          LIMIT 1
        ) AS Estado_Ultimo_Mensaje

      FROM conversacion c

      INNER JOIN usuario docente
        ON docente.Usuario_Id = c.Docente_Usuario_Id

      INNER JOIN usuario apoderado
        ON apoderado.Usuario_Id = c.Apoderado_Usuario_Id

      ${where}

      ORDER BY c.Conversacion_Id DESC
      `,
      parametros
    );

    return res.json(rows);

  } catch (error) {
    console.error('Error al obtener conversaciones:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener las conversaciones'
    });
  }
};


/**
 * Obtiene los mensajes de una conversación.
 */
const obtenerMensajes = async (req, res) => {
  const usuarioId = req.user.id;
  const roles = req.user.roles || [];
  const esAdministrador = roles.includes('Administrador');

  const conversacionId = Number(req.params.id);

  if (!Number.isInteger(conversacionId) || conversacionId <= 0) {
    return res.status(400).json({
      mensaje: 'ID de conversación inválido'
    });
  }

  try {
    let whereAcceso = `
      AND (
        Docente_Usuario_Id = ?
        OR Apoderado_Usuario_Id = ?
      )
    `;

    let parametros = [
      conversacionId,
      usuarioId,
      usuarioId
    ];

    if (esAdministrador) {
      whereAcceso = '';
      parametros = [conversacionId];
    }

    const [conversaciones] = await pool.query(
      `
      SELECT
        Conversacion_Id,
        Docente_Usuario_Id,
        Apoderado_Usuario_Id,
        Conversacion_Estado
      FROM conversacion
      WHERE Conversacion_Id = ?
      ${whereAcceso}
      LIMIT 1
      `,
      parametros
    );

    if (conversaciones.length === 0) {
      return res.status(404).json({
        mensaje: 'Conversación no encontrada o no tienes acceso'
      });
    }

    const [mensajes] = await pool.query(
      `
      SELECT
        m.Mensaje_Id,
        m.Mensaje_Contenido,
        m.Mensaje_Fecha_Envio,
        m.Mensaje_Hora_Envio,
        m.Mensaje_Estado,
        m.Mensaje_Remitente_Rol,
        m.Conversacion_Id,

        CASE
          WHEN m.Mensaje_Remitente_Rol = 'Docente'
            THEN c.Docente_Usuario_Id
          WHEN m.Mensaje_Remitente_Rol = 'Apoderado'
            THEN c.Apoderado_Usuario_Id
          ELSE NULL
        END AS Remitente_Usuario_Id

      FROM mensaje m

      INNER JOIN conversacion c
        ON c.Conversacion_Id = m.Conversacion_Id

      WHERE m.Conversacion_Id = ?

      ORDER BY
        m.Mensaje_Fecha_Envio ASC,
        m.Mensaje_Hora_Envio ASC,
        m.Mensaje_Id ASC
      `,
      [conversacionId]
    );

    return res.json({
      conversacion: conversaciones[0],
      mensajes
    });

  } catch (error) {
    console.error('Error al obtener mensajes:', error);

    return res.status(500).json({
      mensaje: 'Error interno al obtener los mensajes'
    });
  }
};


/**
 * Envía un mensaje dentro de una conversación.
 *
 * Solo Docentes y Apoderados pueden enviar mensajes.
 */
const enviarMensaje = async (req, res) => {
  const usuarioId = req.user.id;
  const roles = req.user.roles || [];

  const conversacionId = Number(req.params.id);

  const contenido = typeof req.body.contenido === 'string'
    ? req.body.contenido.trim()
    : '';

  if (!Number.isInteger(conversacionId) || conversacionId <= 0) {
    return res.status(400).json({
      mensaje: 'ID de conversación inválido'
    });
  }

  if (!contenido) {
    return res.status(400).json({
      mensaje: 'El contenido del mensaje es obligatorio'
    });
  }

  if (contenido.length > 5000) {
    return res.status(400).json({
      mensaje: 'El mensaje no puede superar los 5000 caracteres'
    });
  }

  let rolRemitente;

  if (roles.includes('Docente')) {
    rolRemitente = 'Docente';
  } else if (roles.includes('Apoderado')) {
    rolRemitente = 'Apoderado';
  } else {
    return res.status(403).json({
      mensaje: 'Solo docentes y apoderados pueden enviar mensajes'
    });
  }

  try {
    const [conversaciones] = await pool.query(
      `
      SELECT
        Conversacion_Id,
        Docente_Usuario_Id,
        Apoderado_Usuario_Id,
        Conversacion_Estado
      FROM conversacion
      WHERE Conversacion_Id = ?
        AND (
          Docente_Usuario_Id = ?
          OR Apoderado_Usuario_Id = ?
        )
      LIMIT 1
      `,
      [conversacionId, usuarioId, usuarioId]
    );

    if (conversaciones.length === 0) {
      return res.status(404).json({
        mensaje: 'Conversación no encontrada o no tienes acceso'
      });
    }

    const conversacion = conversaciones[0];

    if (
      rolRemitente === 'Docente' &&
      conversacion.Docente_Usuario_Id !== usuarioId
    ) {
      return res.status(403).json({
        mensaje: 'No puedes enviar mensajes como docente en esta conversación'
      });
    }

    if (
      rolRemitente === 'Apoderado' &&
      conversacion.Apoderado_Usuario_Id !== usuarioId
    ) {
      return res.status(403).json({
        mensaje: 'No puedes enviar mensajes como apoderado en esta conversación'
      });
    }

    if (!conversacion.Conversacion_Estado) {
      return res.status(409).json({
        mensaje: 'La conversación está cerrada'
      });
    }

    const ahora = new Date();

    const fecha = ahora.toISOString().slice(0, 10);
    const hora = ahora.toTimeString().slice(0, 8);

    const [resultado] = await pool.query(
      `
      INSERT INTO mensaje (
        Mensaje_Contenido,
        Mensaje_Fecha_Envio,
        Mensaje_Hora_Envio,
        Mensaje_Estado,
        Mensaje_Remitente_Rol,
        Conversacion_Id
      )
      VALUES (?, ?, ?, 'No leído', ?, ?)
      `,
      [
        contenido,
        fecha,
        hora,
        rolRemitente,
        conversacionId
      ]
    );

    return res.status(201).json({
      mensaje: 'Mensaje enviado correctamente',
      mensajeId: resultado.insertId
    });

  } catch (error) {
    console.error('Error al enviar mensaje:', error);

    return res.status(500).json({
      mensaje: 'Error interno al enviar el mensaje'
    });
  }
};


/**
 * Marca como leídos los mensajes recibidos
 * dentro de una conversación.
 */
const marcarMensajesLeidos = async (req, res) => {
  const usuarioId = req.user.id;
  const roles = req.user.roles || [];
  const esAdministrador = roles.includes('Administrador');

  const conversacionId = Number(req.params.id);

  if (!Number.isInteger(conversacionId) || conversacionId <= 0) {
    return res.status(400).json({
      mensaje: 'ID de conversación inválido'
    });
  }

  try {
    let whereAcceso = `
      AND (
        Docente_Usuario_Id = ?
        OR Apoderado_Usuario_Id = ?
      )
    `;

    let parametros = [
      conversacionId,
      usuarioId,
      usuarioId
    ];

    if (esAdministrador) {
      whereAcceso = '';
      parametros = [conversacionId];
    }

    const [conversaciones] = await pool.query(
      `
      SELECT
        Conversacion_Id,
        Docente_Usuario_Id,
        Apoderado_Usuario_Id
      FROM conversacion
      WHERE Conversacion_Id = ?
      ${whereAcceso}
      LIMIT 1
      `,
      parametros
    );

    if (conversaciones.length === 0) {
      return res.status(404).json({
        mensaje: 'Conversación no encontrada o no tienes acceso'
      });
    }

    const conversacion = conversaciones[0];

    // Un administrador puede visualizar conversaciones,
    // pero no tiene un rol de remitente dentro de ellas.
    if (esAdministrador) {
      return res.json({
        mensaje: 'Los mensajes pueden ser visualizados por el administrador',
        actualizados: 0
      });
    }

    let rolUsuario;

    if (conversacion.Docente_Usuario_Id === usuarioId) {
      rolUsuario = 'Docente';
    } else {
      rolUsuario = 'Apoderado';
    }

    const [resultado] = await pool.query(
      `
      UPDATE mensaje
      SET Mensaje_Estado = 'Leído'
      WHERE Conversacion_Id = ?
        AND Mensaje_Remitente_Rol <> ?
        AND Mensaje_Estado = 'No leído'
      `,
      [conversacionId, rolUsuario]
    );

    return res.json({
      mensaje: 'Mensajes marcados como leídos',
      actualizados: resultado.affectedRows
    });

  } catch (error) {
    console.error('Error al marcar mensajes como leídos:', error);

    return res.status(500).json({
      mensaje: 'Error interno al marcar los mensajes como leídos'
    });
  }
};


module.exports = {
  obtenerConversaciones,
  obtenerMensajes,
  enviarMensaje,
  marcarMensajesLeidos
};