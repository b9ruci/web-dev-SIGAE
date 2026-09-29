const express = require('express');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const {
  getParametros, updateParametros,
  getBloques, createBloque, updateBloque, deleteBloque, deleteMultiplesBloques,
  getEventos, createEvento, updateEvento, deleteEvento,
  getBloquesAfectadosPorEvento,
} = require('../controllers/bloquesController');

const router = express.Router();

router.use(verifyToken);

// Parámetros institucionales (CU53) — solo admin
router.get('/parametros',       getParametros);
router.put('/parametros',       verifyAdmin, updateParametros);

// Bloques horarios (CU49, CU50, CU51) — solo admin para escritura
// CU51 debe ir antes de '/:id' para no ser capturada por el parámetro
router.get('/',                 getBloques);
router.post('/',                verifyAdmin, createBloque);
router.delete('/multiples',     verifyAdmin, deleteMultiplesBloques);
router.put('/:id',              verifyAdmin, updateBloque);
router.delete('/:id',           verifyAdmin, deleteBloque);

// Eventos institucionales (CU70, CU71, CU72) — solo admin para escritura
router.get('/eventos',                    getEventos);
router.get('/eventos/:id/afectados',      getBloquesAfectadosPorEvento);
router.post('/eventos',                   verifyAdmin, createEvento);
router.put('/eventos/:id',                verifyAdmin, updateEvento);
router.delete('/eventos/:id',             verifyAdmin, deleteEvento);

module.exports = router;