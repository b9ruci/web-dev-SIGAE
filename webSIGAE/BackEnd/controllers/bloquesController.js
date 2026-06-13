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

// ── EVENTOS INSTITUCIONALES ───────────────────────────────────────

const getEventos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM evento_institucional ORDER BY Evento_Institucional_Fecha DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('getEventos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const createEvento = async (req, res) => {
  const { Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases } = req.body;

  if (!Evento_Institucional_Nombre || !Evento_Institucional_Fecha || !Evento_Institucional_Descripcion || !Evento_Institucional_Impacto_Clases) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO evento_institucional
       (Evento_Institucional_Nombre, Evento_Institucional_Fecha,
        Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases)
       VALUES (?, ?, ?, ?)`,
      [Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases]
    );
    res.status(201).json({ mensaje: 'Evento creado correctamente', id: result.insertId });
  } catch (err) {
    console.error('createEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const updateEvento = async (req, res) => {
  const { id } = req.params;
  const { Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases } = req.body;

  if (!Evento_Institucional_Nombre || !Evento_Institucional_Fecha || !Evento_Institucional_Descripcion || !Evento_Institucional_Impacto_Clases) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  try {
    const [result] = await pool.execute(
      `UPDATE evento_institucional SET
         Evento_Institucional_Nombre        = ?,
         Evento_Institucional_Fecha         = ?,
         Evento_Institucional_Descripcion   = ?,
         Evento_Institucional_Impacto_Clases = ?
       WHERE Evento_Institucional_Id = ?`,
      [Evento_Institucional_Nombre, Evento_Institucional_Fecha, Evento_Institucional_Descripcion, Evento_Institucional_Impacto_Clases, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ mensaje: 'Evento actualizado correctamente' });
  } catch (err) {
    console.error('updateEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

const deleteEvento = async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.execute(
      `DELETE FROM evento_institucional WHERE Evento_Institucional_Id = ?`, [id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ mensaje: 'Evento eliminado correctamente' });
  } catch (err) {
    console.error('deleteEvento:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getParametros, updateParametros,
  getBloques, createBloque, updateBloque, deleteBloque,
  getEventos, createEvento, updateEvento, deleteEvento,
};
