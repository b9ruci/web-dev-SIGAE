const db = require("../config/db");

const getStats = async (req, res) => {
  try {

    const [[usuarios]] = await db.query(
      "SELECT COUNT(*) as total FROM usuario"
    );

    const [[docentes]] = await db.query(
      "SELECT COUNT(*) as total FROM usuario WHERE Es_Docente = 1"
    );

    const [[apoderados]] = await db.query(
      "SELECT COUNT(*) as total FROM usuario WHERE Es_Apoderado = 1"
    );

    const [[estudiantes]] = await db.query(
      "SELECT COUNT(*) as total FROM estudiante"
    );

    const [[cursos]] = await db.query(
      "SELECT COUNT(*) as total FROM curso"
    );

    const [[citaciones]] = await db.query(
      "SELECT COUNT(*) as total FROM citacion"
    );

    res.json({
      usuarios: usuarios.total,
      docentes: docentes.total,
      apoderados: apoderados.total,
      estudiantes: estudiantes.total,
      cursos: cursos.total,
      citaciones: citaciones.total
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: "Error al obtener estadísticas"
    });
  }
};

module.exports = {
  getStats
};