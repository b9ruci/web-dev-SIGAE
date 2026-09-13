const pool = require('../config/db');

// ── PARÁMETROS INSTITUCIONALES ────────────────────────────────────

const getParametros = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM parametro_institucional LIMIT 1`
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'No hay parámetros institucionales configurados' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('getParametros:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateParametros = async (req, res) => {
  const {
    Parametro_Institucional_Inicio_Jornada,
    Parametro_Institucional_Fin_Jornada,
    Parametro_Institucional_Duracion_Bloque,
    Parametro_Institucional_Duracion_Recreo,
    Parametro_Institucional_Bloques_Maximos_Diarios,
  } = req.body;

  if (
    !Parametro_Institucional_Inicio_Jornada ||
    !Parametro_Institucional_Fin_Jornada ||
    !Parametro_Institucional_Duracion_Bloque ||
    !Parametro_Institucional_Duracion_Recreo ||
    !Parametro_Institucional_Bloques_Maximos_Diarios
  ) {
    return res.status(400).json({ error: 'Todos los parámetros son obligatorios' });
  }

  const durBloque  = Number(Parametro_Institucional_Duracion_Bloque);
  const durRecreo  = Number(Parametro_Institucional_Duracion_Recreo);
  const maxBloques = Number(Parametro_Institucional_Bloques_Maximos_Diarios);

  if (durBloque < 1 || durRecreo < 0 || maxBloques < 1) {
    return res.status(400).json({ error: 'Valores numéricos inválidos' });
  }

  if (Parametro_Institucional_Inicio_Jornada >= Parametro_Institucional_Fin_Jornada) {
    return res.status(400).json({ error: 'El inicio de jornada debe ser anterior al fin' });
  }

  try {
    const [existing] = await pool.execute(`SELECT Parametro_Institucional_Id FROM parametro_institucional LIMIT 1`);
    if (existing.length === 0) {
      await pool.execute(
        `INSERT INTO parametro_institucional
         (Parametro_Institucional_Inicio_Jornada, Parametro_Institucional_Fin_Jornada,
          Parametro_Institucional_Duracion_Bloque, Parametro_Institucional_Duracion_Recreo,
          Parametro_Institucional_Bloques_Maximos_Diarios)
         VALUES (?, ?, ?, ?, ?)`,
        [Parametro_Institucional_Inicio_Jornada, Parametro_Institucional_Fin_Jornada,
         durBloque, durRecreo, maxBloques]
      );
    } else {
      await pool.execute(
        `UPDATE parametro_institucional SET
           Parametro_Institucional_Inicio_Jornada         = ?,
           Parametro_Institucional_Fin_Jornada            = ?,
           Parametro_Institucional_Duracion_Bloque        = ?,
           Parametro_Institucional_Duracion_Recreo        = ?,
           Parametro_Institucional_Bloques_Maximos_Diarios = ?
         WHERE Parametro_Institucional_Id = ?`,
        [Parametro_Institucional_Inicio_Jornada, Parametro_Institucional_Fin_Jornada,
         durBloque, durRecreo, maxBloques, existing[0].Parametro_Institucional_Id]
      );
    }
    res.json({ mensaje: 'Parámetros actualizados correctamente' });
  } catch (err) {
    console.error('updateParametros:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── BLOQUES HORARIOS ──────────────────────────────────────────────

const getBloques = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT bh.*,
              pi.Parametro_Institucional_Inicio_Jornada AS jornada_inicio,
              pi.Parametro_Institucional_Fin_Jornada    AS jornada_fin
       FROM bloque_horario bh
       JOIN parametro_institucional pi ON pi.Parametro_Institucional_Id = bh.Parametro_Institucional_Id
       ORDER BY bh.Bloque_Horario_Hora_Inicio`
    );
    res.json(rows);
  } catch (err) {
    console.error('getBloques:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createBloque = async (req, res) => {
  const { Bloque_Horario_Hora_Inicio, Bloque_Horario_Hora_Fin, Bloque_Horario_Jornada, Bloque_Horario_Tipo } = req.body;

  if (!Bloque_Horario_Hora_Inicio || !Bloque_Horario_Hora_Fin || !Bloque_Horario_Jornada || !Bloque_Horario_Tipo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (Bloque_Horario_Hora_Inicio >= Bloque_Horario_Hora_Fin) {
    return res.status(400).json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
  }

  try {
    const [param] = await pool.execute(`SELECT * FROM parametro_institucional LIMIT 1`);
    if (param.length === 0) {
      return res.status(400).json({ error: 'Configure los parámetros institucionales antes de crear bloques' });
    }
    const p = param[0];

    // Validar rango institucional
    if (Bloque_Horario_Hora_Inicio < p.Parametro_Institucional_Inicio_Jornada ||
        Bloque_Horario_Hora_Fin    > p.Parametro_Institucional_Fin_Jornada) {
      return res.status(400).json({
        error: `El bloque debe estar dentro del rango institucional: ${p.Parametro_Institucional_Inicio_Jornada.slice(0,5)} – ${p.Parametro_Institucional_Fin_Jornada.slice(0,5)}`
      });
    }

    // Verificar conflicto con bloques existentes
    const [conflicto] = await pool.execute(
      `SELECT Bloque_Horario_Id FROM bloque_horario
       WHERE Bloque_Horario_Hora_Inicio < ? AND Bloque_Horario_Hora_Fin > ?`,
      [Bloque_Horario_Hora_Fin, Bloque_Horario_Hora_Inicio]
    );
    if (conflicto.length > 0) {
      return res.status(409).json({ error: 'El horario se superpone con un bloque existente' });
    }

    const [result] = await pool.execute(
      `INSERT INTO bloque_horario
       (Bloque_Horario_Hora_Inicio, Bloque_Horario_Hora_Fin, Bloque_Horario_Jornada,
        Bloque_Horario_Tipo, Parametro_Institucional_Id)
       VALUES (?, ?, ?, ?, ?)`,
      [Bloque_Horario_Hora_Inicio, Bloque_Horario_Hora_Fin, Bloque_Horario_Jornada,
       Bloque_Horario_Tipo, p.Parametro_Institucional_Id]
    );
    res.status(201).json({ mensaje: 'Bloque creado correctamente', id: result.insertId });
  } catch (err) {
    console.error('createBloque:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateBloque = async (req, res) => {
  const { id } = req.params;
  const { Bloque_Horario_Hora_Inicio, Bloque_Horario_Hora_Fin, Bloque_Horario_Jornada, Bloque_Horario_Tipo } = req.body;

  if (!Bloque_Horario_Hora_Inicio || !Bloque_Horario_Hora_Fin || !Bloque_Horario_Jornada || !Bloque_Horario_Tipo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }
  if (Bloque_Horario_Hora_Inicio >= Bloque_Horario_Hora_Fin) {
    return res.status(400).json({ error: 'La hora de inicio debe ser anterior a la hora de fin' });
  }

  try {
    const [existe] = await pool.execute(
      `SELECT Bloque_Horario_Id, Parametro_Institucional_Id FROM bloque_horario WHERE Bloque_Horario_Id = ?`, [id]
    );
    if (existe.length === 0) return res.status(404).json({ error: 'Bloque no encontrado' });

    const [param] = await pool.execute(`SELECT * FROM parametro_institucional LIMIT 1`);
    const p = param[0];

    if (Bloque_Horario_Hora_Inicio < p.Parametro_Institucional_Inicio_Jornada ||
        Bloque_Horario_Hora_Fin    > p.Parametro_Institucional_Fin_Jornada) {
      return res.status(400).json({
        error: `El bloque debe estar dentro del rango institucional: ${p.Parametro_Institucional_Inicio_Jornada.slice(0,5)} – ${p.Parametro_Institucional_Fin_Jornada.slice(0,5)}`
      });
    }

    const [conflicto] = await pool.execute(
      `SELECT Bloque_Horario_Id FROM bloque_horario
       WHERE Bloque_Horario_Hora_Inicio < ? AND Bloque_Horario_Hora_Fin > ?
         AND Bloque_Horario_Id != ?`,
      [Bloque_Horario_Hora_Fin, Bloque_Horario_Hora_Inicio, id]
    );
    if (conflicto.length > 0) return res.status(409).json({ error: 'El horario se superpone con un bloque existente' });

    await pool.execute(
      `UPDATE bloque_horario SET
         Bloque_Horario_Hora_Inicio = ?,
         Bloque_Horario_Hora_Fin    = ?,
         Bloque_Horario_Jornada     = ?,
         Bloque_Horario_Tipo        = ?
       WHERE Bloque_Horario_Id = ?`,
      [Bloque_Horario_Hora_Inicio, Bloque_Horario_Hora_Fin, Bloque_Horario_Jornada, Bloque_Horario_Tipo, id]
    );
    res.json({ mensaje: 'Bloque actualizado correctamente' });
  } catch (err) {
    console.error('updateBloque:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteBloque = async (req, res) => {
  const { id } = req.params;
  try {
    const [enHorario] = await pool.execute(
      `SELECT Horario_Asignatura_Id FROM horario_asignatura WHERE Bloque_Horario_Id = ? LIMIT 1`, [id]
    );
    if (enHorario.length > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: el bloque está asignado a un horario de curso' });
    }

    const [enEvento] = await pool.execute(
      `SELECT Afecta_Id FROM afecta WHERE Bloque_Horario_Id = ? LIMIT 1`, [id]
    );
    if (enEvento.length > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: el bloque está asociado a un evento institucional' });
    }

    const [result] = await pool.execute(`DELETE FROM bloque_horario WHERE Bloque_Horario_Id = ?`, [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Bloque no encontrado' });
    res.json({ mensaje: 'Bloque eliminado correctamente' });
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'No se puede eliminar: el bloque está referenciado por otros registros' });
    }
    console.error('deleteBloque:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── EVENTOS INSTITUCIONALES (CU70, CU71, CU72) ────────────────────
//
// Regla de negocio aplicada para calcular qué bloques horarios quedan
// "afectados" por un evento (tabla `afecta`). Los bloques (bloque_horario)
// son plantillas de horario genéricas — no están ligadas a una fecha ni
// a un día de la semana — por lo que NO se modifica el horario semanal
// recurrente (horario_asignatura). En su lugar, se deja constancia en
// `afecta` de qué bloques quedan suspendidos ese día puntual del evento:
//
//   - "Sin impacto"       → no se registra ningún bloque afectado.
//   - "Salida anticipada" → se afectan los bloques tipo 'Clase' de la
//                           jornada 'Tarde'.
//   - "Suspensión total"  → se afectan TODOS los bloques tipo 'Clase'.
//
// Si tu equipo definió una regla distinta en el informe, ajusten la
// función registrarBloquesAfectados() más abajo — es el único lugar
// donde vive esta decisión.

async function registrarBloquesAfectados(conn, eventoId, impacto) {
  if (impacto === 'Sin impacto') return [];

  let query = `SELECT Bloque_Horario_Id FROM bloque_horario WHERE Bloque_Horario_Tipo = 'Clase'`;
  if (impacto === 'Salida anticipada') {
    query += ` AND Bloque_Horario_Jornada = 'Tarde'`;
  }
  // 'Suspensión total' → todos los bloques de tipo Clase, sin filtro adicional

  const [bloques] = await conn.execute(query);
  if (bloques.length === 0) return [];

  const placeholders = bloques.map(() => '(?, ?, ?)').join(', ');
  const params = [];
  bloques.forEach((b) => params.push('Suspendido', b.Bloque_Horario_Id, eventoId));

  await conn.execute(
    `INSERT INTO afecta (Estado_Bloque, Bloque_Horario_Id, Evento_Institucional_Id) VALUES ${placeholders}`,
    params
  );

  return bloques.map((b) => b.Bloque_Horario_Id);
}

// GET /api/bloques/eventos — incluye el conteo de bloques afectados por evento
const getEventos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT ei.*,
              COUNT(af.Afecta_Id) AS bloques_afectados_count
       FROM evento_institucional ei
       LEFT JOIN afecta af ON af.Evento_Institucional_Id = ei.Evento_Institucional_Id
       GROUP BY ei.Evento_Institucional_Id
       ORDER BY ei.Evento_Institucional_Fecha DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getEventos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/bloques/eventos/:id/afectados — detalle de bloques afectados (CU70/71)
const getBloquesAfectadosPorEvento = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(
      `SELECT af.Afecta_Id, af.Estado_Bloque, bh.Bloque_Horario_Id,
              bh.Bloque_Horario_Hora_Inicio, bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Jornada
       FROM afecta af
       JOIN bloque_horario bh ON bh.Bloque_Horario_Id = af.Bloque_Horario_Id
       WHERE af.Evento_Institucional_Id = ?
       ORDER BY bh.Bloque_Horario_Hora_Inicio`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error('getBloquesAfectadosPorEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/bloques/eventos — CU70 Registrando eventos institucionales
const createEvento = async (req, res) => {
  const { Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases } = req.body;

  if (!Evento_Institucional_Nombre || !Evento_Institucional_Fecha || !Evento_Institucional_Descripcion || !Evento_Institucional_Impacto_Clases) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const impactosValidos = ['Sin impacto', 'Salida anticipada', 'Suspensión total'];
  if (!impactosValidos.includes(Evento_Institucional_Impacto_Clases)) {
    return res.status(400).json({ error: 'Impacto en clases inválido' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `INSERT INTO evento_institucional
       (Evento_Institucional_Nombre, Evento_Institucional_Fecha,
        Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases)
       VALUES (?, ?, ?, ?)`,
      [Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases]
    );
    const eventoId = result.insertId;

    const bloquesAfectados = await registrarBloquesAfectados(conn, eventoId, Evento_Institucional_Impacto_Clases);

    await conn.commit();
    res.status(201).json({
      mensaje: 'Evento creado correctamente',
      id: eventoId,
      bloques_afectados: bloquesAfectados,
    });
  } catch (err) {
    await conn.rollback();
    console.error('createEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

// PUT /api/bloques/eventos/:id — CU71 Modificando eventos institucionales
const updateEvento = async (req, res) => {
  const { id } = req.params;
  const { Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases } = req.body;

  if (!Evento_Institucional_Nombre || !Evento_Institucional_Fecha || !Evento_Institucional_Descripcion || !Evento_Institucional_Impacto_Clases) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  const impactosValidos = ['Sin impacto', 'Salida anticipada', 'Suspensión total'];
  if (!impactosValidos.includes(Evento_Institucional_Impacto_Clases)) {
    return res.status(400).json({ error: 'Impacto en clases inválido' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [result] = await conn.execute(
      `UPDATE evento_institucional SET
         Evento_Institucional_Nombre        = ?,
         Evento_Institucional_Fecha         = ?,
         Evento_Institucional_Descripcion   = ?,
         Evento_Institucional_Impacto_Clases = ?
       WHERE Evento_Institucional_Id = ?`,
      [Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases, id]
    );

    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Evento no encontrado' });
    }

    // Excepción (CU71): el impacto pudo haber cambiado → se recalculan
    // los bloques afectados desde cero (se descartan los previos).
    await conn.execute(`DELETE FROM afecta WHERE Evento_Institucional_Id = ?`, [id]);
    const bloquesAfectados = await registrarBloquesAfectados(conn, id, Evento_Institucional_Impacto_Clases);

    await conn.commit();
    res.json({ mensaje: 'Evento actualizado correctamente', bloques_afectados: bloquesAfectados });
  } catch (err) {
    await conn.rollback();
    console.error('updateEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

// DELETE /api/bloques/eventos/:id — CU72 Eliminando eventos institucionales
// Nota: la FK fk_Afecta_Evento_Institucional tiene ON DELETE CASCADE,
// por lo que al borrar el evento la BD elimina automáticamente sus
// registros en `afecta` (los bloques quedan liberados sin más acción).
const deleteEvento = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM evento_institucional WHERE Evento_Institucional_Id = ?`, [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ mensaje: 'Evento eliminado correctamente. Los bloques afectados fueron liberados.' });
  } catch (err) {
    console.error('deleteEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getParametros, updateParametros,
  getBloques, createBloque, updateBloque, deleteBloque,
  getEventos, createEvento, updateEvento, deleteEvento,
  getBloquesAfectadosPorEvento,
};