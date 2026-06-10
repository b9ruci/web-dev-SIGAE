const express = require('express');
const router  = express.Router();
const estudianteController = require('../controllers/estudianteController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

// Cualquier usuario autenticado puede consultar estudiantes
router.get('/',    verifyToken, estudianteController.getEstudiantes);
router.get('/:id', verifyToken, estudianteController.getEstudianteById);

// Solo Administrador puede crear, modificar o eliminar fichas estudiantiles
router.post('/',   verifyToken, verifyAdmin, estudianteController.createEstudiante);
router.put('/:id', verifyToken, verifyAdmin, estudianteController.updateEstudiante);
router.delete('/:id', verifyToken, verifyAdmin, estudianteController.deleteEstudiante);

module.exports = router;
