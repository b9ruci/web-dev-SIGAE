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

// ── GET /api/horarios/asignaturas-curso?curso_id=X  ──
// Returns asignaturas from the active plan for a course, with hours required and programmed
const getAsignaturasCurso = async (req, res) => {
  const { curso_id } = req.query;
  if (!curso_id) return res.status(400).json({ error: 'curso_id requerido' });

  try {
    const [[curso]] = await pool.execute(
      'SELECT Nivel_Educativo_Id FROM curso WHERE Curso_Id = ?',
      [curso_id]
    );
    if (!curso) return res.status(404).json({ error: 'Curso no encontrado' });

    const [[plan]] = await pool.execute(
      `SELECT Plan_Educativo_Id FROM plan_educativo
       WHERE Nivel_Educativo_Id = ?
       ORDER BY Plan_Educativo_Periodo_Lectivo DESC LIMIT 1`,
      [curso.Nivel_Educativo_Id]
    );

    if (!plan) return res.json([]);

    const [rows] = await pool.execute(
      `SELECT
        ia.Asignatura_Id,
        a.Asignatura_Nombre,
        ia.Horas_Semanales_Requeridas,
        COALESCE(prog.Horas_Programadas, 0) AS Horas_Programadas
       FROM incluyeasig ia
       JOIN asignatura a  ON a.Asignatura_Id  = ia.Asignatura_Id
       JOIN tieneasig  ta ON ta.Asignatura_Id = ia.Asignatura_Id
                         AND ta.Curso_Id       = ?
                         AND ta.Estado_Asignacion = 'Activa'
       LEFT JOIN (
         SELECT ha.Asignatura_Id,
           SUM(TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600) AS Horas_Programadas
         FROM horario_asignatura ha
         JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
         WHERE ha.Curso_Id = ? AND ha.Horario_Asignatura_Estado = 'Activo'
         GROUP BY ha.Asignatura_Id
       ) prog ON prog.Asignatura_Id = ia.Asignatura_Id
       WHERE ia.Plan_Educativo_Id = ?
       ORDER BY a.Asignatura_Nombre`,
      [curso_id, curso_id, plan.Plan_Educativo_Id]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error en getAsignaturasCurso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/horarios/docentes  ──
const getDocentes = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT Usuario_Id, Usuario_Nombre_Completo, Docente_Especialidad,
              Docente_Carga_Horaria_Maxima
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

// ── GET /api/horarios/docentes-disponibles  ── CU 56
// Devuelve todos los docentes activos enriquecidos con:
//   conflicto_horario, excede_carga, carga_actual, carga_nueva, disponible
// El frontend calcula coincide_especialidad comparando el texto.
const getDocentesDisponibles = async (req, res) => {
  const { asignatura_id, bloque_id, dia, horario_id } = req.query;

  if (!bloque_id || !dia) {
    return res.status(400).json({ error: 'bloque_id y dia son obligatorios' });
  }

  try {
    const [docentes] = await pool.execute(
      `SELECT Usuario_Id, Usuario_Nombre_Completo, Docente_Especialidad,
              Docente_Carga_Horaria_Maxima
       FROM usuario
       WHERE Es_Docente = 1 AND Usuario_Estado_Cuenta = 1
       ORDER BY Usuario_Nombre_Completo`
    );

    if (docentes.length === 0) return res.json([]);

    // Duración del bloque nuevo (en horas)
    const [bloqueInfo] = await pool.execute(
      `SELECT TIME_TO_SEC(TIMEDIFF(Bloque_Horario_Hora_Fin, Bloque_Horario_Hora_Inicio)) / 3600
         AS duracion_horas
       FROM bloque_horario WHERE Bloque_Horario_Id = ?`,
      [bloque_id]
    );
    const duracionNueva = bloqueInfo.length > 0 ? Number(bloqueInfo[0].duracion_horas) : 0;

    const userIds    = docentes.map(d => d.Usuario_Id);
    const phList     = userIds.map(() => '?').join(',');
    const excludeId  = horario_id ? parseInt(horario_id, 10) : null;

    // Docentes con conflicto en ese día+bloque
    let conflictoQuery =
      `SELECT DISTINCT ha.Usuario_Id
       FROM horario_asignatura ha
       WHERE ha.Usuario_Id IN (${phList})
         AND ha.Bloque_Horario_Id = ?
         AND ha.Horario_Asignatura_Dia_Semana = ?
         AND ha.Horario_Asignatura_Estado = 'Activo'`;
    const conflictoParams = [...userIds, bloque_id, dia];
    if (excludeId) { conflictoQuery += ' AND ha.Horario_Asignatura_Id != ?'; conflictoParams.push(excludeId); }

    const [conflictos] = await pool.execute(conflictoQuery, conflictoParams);
    const conflictoSet = new Set(conflictos.map(c => c.Usuario_Id));

    // Carga horaria semanal actual de cada docente
    let cargaQuery =
      `SELECT ha.Usuario_Id,
              COALESCE(SUM(
                TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600
              ), 0) AS horas_actuales
       FROM horario_asignatura ha
       JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
       WHERE ha.Usuario_Id IN (${phList})
         AND ha.Horario_Asignatura_Estado = 'Activo'`;
    const cargaParams = [...userIds];
    if (excludeId) { cargaQuery += ' AND ha.Horario_Asignatura_Id != ?'; cargaParams.push(excludeId); }
    cargaQuery += ' GROUP BY ha.Usuario_Id';

    const [cargas] = await pool.execute(cargaQuery, cargaParams);
    const cargaMap = Object.fromEntries(cargas.map(c => [c.Usuario_Id, Number(c.horas_actuales)]));

    const resultado = docentes.map(d => {
      const cargaActual   = Math.round((cargaMap[d.Usuario_Id] || 0) * 100) / 100;
      const cargaMaxima   = d.Docente_Carga_Horaria_Maxima ?? null;
      const conflicto     = conflictoSet.has(d.Usuario_Id);
      const excedeCarga   = cargaMaxima !== null && (cargaActual + duracionNueva) > cargaMaxima;

      return {
        Usuario_Id:              d.Usuario_Id,
        Usuario_Nombre_Completo: d.Usuario_Nombre_Completo,
        Docente_Especialidad:    d.Docente_Especialidad,
        Docente_Carga_Horaria_Maxima: cargaMaxima,
        carga_actual:   cargaActual,
        carga_nueva:    Math.round((cargaActual + duracionNueva) * 100) / 100,
        conflicto_horario: conflicto,
        excede_carga:      excedeCarga,
        disponible:        !conflicto && !excedeCarga,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error en getDocentesDisponibles:', error);
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

    // ── Excepción 5: Restricciones institucionales (tipo de bloque y límite diario) ──
    const [[bloqueRestriccion]] = await pool.execute(
      `SELECT bh.Bloque_Horario_Tipo,
              pi.Parametro_Institucional_Bloques_Maximos_Diarios,
              TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600 AS duracion_horas
       FROM bloque_horario bh
       JOIN parametro_institucional pi ON pi.Parametro_Institucional_Id = bh.Parametro_Institucional_Id
       WHERE bh.Bloque_Horario_Id = ?`,
      [Bloque_Horario_Id]
    );

    if (!bloqueRestriccion) {
      return res.status(404).json({ error: 'Bloque horario no encontrado' });
    }

    if (bloqueRestriccion.Bloque_Horario_Tipo === 'Recreo') {
      return res.status(422).json({ error: 'No se pueden programar clases en bloques de recreo' });
    }

    const [[{ total_dia }]] = await pool.execute(
      `SELECT COUNT(*) AS total_dia FROM horario_asignatura
       WHERE Curso_Id = ? AND Horario_Asignatura_Dia_Semana = ? AND Horario_Asignatura_Estado = 'Activo'`,
      [Curso_Id, Horario_Asignatura_Dia_Semana]
    );
    if (total_dia >= bloqueRestriccion.Parametro_Institucional_Bloques_Maximos_Diarios) {
      return res.status(422).json({
        error: `El curso ya alcanzó el máximo de ${bloqueRestriccion.Parametro_Institucional_Bloques_Maximos_Diarios} bloque(s) diarios establecido por la institución`
      });
    }

    // ── Excepción 1/2/3 (CU53 + CU54): Plan educativo, pertenencia y horas ──
    const [[cursoNivel]] = await pool.execute(
      'SELECT Nivel_Educativo_Id FROM curso WHERE Curso_Id = ?',
      [Curso_Id]
    );

    if (!cursoNivel) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Precondición CU54: la asignatura debe estar asociada al curso (via CU53 / tieneasig)
    const [[asigEnCurso]] = await pool.execute(
      `SELECT tieneasig_Id FROM tieneasig
       WHERE Curso_Id = ? AND Asignatura_Id = ? AND Estado_Asignacion = 'Activa'`,
      [Curso_Id, Asignatura_Id]
    );
    if (!asigEnCurso) {
      return res.status(422).json({
        error: 'La asignatura no está asociada a este curso. Primero debe asociarla desde el módulo de Cursos'
      });
    }

    // E2 (CU53): la asignatura debe pertenecer al plan del nivel del curso
    const [[asigEnPlan]] = await pool.execute(
      `SELECT ia.Asignatura_Id, ia.Horas_Semanales_Requeridas
       FROM incluyeasig ia
       JOIN plan_educativo pe ON pe.Plan_Educativo_Id = ia.Plan_Educativo_Id
       WHERE pe.Nivel_Educativo_Id = ? AND ia.Asignatura_Id = ?
       ORDER BY pe.Plan_Educativo_Periodo_Lectivo DESC LIMIT 1`,
      [cursoNivel.Nivel_Educativo_Id, Asignatura_Id]
    );

    if (!asigEnPlan) {
      return res.status(422).json({
        error: 'La asignatura no pertenece al plan educativo del nivel del curso seleccionado'
      });
    }

    // E3 (CU54): no superar horas semanales requeridas
    {
      const [[{ horas_ya_programadas }]] = await pool.execute(
        `SELECT COALESCE(SUM(
           TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600
         ), 0) AS horas_ya_programadas
         FROM horario_asignatura ha
         JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
         WHERE ha.Curso_Id = ? AND ha.Asignatura_Id = ? AND ha.Horario_Asignatura_Estado = 'Activo'`,
        [Curso_Id, Asignatura_Id]
      );

      const nuevaDuracion = Number(bloqueRestriccion.duracion_horas);
      const totalConNuevo = Number(horas_ya_programadas) + nuevaDuracion;

      if (totalConNuevo > asigEnPlan.Horas_Semanales_Requeridas) {
        return res.status(422).json({
          error: `La asignatura requiere ${asigEnPlan.Horas_Semanales_Requeridas}h semanales según el plan educativo. ` +
                 `Ya tiene ${Number(horas_ya_programadas).toFixed(1)}h programadas; ` +
                 `agregar este bloque (${nuevaDuracion.toFixed(1)}h) excedería el límite`
        });
      }
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

      // Verificar carga horaria máxima
      const [[docente]] = await pool.execute(
        'SELECT Docente_Carga_Horaria_Maxima FROM usuario WHERE Usuario_Id = ? AND Es_Docente = 1',
        [Usuario_Id]
      );
      if (docente?.Docente_Carga_Horaria_Maxima != null) {
        const [[bloqueDur]] = await pool.execute(
          `SELECT TIME_TO_SEC(TIMEDIFF(Bloque_Horario_Hora_Fin, Bloque_Horario_Hora_Inicio)) / 3600
             AS duracion FROM bloque_horario WHERE Bloque_Horario_Id = ?`,
          [Bloque_Horario_Id]
        );
        const [[cargaRow]] = await pool.execute(
          `SELECT COALESCE(SUM(
             TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600
           ), 0) AS horas_actuales
           FROM horario_asignatura ha
           JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
           WHERE ha.Usuario_Id = ? AND ha.Horario_Asignatura_Estado = 'Activo'`,
          [Usuario_Id]
        );
        const horasActuales = Number(cargaRow.horas_actuales);
        const duracion      = Number(bloqueDur?.duracion || 0);
        const maxHoras      = Number(docente.Docente_Carga_Horaria_Maxima);
        if ((horasActuales + duracion) > maxHoras) {
          return res.status(422).json({
            error: `El docente excedería su carga horaria máxima de ${maxHoras}h semanales `
                 + `(actual: ${horasActuales.toFixed(1)}h, este bloque añade: ${duracion.toFixed(1)}h)`,
          });
        }
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

    // ── Excepción 5: Restricciones institucionales (tipo de bloque y límite diario) ──
    const [[bloqueRestriccionU]] = await pool.execute(
      `SELECT bh.Bloque_Horario_Tipo,
              pi.Parametro_Institucional_Bloques_Maximos_Diarios,
              TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600 AS duracion_horas
       FROM bloque_horario bh
       JOIN parametro_institucional pi ON pi.Parametro_Institucional_Id = bh.Parametro_Institucional_Id
       WHERE bh.Bloque_Horario_Id = ?`,
      [Bloque_Horario_Id]
    );

    if (!bloqueRestriccionU) {
      return res.status(404).json({ error: 'Bloque horario no encontrado' });
    }

    if (bloqueRestriccionU.Bloque_Horario_Tipo === 'Recreo') {
      return res.status(422).json({ error: 'No se pueden programar clases en bloques de recreo' });
    }

    const [[{ total_dia_u }]] = await pool.execute(
      `SELECT COUNT(*) AS total_dia_u FROM horario_asignatura
       WHERE Curso_Id = ? AND Horario_Asignatura_Dia_Semana = ?
         AND Horario_Asignatura_Estado = 'Activo' AND Horario_Asignatura_Id != ?`,
      [Curso_Id, Horario_Asignatura_Dia_Semana, id]
    );
    if (total_dia_u >= bloqueRestriccionU.Parametro_Institucional_Bloques_Maximos_Diarios) {
      return res.status(422).json({
        error: `El curso ya alcanzó el máximo de ${bloqueRestriccionU.Parametro_Institucional_Bloques_Maximos_Diarios} bloque(s) diarios establecido por la institución`
      });
    }

    // ── Excepción 1/2/3 (CU53 + CU54): Plan educativo, pertenencia y horas ──
    const [[cursoNivelU]] = await pool.execute(
      'SELECT Nivel_Educativo_Id FROM curso WHERE Curso_Id = ?',
      [Curso_Id]
    );

    if (!cursoNivelU) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Precondición CU54: la asignatura debe estar asociada al curso (via CU53 / tieneasig)
    const [[asigEnCursoU]] = await pool.execute(
      `SELECT tieneasig_Id FROM tieneasig
       WHERE Curso_Id = ? AND Asignatura_Id = ? AND Estado_Asignacion = 'Activa'`,
      [Curso_Id, Asignatura_Id]
    );
    if (!asigEnCursoU) {
      return res.status(422).json({
        error: 'La asignatura no está asociada a este curso. Primero debe asociarla desde el módulo de Cursos'
      });
    }

    // E2 (CU53): la asignatura debe pertenecer al plan del nivel del curso
    const [[asigEnPlanU]] = await pool.execute(
      `SELECT ia.Asignatura_Id, ia.Horas_Semanales_Requeridas
       FROM incluyeasig ia
       JOIN plan_educativo pe ON pe.Plan_Educativo_Id = ia.Plan_Educativo_Id
       WHERE pe.Nivel_Educativo_Id = ? AND ia.Asignatura_Id = ?
       ORDER BY pe.Plan_Educativo_Periodo_Lectivo DESC LIMIT 1`,
      [cursoNivelU.Nivel_Educativo_Id, Asignatura_Id]
    );

    if (!asigEnPlanU) {
      return res.status(422).json({
        error: 'La asignatura no pertenece al plan educativo del nivel del curso seleccionado'
      });
    }

    // E3 (CU54): no superar horas semanales requeridas (excluye el registro editado)
    {
      const [[{ horas_ya_programadas_u }]] = await pool.execute(
        `SELECT COALESCE(SUM(
           TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600
         ), 0) AS horas_ya_programadas_u
         FROM horario_asignatura ha
         JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
         WHERE ha.Curso_Id = ? AND ha.Asignatura_Id = ? AND ha.Horario_Asignatura_Estado = 'Activo'
           AND ha.Horario_Asignatura_Id != ?`,
        [Curso_Id, Asignatura_Id, id]
      );

      const nuevaDuracionU = Number(bloqueRestriccionU.duracion_horas);
      const totalConNuevoU = Number(horas_ya_programadas_u) + nuevaDuracionU;

      if (totalConNuevoU > asigEnPlanU.Horas_Semanales_Requeridas) {
        return res.status(422).json({
          error: `La asignatura requiere ${asigEnPlanU.Horas_Semanales_Requeridas}h semanales según el plan educativo. ` +
                 `Ya tiene ${Number(horas_ya_programadas_u).toFixed(1)}h programadas; ` +
                 `agregar este bloque (${nuevaDuracionU.toFixed(1)}h) excedería el límite`
        });
      }
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

      // Verificar carga horaria máxima (excluyendo el registro editado)
      const [[docente]] = await pool.execute(
        'SELECT Docente_Carga_Horaria_Maxima FROM usuario WHERE Usuario_Id = ? AND Es_Docente = 1',
        [Usuario_Id]
      );
      if (docente?.Docente_Carga_Horaria_Maxima != null) {
        const [[bloqueDur]] = await pool.execute(
          `SELECT TIME_TO_SEC(TIMEDIFF(Bloque_Horario_Hora_Fin, Bloque_Horario_Hora_Inicio)) / 3600
             AS duracion FROM bloque_horario WHERE Bloque_Horario_Id = ?`,
          [Bloque_Horario_Id]
        );
        const [[cargaRow]] = await pool.execute(
          `SELECT COALESCE(SUM(
             TIME_TO_SEC(TIMEDIFF(bh.Bloque_Horario_Hora_Fin, bh.Bloque_Horario_Hora_Inicio)) / 3600
           ), 0) AS horas_actuales
           FROM horario_asignatura ha
           JOIN bloque_horario bh ON bh.Bloque_Horario_Id = ha.Bloque_Horario_Id
           WHERE ha.Usuario_Id = ? AND ha.Horario_Asignatura_Estado = 'Activo'
             AND ha.Horario_Asignatura_Id != ?`,
          [Usuario_Id, id]
        );
        const horasActuales = Number(cargaRow.horas_actuales);
        const duracion      = Number(bloqueDur?.duracion || 0);
        const maxHoras      = Number(docente.Docente_Carga_Horaria_Maxima);
        if ((horasActuales + duracion) > maxHoras) {
          return res.status(422).json({
            error: `El docente excedería su carga horaria máxima de ${maxHoras}h semanales `
                 + `(actual: ${horasActuales.toFixed(1)}h, este bloque añade: ${duracion.toFixed(1)}h)`,
          });
        }
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

module.exports = {
  getHorarios, getCursos, getBloques, getAsignaturas, getAsignaturasCurso,
  getDocentes, getDocentesDisponibles,
  createHorario, updateHorario, cambiarEstado,
};
