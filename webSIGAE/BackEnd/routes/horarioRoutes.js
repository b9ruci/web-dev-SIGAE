const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
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
  getAsignacionesDocente,
  getHorarioDocente,
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

// CU42: Cursos y asignaturas asignadas a un docente (propias o vistas desde su perfil)
router.get('/docente/:docenteId/asignaciones', getAsignacionesDocente);

// CU43: Horario semanal de un docente a partir de sus cursos asociados (propio o desde su perfil)
router.get('/docente/:docenteId/horario', getHorarioDocente);

// Exportación de horarios (CU60, CU61, CU62) — Super Admin/Admin.
// exportarPorDocente permite además que un Docente exporte su propio
// horario (autorización fina dentro del controlador).
// formato = pdf | excel | png  (query param, ?formato=pdf por defecto)
router.get('/exportar/maestro',            verifyAdmin, exportarMaestro);
router.get('/exportar/docente/:usuarioId', exportarPorDocente);
router.get('/exportar/curso/:cursoId',     verifyAdmin, exportarPorCurso);

// CRUD horario — solo admin puede crear/editar (CU54); la lectura permite
// el filtrado por rol ya implementado dentro de getHorarios.
router.get('/',            getHorarios);
router.post('/',           verifyAdmin, createHorario);
router.put('/:id',         verifyAdmin, updateHorario);
router.patch('/:id/estado', verifyAdmin, cambiarEstado);

module.exports = router;