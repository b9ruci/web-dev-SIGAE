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

module.exports = { getCursos, getNiveles, crearCurso };