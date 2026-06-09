const pool = require('../config/db');

// GET /api/cursos
const getCursos = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT c.Curso_Id, c.Curso_Seccion, c.Curso_Nombre,
             c.Nivel_Educativo_Id, n.Nivel_Educativo_Nombre
      FROM curso c
      JOIN nivel_educativo n ON c.Nivel_Educativo_Id = n.Nivel_Educativo_Id
      ORDER BY n.Nivel_Educativo_Id, c.Curso_Seccion
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener cursos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/cursos/niveles
const getNiveles = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM nivel_educativo ORDER BY Nivel_Educativo_Id'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener niveles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/cursos
const crearCurso = async (req, res) => {
  const { nivel_educativo_id, seccion } = req.body;

  if (!nivel_educativo_id || !seccion) {
    return res.status(400).json({ error: 'Nivel educativo y sección son requeridos' });
  }

  const seccionUpper = seccion.trim().toUpperCase();
  if (!/^[A-Z]$/.test(seccionUpper)) {
    return res.status(400).json({ error: 'La sección debe ser una letra (A-Z)' });
  }

  try {
    // Verificar que el nivel existe
    const [niveles] = await pool.execute(
      'SELECT Nivel_Educativo_Nombre FROM nivel_educativo WHERE Nivel_Educativo_Id = ?',
      [nivel_educativo_id]
    );
    if (niveles.length === 0) {
      return res.status(400).json({ error: 'Nivel educativo no encontrado' });
    }

    const nombreNivel = niveles[0].Nivel_Educativo_Nombre;
    const nombreCurso = `${nombreNivel} ${seccionUpper}`;

    // Verificar que no exista el mismo curso
    const [existe] = await pool.execute(
      'SELECT Curso_Id FROM curso WHERE Curso_Nombre = ?',
      [nombreCurso]
    );
    if (existe.length > 0) {
      return res.status(409).json({ error: `El curso "${nombreCurso}" ya existe` });
    }

    await pool.execute(
      'INSERT INTO curso (Curso_Seccion, Curso_Nombre, Nivel_Educativo_Id) VALUES (?, ?, ?)',
      [seccionUpper, nombreCurso, nivel_educativo_id]
    );

    res.status(201).json({ mensaje: `Curso "${nombreCurso}" registrado correctamente` });
  } catch (error) {
    console.error('Error al crear curso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/cursos/:id/asignaturas
const getAsignaturasDeCurso = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.execute(`
      SELECT ta.tieneasig_Id, ta.Estado_Asignacion,
             a.Asignatura_Id, a.Asignatura_Nombre, a.Asignatura_Prioridad_Academica
      FROM tieneasig ta
      JOIN asignatura a ON ta.Asignatura_Id = a.Asignatura_Id
      WHERE ta.Curso_Id = ?
      ORDER BY a.Asignatura_Nombre
    `, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener asignaturas del curso:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// GET /api/cursos/:id/asignaturas/disponibles
const getAsignaturasDisponibles = async (req, res) => {
  const { id } = req.params;
  try {
    const [cursos] = await pool.execute(
      'SELECT Nivel_Educativo_Id FROM curso WHERE Curso_Id = ?', [id]
    );
    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    const nivelId = cursos[0].Nivel_Educativo_Id;

    const [planes] = await pool.execute(
      'SELECT Plan_Educativo_Id FROM plan_educativo WHERE Nivel_Educativo_Id = ?', [nivelId]
    );
    if (planes.length === 0) {
      return res.status(404).json({ error: 'El curso no posee un plan educativo asociado' });
    }
    const planId = planes[0].Plan_Educativo_Id;

    const [rows] = await pool.execute(`
      SELECT a.Asignatura_Id, a.Asignatura_Nombre, a.Asignatura_Prioridad_Academica,
             ia.Horas_Semanales_Requeridas, ia.Tipo
      FROM incluyeasig ia
      JOIN asignatura a ON ia.Asignatura_Id = a.Asignatura_Id
      WHERE ia.Plan_Educativo_Id = ?
        AND a.Asignatura_Id NOT IN (
          SELECT Asignatura_Id FROM tieneasig
          WHERE Curso_Id = ? AND Estado_Asignacion = 'Activa'
        )
      ORDER BY a.Asignatura_Nombre
    `, [planId, id]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener asignaturas disponibles:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// POST /api/cursos/:id/asignaturas
const asignarAsignaturas = async (req, res) => {
  const { id } = req.params;
  const { asignaturas } = req.body;

  if (!Array.isArray(asignaturas) || asignaturas.length === 0) {
    return res.status(400).json({ error: 'Debe seleccionar al menos una asignatura' });
  }

  try {
    const [cursos] = await pool.execute(
      'SELECT Nivel_Educativo_Id FROM curso WHERE Curso_Id = ?', [id]
    );
    if (cursos.length === 0) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    const nivelId = cursos[0].Nivel_Educativo_Id;

    const [planes] = await pool.execute(
      'SELECT Plan_Educativo_Id FROM plan_educativo WHERE Nivel_Educativo_Id = ?', [nivelId]
    );
    if (planes.length === 0) {
      return res.status(404).json({ error: 'El curso no posee un plan educativo asociado' });
    }
    const planId = planes[0].Plan_Educativo_Id;

    const [asignaturasDelPlan] = await pool.execute(
      'SELECT Asignatura_Id FROM incluyeasig WHERE Plan_Educativo_Id = ?', [planId]
    );
    const idsValidos = new Set(asignaturasDelPlan.map(a => a.Asignatura_Id));

    const duplicadas = [];
    const insertadas = [];

    for (const item of asignaturas) {
      const asigId = item.asignatura_id;
      const estado = item.estado === 'Inactiva' ? 'Inactiva' : 'Activa';

      if (!idsValidos.has(asigId)) {
        return res.status(400).json({
          error: `La asignatura ID ${asigId} no pertenece al plan educativo del curso`
        });
      }

      const [existente] = await pool.execute(
        'SELECT tieneasig_Id FROM tieneasig WHERE Curso_Id = ? AND Asignatura_Id = ? AND Estado_Asignacion = "Activa"',
        [id, asigId]
      );
      if (existente.length > 0) {
        duplicadas.push(asigId);
        continue;
      }

      await pool.execute(
        'INSERT INTO tieneasig (Estado_Asignacion, Curso_Id, Asignatura_Id) VALUES (?, ?, ?)',
        [estado, id, asigId]
      );
      insertadas.push(asigId);
    }

    if (insertadas.length === 0 && duplicadas.length > 0) {
      return res.status(409).json({ error: 'Todas las asignaturas seleccionadas ya están asociadas al curso con estado activo' });
    }

    res.status(201).json({
      mensaje: `Se asociaron ${insertadas.length} asignatura(s) al curso correctamente`,
      insertadas,
      duplicadas
    });
  } catch (error) {
    console.error('Error al asignar asignaturas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { getCursos, getNiveles, crearCurso, getAsignaturasDeCurso, getAsignaturasDisponibles, asignarAsignaturas };