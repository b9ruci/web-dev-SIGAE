// controllers/estudianteController.js
// Maneja la tabla `estudiante`. El estudiante NO es un usuario del sistema,
// no tiene login. Es solo una ficha con información académica.

const db = require('../config/db');

// Obtener todos los estudiantes
const getEstudiantes = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM estudiante');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estudiantes' });
  }
};

// Obtener un estudiante por ID
const getEstudianteById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM estudiante WHERE Estudiante_Id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el estudiante' });
  }
};

// Crear ficha estudiantil
const createEstudiante = async (req, res) => {
  const {
    Estudiante_Nombre_Completo,
    Estudiante_RUT,
    Curso_Id,
    Estudiante_Estado_Academico,
    Apoderado_Usuario_Id,
  } = req.body;

  if (!Estudiante_Nombre_Completo || !Estudiante_RUT || !Curso_Id || !Estudiante_Estado_Academico) {
    return res.status(400).json({ mensaje: 'Faltan campos obligatorios (nombre, RUT, curso, estado académico)' });
  }

  try {
    // Verificar RUT duplicado
    const [existe] = await db.query(
      'SELECT Estudiante_Id FROM estudiante WHERE Estudiante_RUT = ?',
      [Estudiante_RUT]
    );
    if (existe.length > 0) {
      return res.status(400).json({ mensaje: 'Ya existe un estudiante con ese RUT' });
    }

    // Verificar que el curso existe
    const [curso] = await db.query('SELECT Curso_Id FROM curso WHERE Curso_Id = ?', [Curso_Id]);
    if (curso.length === 0) {
      return res.status(404).json({ mensaje: `No se encontró el curso con Id ${Curso_Id}` });
    }

    const [resultado] = await db.query(
      `INSERT INTO estudiante (
        Estudiante_Nombre_Completo,
        Estudiante_RUT,
        Curso_Id,
        Estudiante_Estado_Academico,
        Apoderado_Usuario_Id
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        Estudiante_Nombre_Completo,
        Estudiante_RUT,
        Curso_Id,
        Estudiante_Estado_Academico,
        Apoderado_Usuario_Id || null,
      ]
    );

    const [nuevo] = await db.query(
      'SELECT * FROM estudiante WHERE Estudiante_Id = ?',
      [resultado.insertId]
    );
    res.status(201).json(nuevo[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al registrar el estudiante' });
  }
};

// Actualizar ficha estudiantil
const updateEstudiante = async (req, res) => {
  const { id } = req.params;
  const datos = req.body;
  delete datos.Estudiante_Id;

  try {
    const [existe] = await db.query('SELECT Estudiante_Id FROM estudiante WHERE Estudiante_Id = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    }

    const campos  = Object.keys(datos).map(c => `${c} = ?`);
    const valores = [...Object.values(datos), id];

    if (campos.length === 0) {
      return res.status(400).json({ mensaje: 'No hay campos para actualizar' });
    }

    await db.query(
      `UPDATE estudiante SET ${campos.join(', ')} WHERE Estudiante_Id = ?`,
      valores
    );

    const [actualizado] = await db.query('SELECT * FROM estudiante WHERE Estudiante_Id = ?', [id]);
    res.json(actualizado[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al actualizar el estudiante' });
  }
};

// Eliminar ficha estudiantil
const deleteEstudiante = async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('DELETE FROM estudiante WHERE Estudiante_Id = ?', [id]);
    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    }
    res.json({ mensaje: 'Ficha estudiantil eliminada correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al eliminar el estudiante' });
  }
};

module.exports = {
  getEstudiantes,
  getEstudianteById,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
};
