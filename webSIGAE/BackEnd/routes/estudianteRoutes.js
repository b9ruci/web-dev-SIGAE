const express = require('express');
const router  = express.Router();

const estudianteController = require('../controllers/estudianteController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');

router.get('/',               verifyToken,             estudianteController.getEstudiantes);
router.get('/verificar-rut', verifyToken, verifyAdmin, estudianteController.verificarRut);
router.get('/sin-apoderado', verifyToken, verifyAdmin, estudianteController.getEstudiantesSinApoderado);
router.get('/:id',           verifyToken,             estudianteController.getEstudianteById);
router.post('/',   verifyToken, verifyAdmin, estudianteController.createEstudiante);
router.post('/asignar-apoderado', verifyToken, verifyAdmin, estudianteController.asignarApoderado);
router.delete('/apoderado/:apoderadoId/todas', verifyToken, verifyAdmin, estudianteController.eliminarTodasAsociacionesApoderado);
// CU40: el propio Apoderado o un Admin/SuperAdmin (autorización fina dentro del controlador)
router.get('/apoderado/:apoderadoId/asociados', verifyToken, estudianteController.getEstudiantesAsociados);
router.delete('/:estudianteId/apoderado', verifyToken, verifyAdmin, estudianteController.eliminarAsociacionEspecifica);
// CU39: reasignar o quitar el apoderado de un estudiante puntual
router.put('/:estudianteId/apoderado', verifyToken, verifyAdmin, estudianteController.editarAsociaciones);
router.put('/:id', verifyToken, verifyAdmin, estudianteController.updateEstudiante);
router.delete('/:id', verifyToken, verifyAdmin, estudianteController.deleteEstudiante);

module.exports = router;
