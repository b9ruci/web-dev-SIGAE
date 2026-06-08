const express = require('express');
const { getCursos, getNiveles, crearCurso, getAsignaturasDeCurso, getAsignaturasDisponibles, asignarAsignaturas } = require('../controllers/cursoController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getCursos);
router.get('/niveles', verifyToken, getNiveles);
router.post('/', verifyToken, verifyAdmin, crearCurso);

router.get('/:id/asignaturas/disponibles', verifyToken, getAsignaturasDisponibles);
router.get('/:id/asignaturas', verifyToken, getAsignaturasDeCurso);
router.post('/:id/asignaturas', verifyToken, verifyAdmin, asignarAsignaturas);

module.exports = router;