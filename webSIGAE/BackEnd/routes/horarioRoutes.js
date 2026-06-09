const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getHorarios,
  getCursos,
  getBloques,
  getAsignaturas,
  getDocentes,
  createHorario,
  updateHorario,
  cambiarEstado,
} = require('../controllers/horarioController');

const router = express.Router();

// Todos los endpoints requieren autenticación
router.use(verifyToken);

// Datos de apoyo para formularios
router.get('/cursos',      getCursos);
router.get('/bloques',     getBloques);
router.get('/asignaturas', getAsignaturas);
router.get('/docentes',    getDocentes);

// CRUD horario
router.get('/',            getHorarios);
router.post('/',           createHorario);
router.put('/:id',         updateHorario);
router.patch('/:id/estado', cambiarEstado);

module.exports = router;
