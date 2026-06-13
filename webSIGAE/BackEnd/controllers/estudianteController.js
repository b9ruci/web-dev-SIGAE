// controllers/estudianteController.js
// Maneja la tabla `estudiante`. El estudiante NO es un usuario del sistema,
// no tiene login. Es solo una ficha con información académica.

const db = require('../config/db');
const { validarRut } = require('../middleware/validation');

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

  if (!validarRut(Estudiante_RUT)) {
    return res.status(400).json({ mensaje: 'RUT de estudiante inválido (verifique el dígito verificador)' });
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

const CAMPOS_EDITABLES_ESTUDIANTE = new Set([
  'Estudiante_Nombre_Completo',
  'Estudiante_RUT',
  'Curso_Id',
  'Estudiante_Estado_Academico',
  'Apoderado_Usuario_Id',
]);

// Actualizar ficha estudiantil
const updateEstudiante = async (req, res) => {
  const { id } = req.params;
  const datos = { ...req.body };
  delete datos.Estudiante_Id;

  const datosFiltrados = Object.fromEntries(
    Object.entries(datos).filter(([k]) => CAMPOS_EDITABLES_ESTUDIANTE.has(k))
  );

  if (Object.keys(datosFiltrados).length === 0) {
    return res.status(400).json({ mensaje: 'No hay campos válidos para actualizar' });
  }

  try {
    const [existe] = await db.query('SELECT Estudiante_Id FROM estudiante WHERE Estudiante_Id = ?', [id]);
    if (existe.length === 0) {
      return res.status(404).json({ mensaje: 'Estudiante no encontrado' });
    }

    const campos  = Object.keys(datosFiltrados).map(c => `${c} = ?`);
    const valores = [...Object.values(datosFiltrados), id];

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

// ── NUEVAS FUNCIONES ─────────────────────────────────────────────────────────

// Obtener estudiantes sin apoderado asignado (para el selector del modal)
const getEstudiantesSinApoderado = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT
        e.Estudiante_Id,
        e.Estudiante_Nombre_Completo,
        e.Estudiante_RUT,
        e.Estudiante_Estado_Academico,
        c.Curso_Nombre
       FROM estudiante e
       JOIN curso c ON e.Curso_Id = c.Curso_Id
       WHERE e.Apoderado_Usuario_Id IS NULL
       ORDER BY e.Estudiante_Nombre_Completo ASC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener estudiantes sin apoderado' });
  }
};

// Asignar apoderado a uno o más estudiantes (CU 7 y CU 8)
// Body: { apoderadoId: number, estudianteIds: number[] }
const asignarApoderado = async (req, res) => {
  const { apoderadoId, estudianteIds } = req.body;

  if (!apoderadoId || !Array.isArray(estudianteIds) || estudianteIds.length === 0) {
    return res.status(400).json({
      mensaje: 'Se requiere apoderadoId y al menos un estudianteId',
    });
  }

  const conn = await db.getConnection();
  try {
    const [apoderado] = await conn.query(
      `SELECT Usuario_Id, Usuario_Nombre_Completo, Es_Apoderado, Usuario_Estado_Cuenta
       FROM usuario WHERE Usuario_Id = ?`,
      [apoderadoId]
    );

    if (apoderado.length === 0)
      return res.status(404).json({ mensaje: 'Apoderado no encontrado' });
    if (!apoderado[0].Es_Apoderado)
      return res.status(400).json({ mensaje: 'El usuario seleccionado no tiene rol de apoderado' });
    if (!apoderado[0].Usuario_Estado_Cuenta)
      return res.status(400).json({ mensaje: 'El apoderado seleccionado está inactivo' });

    await conn.beginTransaction();

    const asignados     = [];
    const omitidos      = [];
    const noEncontrados = [];

    for (const estudianteId of estudianteIds) {
      const [estudiante] = await conn.query(
        'SELECT Estudiante_Id, Estudiante_Nombre_Completo, Apoderado_Usuario_Id FROM estudiante WHERE Estudiante_Id = ?',
        [estudianteId]
      );

      if (estudiante.length === 0) {
        noEncontrados.push(estudianteId);
        continue;
      }

      if (estudiante[0].Apoderado_Usuario_Id === apoderadoId) {
        omitidos.push(estudiante[0].Estudiante_Nombre_Completo);
        continue;
      }

      await conn.query(
        'UPDATE estudiante SET Apoderado_Usuario_Id = ? WHERE Estudiante_Id = ?',
        [apoderadoId, estudianteId]
      );
      asignados.push(estudiante[0].Estudiante_Nombre_Completo);
    }

    await conn.commit();
    res.json({
      mensaje      : 'Proceso completado',
      asignados    : asignados.length,
      omitidos     : omitidos.length,
      noEncontrados: noEncontrados.length,
      detalle      : { asignados, omitidos, noEncontrados },
    });
  } catch (error) {
    await conn.rollback().catch(() => {});
    console.error(error);
    res.status(500).json({ mensaje: 'Error al asignar apoderado' });
  } finally {
    conn.release();
  }
};

module.exports = {
  getEstudiantes,
  getEstudianteById,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
  getEstudiantesSinApoderado,
  asignarApoderado,
};
