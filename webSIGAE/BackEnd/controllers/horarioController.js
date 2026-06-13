const pool = require('../config/db');

// ── GET /api/horarios?curso_id=X  (admin ve todo, docente solo el suyo) ──
const getHorarios = async (req, res) => {
  try {
    const { curso_id } = req.query;
    const { id: userId, roles } = req.user;
    const esDocente = roles.includes('Docente') && !roles.includes('Administrador');

    let query = `
      SELECT
        ha.Horario_Asignatura_Id,
        ha.Horario_Asignatura_Dia_Semana  AS dia,
        ha.Horario_Asignatura_Estado      AS estado,
        ha.Curso_Id,
        c.Curso_Nombre                    AS curso,
        ha.Bloque_Horario_Id,
        bh.Bloque_Horario_Hora_Inicio     AS hora_inicio,
        bh.Bloque_Horario_Hora_Fin        AS hora_fin,
        bh.Bloque_Horario_Jornada         AS jornada,
        bh.Bloque_Horario_Tipo            AS tipo_bloque,
        ha.Asignatura_Id,
        a.Asignatura_Nombre               AS asignatura,
        ha.Usuario_Id,
        u.Usuario_Nombre_Completo         AS docente
      FROM horario_asignatura ha
      JOIN curso          c  ON c.Curso_Id          = ha.Curso_Id
      JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
      JOIN asignatura     a  ON a.Asignatura_Id      = ha.Asignatura_Id
      LEFT JOIN usuario   u  ON u.Usuario_Id         = ha.Usuario_Id
      WHERE 1=1
    `;
    const params = [];

    if (esDocente) {
      query += ' AND ha.Usuario_Id = ?';
      params.push(userId);
    }

    if (curso_id) {
      query += ' AND ha.Curso_Id = ?';
      params.push(curso_id);
    }

    query += ' ORDER BY FIELD(ha.Horario_Asignatura_Dia_Semana, "Lunes","Martes","Miércoles","Jueves","Viernes"), bh.Bloque_Horario_Hora_Inicio';

    const [rows] = await pool.execute(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error en getHorarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/horarios/cursos  (lista para el selector) ──
const getCursos = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT c.Curso_Id, c.Curso_Nombre, ne.Nivel_Educativo_Nombre
       FROM curso c
       JOIN nivel_educativo ne ON ne.Nivel_Educativo_Id = c.Nivel_Educativo_Id
       ORDER BY ne.Nivel_Educativo_Nombre, c.Curso_Seccion`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en getCursos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/horarios/bloques  ──
const getBloques = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT Bloque_Horario_Id, Bloque_Horario_Hora_Inicio,
              Bloque_Horario_Hora_Fin, Bloque_Horario_Jornada, Bloque_Horario_Tipo
       FROM bloque_horario
       ORDER BY Bloque_Horario_Hora_Inicio`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en getBloques:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/horarios/asignaturas  ──
const getAsignaturas = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT Asignatura_Id, Asignatura_Nombre, Asignatura_Prioridad_Academica
       FROM asignatura ORDER BY Asignatura_Nombre`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en getAsignaturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/horarios/docentes  ──
const getDocentes = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT Usuario_Id, Usuario_Nombre_Completo, Docente_Especialidad
       FROM usuario
       WHERE Es_Docente = 1 AND Usuario_Estado_Cuenta = 1
       ORDER BY Usuario_Nombre_Completo`
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en getDocentes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── POST /api/horarios  (crear entrada) ──
const createHorario = async (req, res) => {
  const {
    Horario_Asignatura_Dia_Semana,
    Horario_Asignatura_Estado,
    Curso_Id,
    Bloque_Horario_Id,
    Asignatura_Id,
    Usuario_Id,
  } = req.body;

  if (!Horario_Asignatura_Dia_Semana || !Curso_Id || !Bloque_Horario_Id || !Asignatura_Id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    // Verificar que no exista ya ese bloque en ese curso y día
    const [existe] = await pool.execute(
      `SELECT Horario_Asignatura_Id FROM horario_asignatura
       WHERE Curso_Id = ? AND Bloque_Horario_Id = ? AND Horario_Asignatura_Dia_Semana = ?`,
      [Curso_Id, Bloque_Horario_Id, Horario_Asignatura_Dia_Semana]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: 'Ya existe un bloque asignado en ese día y horario para este curso' });
    }

    // Verificar conflicto de docente si se asigna uno
    if (Usuario_Id) {
      const [conflicto] = await pool.execute(
        `SELECT Horario_Asignatura_Id FROM horario_asignatura
         WHERE Usuario_Id = ? AND Bloque_Horario_Id = ? AND Horario_Asignatura_Dia_Semana = ?`,
        [Usuario_Id, Bloque_Horario_Id, Horario_Asignatura_Dia_Semana]
      );
      if (conflicto.length > 0) {
        return res.status(409).json({ error: 'El docente ya tiene una clase asignada en ese día y bloque horario' });
      }
    }

    const [result] = await pool.execute(
      `INSERT INTO horario_asignatura
       (Horario_Asignatura_Dia_Semana, Horario_Asignatura_Estado,
        Curso_Id, Bloque_Horario_Id, Asignatura_Id, Usuario_Id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Horario_Asignatura_Dia_Semana,
        Horario_Asignatura_Estado || 'Activo',
        Curso_Id,
        Bloque_Horario_Id,
        Asignatura_Id,
        Usuario_Id || null,
      ]
    );

    res.status(201).json({ mensaje: 'Horario creado correctamente', id: result.insertId });
  } catch (error) {
    console.error('Error en createHorario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PUT /api/horarios/:id  (editar entrada) ──
const updateHorario = async (req, res) => {
  const { id } = req.params;
  const {
    Horario_Asignatura_Dia_Semana,
    Horario_Asignatura_Estado,
    Curso_Id,
    Bloque_Horario_Id,
    Asignatura_Id,
    Usuario_Id,
  } = req.body;

  try {
    const [existe] = await pool.execute(
      `SELECT Horario_Asignatura_Id FROM horario_asignatura WHERE Horario_Asignatura_Id = ?`,
      [id]
    );
    if (existe.length === 0) {
      return res.status(404).json({ error: 'Entrada de horario no encontrada' });
    }

    // Verificar conflicto de bloque (excluyendo el registro actual)
    const [conflictoCurso] = await pool.execute(
      `SELECT Horario_Asignatura_Id FROM horario_asignatura
       WHERE Curso_Id = ? AND Bloque_Horario_Id = ? AND Horario_Asignatura_Dia_Semana = ?
         AND Horario_Asignatura_Id != ?`,
      [Curso_Id, Bloque_Horario_Id, Horario_Asignatura_Dia_Semana, id]
    );
    if (conflictoCurso.length > 0) {
      return res.status(409).json({ error: 'Ya existe un bloque asignado en ese día y horario para este curso' });
    }

    // Verificar conflicto de docente (excluyendo el registro actual)
    if (Usuario_Id) {
      const [conflictoDocente] = await pool.execute(
        `SELECT Horario_Asignatura_Id FROM horario_asignatura
         WHERE Usuario_Id = ? AND Bloque_Horario_Id = ? AND Horario_Asignatura_Dia_Semana = ?
           AND Horario_Asignatura_Id != ?`,
        [Usuario_Id, Bloque_Horario_Id, Horario_Asignatura_Dia_Semana, id]
      );
      if (conflictoDocente.length > 0) {
        return res.status(409).json({ error: 'El docente ya tiene una clase asignada en ese día y bloque horario' });
      }
    }

    await pool.execute(
      `UPDATE horario_asignatura SET
         Horario_Asignatura_Dia_Semana = ?,
         Horario_Asignatura_Estado     = ?,
         Curso_Id                      = ?,
         Bloque_Horario_Id             = ?,
         Asignatura_Id                 = ?,
         Usuario_Id                    = ?
       WHERE Horario_Asignatura_Id = ?`,
      [
        Horario_Asignatura_Dia_Semana,
        Horario_Asignatura_Estado,
        Curso_Id,
        Bloque_Horario_Id,
        Asignatura_Id,
        Usuario_Id || null,
        id,
      ]
    );

    res.json({ mensaje: 'Horario actualizado correctamente' });
  } catch (error) {
    console.error('Error en updateHorario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── PATCH /api/horarios/:id/estado  (cambiar estado) ──
const cambiarEstado = async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  const estadosValidos = ['Activo', 'Suspendido'];
  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: 'Estado inválido. Use: Activo o Suspendido' });
  }

  try {
    const [existe] = await pool.execute(
      `SELECT Horario_Asignatura_Id FROM horario_asignatura WHERE Horario_Asignatura_Id = ?`,
      [id]
    );
    if (existe.length === 0) {
      return res.status(404).json({ error: 'Entrada de horario no encontrada' });
    }

    await pool.execute(
      `UPDATE horario_asignatura SET Horario_Asignatura_Estado = ? WHERE Horario_Asignatura_Id = ?`,
      [estado, id]
    );

    res.json({ mensaje: `Estado cambiado a ${estado}` });
  } catch (error) {
    console.error('Error en cambiarEstado:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getHorarios, getCursos, getBloques, getAsignaturas, getDocentes, createHorario, updateHorario, cambiarEstado };
