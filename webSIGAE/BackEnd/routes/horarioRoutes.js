const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getHorarios,
  getCursos,
  getBloques,
  getAsignaturas,
  getAsignaturasCurso,
  getDocentes,
  getDocentesDisponibles,
  createHorario,
  updateHorario,
  cambiarEstado,
  getResumenCursos,
} = require('../controllers/horarioController');

// CU 60-62 — Exportación de horarios (maestro / por docente / por curso)
const {
  exportarMaestro,
  exportarPorDocente,
  exportarPorCurso,
} = require('../controllers/exportController');

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Datos de apoyo para formularios
router.get('/resumen-cursos',        getResumenCursos);
router.get('/cursos',                getCursos);
router.get('/bloques',               getBloques);
router.get('/asignaturas',           getAsignaturas);
router.get('/asignaturas-curso',     getAsignaturasCurso);
router.get('/docentes',              getDocentes);
router.get('/docentes-disponibles',  getDocentesDisponibles);

// Exportación de horarios (CU60, CU61, CU62)
// formato = pdf | excel | png  (query param, ?formato=pdf por defecto)
router.get('/exportar/maestro',            exportarMaestro);
router.get('/exportar/docente/:usuarioId', exportarPorDocente);
router.get('/exportar/curso/:cursoId',     exportarPorCurso);

// CRUD horario
router.get('/',            getHorarios);
router.post('/',           createHorario);
router.put('/:id',         updateHorario);
router.patch('/:id/estado', cambiarEstado);

module.exports = router;