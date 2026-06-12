const pool = require('../config/db');

// ── GET /api/planes  ─────────────────────────────────────────────
const getPlanes = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        pe.Plan_Educativo_Id,
        pe.Plan_Educativo_Periodo_Lectivo,
        pe.Nivel_Educativo_Id,
        ne.Nivel_Educativo_Nombre,
        COUNT(ia.IncluyeAsig_Id) AS total_asignaturas
      FROM plan_educativo pe
      JOIN nivel_educativo ne ON ne.Nivel_Educativo_Id = pe.Nivel_Educativo_Id
      LEFT JOIN incluyeasig ia ON ia.Plan_Educativo_Id = pe.Plan_Educativo_Id
      GROUP BY pe.Plan_Educativo_Id, pe.Plan_Educativo_Periodo_Lectivo,
               pe.Nivel_Educativo_Id, ne.Nivel_Educativo_Nombre
      ORDER BY ne.Nivel_Educativo_Nombre, pe.Plan_Educativo_Periodo_Lectivo DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('getPlanes:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/planes/:id  ─────────────────────────────────────────
const getPlanById = async (req, res) => {
  const { id } = req.params;
  try {
    const [planes] = await pool.execute(`
      SELECT pe.Plan_Educativo_Id, pe.Plan_Educativo_Periodo_Lectivo,
             pe.Nivel_Educativo_Id, ne.Nivel_Educativo_Nombre
      FROM plan_educativo pe
      JOIN nivel_educativo ne ON ne.Nivel_Educativo_Id = pe.Nivel_Educativo_Id
      WHERE pe.Plan_Educativo_Id = ?
    `, [id]);

    if (planes.length === 0) {
      return res.status(404).json({ error: 'Plan educativo no encontrado' });
    }

    const [asignaturas] = await pool.execute(`
      SELECT ia.IncluyeAsig_Id, ia.Horas_Semanales_Requeridas, ia.Tipo,
             a.Asignatura_Id, a.Asignatura_Nombre, a.Asignatura_Prioridad_Academica
      FROM incluyeasig ia
      JOIN asignatura a ON a.Asignatura_Id = ia.Asignatura_Id
      WHERE ia.Plan_Educativo_Id = ?
      ORDER BY ia.Tipo, a.Asignatura_Nombre
    `, [id]);

    res.json({ ...planes[0], asignaturas });
  } catch (err) {
    console.error('getPlanById:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── POST /api/planes  ── CU46
const crearPlan = async (req, res) => {
  const { nivel_educativo_id, periodo_lectivo, asignaturas } = req.body;

  if (!nivel_educativo_id || !periodo_lectivo) {
    return res.status(400).json({ error: 'El nivel educativo y el periodo lectivo son obligatorios' });
  }
  if (!Array.isArray(asignaturas) || asignaturas.length === 0) {
    return res.status(400).json({ error: 'El plan debe incluir al menos una asignatura' });
  }

  const periodo = periodo_lectivo.toString().trim();

  for (const a of asignaturas) {
    if (!a.asignatura_id || !a.tipo || !a.horas_semanales) {
      return res.status(400).json({ error: 'Cada asignatura requiere asignatura_id, tipo y horas_semanales' });
    }
    const horas = Number(a.horas_semanales);
    if (!Number.isInteger(horas) || horas < 1) {
      return res.status(400).json({ error: 'Las horas semanales deben ser un número entero mayor a 0' });
    }
    if (!['Obligatorio', 'Complementario'].includes(a.tipo)) {
      return res.status(400).json({ error: 'El tipo debe ser "Obligatorio" o "Complementario"' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [niveles] = await conn.execute(
      'SELECT Nivel_Educativo_Nombre FROM nivel_educativo WHERE Nivel_Educativo_Id = ?',
      [nivel_educativo_id]
    );
    if (niveles.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nivel educativo no encontrado' });
    }

    const [planExistente] = await conn.execute(
      'SELECT Plan_Educativo_Id FROM plan_educativo WHERE Nivel_Educativo_Id = ? AND Plan_Educativo_Periodo_Lectivo = ?',
      [nivel_educativo_id, periodo]
    );
    if (planExistente.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        error: `Ya existe un plan educativo para ${niveles[0].Nivel_Educativo_Nombre} en el periodo ${periodo}`
      });
    }

    const idsAsig = asignaturas.map(a => a.asignatura_id);
    const placeholders = idsAsig.map(() => '?').join(',');
    const [asigExistentes] = await conn.execute(
      `SELECT Asignatura_Id FROM asignatura WHERE Asignatura_Id IN (${placeholders})`,
      idsAsig
    );
    if (asigExistentes.length !== idsAsig.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'Una o más asignaturas seleccionadas no existen en el sistema' });
    }

    const idSet = new Set(idsAsig);
    if (idSet.size !== idsAsig.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'No puede incluir la misma asignatura más de una vez en el plan' });
    }

    const [resultPlan] = await conn.execute(
      'INSERT INTO plan_educativo (Plan_Educativo_Periodo_Lectivo, Nivel_Educativo_Id) VALUES (?, ?)',
      [periodo, nivel_educativo_id]
    );
    const planId = resultPlan.insertId;

    for (const a of asignaturas) {
      await conn.execute(
        'INSERT INTO incluyeasig (Horas_Semanales_Requeridas, Tipo, Asignatura_Id, Plan_Educativo_Id) VALUES (?, ?, ?, ?)',
        [Number(a.horas_semanales), a.tipo, a.asignatura_id, planId]
      );
    }

    await conn.commit();
    res.status(201).json({
      mensaje: `Plan educativo para ${niveles[0].Nivel_Educativo_Nombre} – ${periodo} creado correctamente`,
      plan_id: planId
    });
  } catch (err) {
    await conn.rollback();
    console.error('crearPlan:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

// ── POST /api/planes/clonar  ── CU47
const clonarPlan = async (req, res) => {
  const { plan_origen_id, nuevo_periodo_lectivo, nivel_educativo_id, asignaturas } = req.body;

  if (!plan_origen_id || !nuevo_periodo_lectivo || !nivel_educativo_id) {
    return res.status(400).json({ error: 'plan_origen_id, nuevo_periodo_lectivo y nivel_educativo_id son obligatorios' });
  }

  const periodo = nuevo_periodo_lectivo.toString().trim();

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [planOrigen] = await conn.execute(`
      SELECT pe.Plan_Educativo_Id, pe.Plan_Educativo_Periodo_Lectivo,
             ne.Nivel_Educativo_Nombre
      FROM plan_educativo pe
      JOIN nivel_educativo ne ON ne.Nivel_Educativo_Id = pe.Nivel_Educativo_Id
      WHERE pe.Plan_Educativo_Id = ?
    `, [plan_origen_id]);

    if (planOrigen.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'El plan origen seleccionado no existe' });
    }

    const [nivelDestino] = await conn.execute(
      'SELECT Nivel_Educativo_Nombre FROM nivel_educativo WHERE Nivel_Educativo_Id = ?',
      [nivel_educativo_id]
    );
    if (nivelDestino.length === 0) {
      await conn.rollback();
      return res.status(404).json({ error: 'Nivel educativo de destino no encontrado' });
    }

    const [planExistente] = await conn.execute(
      'SELECT Plan_Educativo_Id FROM plan_educativo WHERE Nivel_Educativo_Id = ? AND Plan_Educativo_Periodo_Lectivo = ?',
      [nivel_educativo_id, periodo]
    );
    if (planExistente.length > 0) {
      await conn.rollback();
      return res.status(409).json({
        error: `Ya existe un plan educativo para ${nivelDestino[0].Nivel_Educativo_Nombre} en el periodo ${periodo}`
      });
    }

    let asignaturasFinales = asignaturas;
    if (!Array.isArray(asignaturasFinales) || asignaturasFinales.length === 0) {
      const [asigOrigen] = await conn.execute(
        'SELECT Asignatura_Id, Tipo, Horas_Semanales_Requeridas FROM incluyeasig WHERE Plan_Educativo_Id = ?',
        [plan_origen_id]
      );
      asignaturasFinales = asigOrigen.map(a => ({
        asignatura_id   : a.Asignatura_Id,
        tipo            : a.Tipo,
        horas_semanales : a.Horas_Semanales_Requeridas,
      }));
    }

    if (asignaturasFinales.length === 0) {
      await conn.rollback();
      return res.status(400).json({ error: 'El plan clonado debe contener al menos una asignatura' });
    }

    for (const a of asignaturasFinales) {
      const horas = Number(a.horas_semanales);
      if (!a.asignatura_id || !a.tipo || !a.horas_semanales) {
        await conn.rollback();
        return res.status(400).json({ error: 'Cada asignatura requiere asignatura_id, tipo y horas_semanales' });
      }
      if (!Number.isInteger(horas) || horas < 1) {
        await conn.rollback();
        return res.status(400).json({ error: 'Las horas semanales deben ser un número entero mayor a 0' });
      }
      if (!['Obligatorio', 'Complementario'].includes(a.tipo)) {
        await conn.rollback();
        return res.status(400).json({ error: 'El tipo debe ser "Obligatorio" o "Complementario"' });
      }
    }

    const [resultPlan] = await conn.execute(
      'INSERT INTO plan_educativo (Plan_Educativo_Periodo_Lectivo, Nivel_Educativo_Id) VALUES (?, ?)',
      [periodo, nivel_educativo_id]
    );
    const nuevoPlanId = resultPlan.insertId;

    for (const a of asignaturasFinales) {
      await conn.execute(
        'INSERT INTO incluyeasig (Horas_Semanales_Requeridas, Tipo, Asignatura_Id, Plan_Educativo_Id) VALUES (?, ?, ?, ?)',
        [Number(a.horas_semanales), a.tipo, a.asignatura_id, nuevoPlanId]
      );
    }

    await conn.commit();
    res.status(201).json({
      mensaje: `Plan educativo clonado correctamente para ${nivelDestino[0].Nivel_Educativo_Nombre} – ${periodo}`,
      plan_id: nuevoPlanId,
      origen : planOrigen[0].Plan_Educativo_Periodo_Lectivo,
    });
  } catch (err) {
    await conn.rollback();
    console.error('clonarPlan:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
};

// ── GET /api/planes/niveles-sin-plan  ────────────────────────────
const getNivelesSinPlan = async (req, res) => {
  const { periodo } = req.query;
  if (!periodo) {
    return res.status(400).json({ error: 'El parámetro periodo es obligatorio' });
  }
  try {
    const [rows] = await pool.execute(`
      SELECT ne.Nivel_Educativo_Id, ne.Nivel_Educativo_Nombre
      FROM nivel_educativo ne
      WHERE ne.Nivel_Educativo_Id NOT IN (
        SELECT Nivel_Educativo_Id FROM plan_educativo
        WHERE Plan_Educativo_Periodo_Lectivo = ?
      )
      ORDER BY ne.Nivel_Educativo_Nombre
    `, [periodo]);
    res.json(rows);
  } catch (err) {
    console.error('getNivelesSinPlan:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ── GET /api/planes/asignaturas  ─────────────────────────────────
const getAsignaturas = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT Asignatura_Id, Asignatura_Nombre, Asignatura_Prioridad_Academica FROM asignatura ORDER BY Asignatura_Nombre'
    );
    res.json(rows);
  } catch (err) {
    console.error('getAsignaturas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getPlanes, getPlanById, crearPlan, clonarPlan, getNivelesSinPlan, getAsignaturas };
