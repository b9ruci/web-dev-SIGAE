const express = require('express');
const { getCursos, getNiveles, crearCurso } = require('../controllers/cursoController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/', verifyToken, getCursos);
router.get('/niveles', verifyToken, getNiveles);
router.post('/', verifyToken, verifyAdmin, crearCurso); // solo admins

module.exports = router;