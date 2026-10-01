const express = require('express');
const { verifyToken } = require('../middleware/authMiddleware');
const {
  getCitaciones,
  getCitacionesPendientes,
  getDetalleCitacion,
  crearCitacion,
  confirmarCitacion,
  cancelarCitacion,
  reprogramarCitacion,
  getHistorialCitaciones,
} = require('../controllers/citacionController');

const router = express.Router();

// Todos los endpoints requieren autenticación; la autorización por rol y por
// participación en la citación se resuelve dentro del controlador.
router.use(verifyToken);

// CU78: agenda del usuario según su rol activo (?rol=Docente|Apoderado)
router.get('/', getCitaciones);
// CU75: solicitudes pendientes de confirmación del usuario — debe estar ANTES de /:id
router.get('/pendientes', getCitacionesPendientes);
// CU79: historial completo de citaciones de un estudiante (también Admin/Super Admin)
router.get('/estudiante/:estudianteId/historial', getHistorialCitaciones);
// CU76 / CU77: detalle de una citación
router.get('/:id', getDetalleCitacion);

// CU74: crear citación (Docente)
router.post('/', crearCitacion);
// CU75: confirmar citación
router.patch('/:id/confirmar', confirmarCitacion);
// CU76: cancelar citación con motivo obligatorio
router.patch('/:id/cancelar', cancelarCitacion);
// CU77: reprogramar fecha y/o tramo
router.patch('/:id/reprogramar', reprogramarCitacion);

module.exports = router;
