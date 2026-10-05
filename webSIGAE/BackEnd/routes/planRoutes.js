const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
  getPlanes,
  getPlanById,
  crearPlan,
  editarPlan,
  clonarPlan,
  getNivelesSinPlan,
  getAsignaturas,
  crearAsignatura,
  editarAsignatura,
} = require('../controllers/planController');

const router = express.Router();

router.use(verifyToken);

router.get('/niveles-sin-plan',   verifyAdmin, getNivelesSinPlan);
router.get('/asignaturas',        verifyAdmin, getAsignaturas);
router.post('/asignaturas',       verifyAdmin, crearAsignatura);
router.put('/asignaturas/:id',    verifyAdmin, editarAsignatura);
router.get('/',                   verifyAdmin, getPlanes);
router.get('/:id',                verifyAdmin, getPlanById);
router.post('/clonar',            verifyAdmin, clonarPlan);
router.post('/',                  verifyAdmin, crearPlan);
router.put('/:id',                verifyAdmin, editarPlan);

module.exports = router;
